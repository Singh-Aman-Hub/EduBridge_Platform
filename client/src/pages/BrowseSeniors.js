import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../axiosConfig';
import { useNavigate } from 'react-router-dom';
import './BrowseSeniors.css';

const BrowseSeniors = () => {
    const [seniors, setSeniors] = useState([]);
    const [load,setLoad]= useState(true);
    const navigate = useNavigate();

    const loggedInUser = localStorage.getItem('user');
    const student = localStorage.getItem('student');
    const juniorId = loggedInUser;

    useEffect(() => {
        const fetchSeniors = async () => {
            try {
                const res = await axios.get('/allUsers');
                const collegeStudents = res.data.filter(user => user.student === 'college');
                setSeniors(collegeStudents);
            } catch (err) {
                if (err.response?.status === 400) {
                    toast.error("Your session expired, Kindly login again!");
                    localStorage.clear();
                    navigate('/login');
                }
                console.error('Error fetching seniors:', err);
            }finally{
                setLoad(false);
            }
        };
        fetchSeniors();
    }, [navigate]);

    const handleSendMessage = (senior) => {
        localStorage.setItem("chat_receiverId", senior._id);
        localStorage.setItem("chat_receiverName", senior.name);
        localStorage.setItem("chat_senderId", juniorId);
        navigate('/chatpage');
    };

    if(load){
        return(
        <div className='g-load-container'>
            
            <div id="g-loader">
            </div>
            <div id='g-space'></div>
            <h2 align='center' >Just a second buddy!</h2> 
        </div>
        )
    }

    return (
        <div className="browse-seniors-container">
            {student==="school"&&  <h2 className="browse-title">Connect with Seniors</h2>}
            {student==="college" &&  <h2 className="browse-title">Connect with other College Buddies</h2>}
            <div className="senior-grid">
                {seniors.map((senior) => (
                    <div key={senior._id} className="senior-card">
                        <div className="senior-content">
                            <div className="senior-info">
                                <h3>{senior.name}</h3>
                                <p><strong>Field:</strong> {senior.fieldOfStudy || "N/A"}</p>
                                <p><strong>College:</strong> {senior.college || "N/A"}</p>
                                <p><strong>City:</strong> {senior.city || "N/A"}</p>
                                <div className="senior-buttons-row">
                                    <button className="message-btn" onClick={() => navigate(`/profile/${senior._id}`)}>
                                        View Profile
                                    </button>
                                    <button className="message-btn" onClick={() => handleSendMessage(senior)}>
                                        Message
                                    </button>
                                </div>
                            </div>
                            <div className="senior-image-container">
                                <img
                                    src={senior.image || '/Image/default-profile.png'}
                                    alt={`${senior.name}'s profile`}
                                    className="senior-image"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BrowseSeniors;