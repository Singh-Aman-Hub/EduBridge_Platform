import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../axiosConfig';
import { useNavigate } from 'react-router-dom';
import './ChatList.css'; // ✅ Reuse existing CSS

const SeniorChatList = () => {
    const [juniors, setJuniors] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = (localStorage.getItem('user')); // Senior's ID
        const student=(localStorage.getItem('student'));
        if (!userId || student!=="college" ) {
            console.error("❌ No logged-in senior found in localStorage");
            toast.error("Are you kidding? you're a junior!");
            navigate('/chatlist');
            return;
        }

        const fetchJuniors = async () => {
            try {
                const res = await axios.get(`/api/chatslist/${userId}`);
                console.log('✅ Juniors fetched:', res.data);
                setJuniors(res.data);
            } catch (err) {
                if(err.response.status===400){
                toast.error("Your session expired, Kindly login again!");
                localStorage.removeItem("user");
                localStorage.removeItem("student");
                localStorage.removeItem("token");
                navigate('/login');
                }
                console.error('❌ Error fetching juniors:', err);
            }
        };

        fetchJuniors();
    }, [navigate]);

    const handleChatClick = (juniorId) => {
        const seniorId = (localStorage.getItem('user'));
        navigate(`/chat/${seniorId}/${juniorId}`);
    };

    return (
        <div className="chat-list-container">
            <h2 className="chat-list-header">Your Juniors</h2>
            {juniors.length === 0 ? (
                <p className="no-chats-message">No juniors have messaged you yet.</p>
            ) : (
                <ul className="chat-list">
                    {juniors.map((junior, idx) => (
                        <li
                            key={idx}
                            className="chat-list-item"
                            onClick={() => handleChatClick(junior.contactId)}
                        >
                            <div className="chat-details">
                                <div className="chat-name">{junior.name}</div>
                                <div className="chat-last-message">
                                    {junior.lastMessage || "No messages yet"}
                                </div>
                            </div>
                            <button
                                className="open-chat-btn"
                                onClick={(e) => {
                                    e.stopPropagation(); // prevent li click
                                    handleChatClick(junior.contactId);
                                }}
                            >
                                Open Chat
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SeniorChatList;