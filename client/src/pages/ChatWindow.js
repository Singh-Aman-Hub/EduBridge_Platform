import React, { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from '../axiosConfig';
import './ChatWindow.css';

const ChatWindow = ({ senderId, receiverId, receiver }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    const roomId = useCallback(() => {
        return [senderId, receiverId].sort().join('_');
    }, [senderId, receiverId]);

    useEffect(() => {
        if (!senderId || !receiverId) return;

        if (!socketRef.current) {
            console.log('🔌 Creating new socket connection...');
            socketRef.current = io('http://localhost:3010', {
                auth: { token: localStorage.getItem('token') },
                transports: ['websocket'],
                withCredentials: true,
            });
        }

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Connected to socket:', socket.id);
            socket.emit('joinRoom', { roomId: roomId() });
        });

        const handleReceiveMessage = (message) => {
            if (message.senderId !== senderId) {
                console.log('📥 Received message:', message);
                setMessages((prev) => [...prev, message]);
            } else {
                console.log('Received message sent by current user:', message);
            }
        };

        socket.on('receiveMessage', handleReceiveMessage);

        const fetchChatHistory = async () => {
            try {
                const res = await axios.get(`/api/chats/${senderId}/${receiverId}`);
                setMessages(res.data);
            } catch (err) {
                console.error('❌ Error fetching chat history:', err);
            }
        };
        fetchChatHistory();

        return () => {
            console.log('🚪 Leaving room & removing listener');
            socket.emit('leaveRoom', { roomId: roomId() });
            socket.off('receiveMessage', handleReceiveMessage);
        };
    }, [roomId, senderId, receiverId]);

    const sendMessage = () => {
        if (input.trim() === '') return;

        const newMessage = {
            senderId,
            receiverId,
            text: input,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);

        socketRef.current.emit('sendMessage', {
            roomId: roomId(),
            senderId,
            receiverId,
            text: input,
        });
        

        setInput('');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="chat-window">
            {localStorage.getItem('student') === 'school' ? (
                <div className="chat-header">
                    Ask your Senior - <u>{receiver}</u>
                </div>
            ) : (
                <div className="chat-header">
                    Assist your Junior - <u>{receiver}</u>
                </div>
            )}

            <div className="chat-body">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`message-bubble ${
                            msg.senderId === senderId ? 'sent' : 'received'
                        }`}
                    >
                        {msg.text}
                        <div className="timestamp">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>

            <div className="chat-footer">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') sendMessage();
                    }}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default ChatWindow;