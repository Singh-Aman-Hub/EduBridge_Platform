import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import axios from '../axiosConfig';
import './ChatList.css';

const ChatList = ({ onChatSelect, refreshChats }) => {
    const [chats, setChats] = useState([]);
    const socketRef = useRef(null);
    const refreshTimerRef = useRef(null);
    const student = localStorage.getItem('student');

    const fetchChats = async () => {
        const userId = localStorage.getItem('user');
        if (!userId) {
            console.error("❌ No logged-in user found in localStorage");
            return;
        }
        try {
            const res = await axios.get(`/api/chatslist/${userId}`);
            console.log("✅ Chat list fetched:", res.data);
            setChats(res.data);
        } catch (err) {
            if (err.response?.status === 400) {
                toast.error("Your session expired, Kindly login again!");
                localStorage.removeItem("user");
                localStorage.removeItem("student");
                localStorage.removeItem("token");
                window.location.href = '/login';
            }
            console.error('❌ Error fetching chat list:', err);
        }
    };

    useEffect(() => {
        const userId = localStorage.getItem('user');
        if (!userId) {
            console.error("❌ No logged-in user found in localStorage");
            return;
        }
        fetchChats();
    }, []);

    useEffect(() => {
        // Trigger refetch when parent toggles refresh flag
        fetchChats();
    }, [refreshChats]);

    // Live updates via socket: join personal room and listen for chatListUpdate
    useEffect(() => {
        const userId = localStorage.getItem('user');
        if (!userId) return;
        if (!socketRef.current) {
            socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:3010', {
                auth: { token: localStorage.getItem('token') },
                transports: ['websocket'],
                withCredentials: true,
            });
        }
        const socket = socketRef.current;
        const joinUserRoom = () => {
            socket.emit('joinRoom', { roomId: String(userId) });
        };
        socket.on('connect', joinUserRoom);
        joinUserRoom();

        const handleChatListUpdate = () => {
            // Debounced refetch to ensure ordering and names are accurate for any message text
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = setTimeout(() => {
                fetchChats();
            }, 200);
        };
        socket.on('chatListUpdate', handleChatListUpdate);

        return () => {
            socket.off('connect', joinUserRoom);
            socket.off('chatListUpdate', handleChatListUpdate);
        };
    }, []);

    const handleChatClick = (contactId, receiverName) => {
        const senderId = localStorage.getItem('user');
        const receiverId = contactId;

        if (onChatSelect) {
            onChatSelect({
                senderId,
                receiverId,
                receiver: receiverName,
            });
        }
    };

    return (
        <div className="chat-list-container">
            <h2 className="chat-list-header">
                Your Chats with {student === 'school' ? 'Seniors' : 'Juniors'}
            </h2>
            {chats.length === 0 ? (
                <p className="no-chats-message">No chats found. Start a conversation!</p>
            ) : (
                <ul className="chat-list">
                    {chats.map((chat, idx) => (
                        <li
                            key={idx}
                            className="chat-list-item"
                            onClick={() => handleChatClick(chat.contactId, chat.name)}
                            
                            
                        >
                            <div className="chat-details" >
                                <strong className="chat-name">{chat.name}</strong>
                                <div className="timestampCL">
                                    {new Date(chat.time).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                                <p className="chat-last-message">
                                    msg: {chat.lastMessage || "No messages yet"}
                                </p>
                                {/* <p>{chat.time}</p> */}
                                
                            </div>
                            {/* <button
                                className="open-chat-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleChatClick(chat.contactId, chat.name);
                                }}
                            >
                                Open Chat
                            </button> */}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ChatList;