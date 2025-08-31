import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import './loginSurya.css';
import Loading from './loading';

const RegisterSurya = () => {
  
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    student: '',
    password: ''
  });

  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (notification.message) {
      setNotification({ message: '', type: '' });
    }
  };

  const registering = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.student) {
      toast.error('Enter Valid Credentials!');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('/register', form);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', response.data.user.id);
      localStorage.setItem('student', response.data.user.student);
  toast.success('Registration Successful');
  navigate('/profile');
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('User already exists, proceed to Login!');
        navigate('/login');
      } else if (err.response?.status === 403) {
        toast.error('You are not authorized to perform this action.');
      } else if (err.response?.status === 500) {
        toast.error('Server error! Please try again later.');
      } else {
        toast.error('Server not running!');
      }
      console.log({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };
 if(isLoading){
    return <Loading/>
  }else{
  return (
    <div className="auth-container">
      {/* Left Section: Branding */}
      <div className="branding-section">
        <div className="branding-content">
          <div className="logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 9.5L12 4L21 9.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 19V14C7 12.8954 7.89543 12 9 12H15C16.1046 12 17 12.8954 17 14V19" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            EduBridge
          </div>
          <h1>Platform To Find Your Perfect College Match</h1>
          <br></br>
          
          <hr></hr>
          <br></br>
          <p>Sign up to connect with seniors, explore options, and continue your journey.</p>
        </div>
      </div>

      {/* Right Section: Form */}
      <div className="form-section">
        <div className="form-wrapper">
          <h2 id="registerHead">Create an Account</h2>
          <p className="form-subheading">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>

          <form onSubmit={registering}>
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Your name here"
                value={form.name}
                onChange={update}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={update}
                required
              />
            </div>
            <h5>* Choose "School Student" below to avail the services</h5>
            <div className="input-group">
              <label htmlFor="student">I am a</label>
              <div className="select-wrapper">
                <select
                  id="student"
                  name="student"
                  value={form.student}
                  onChange={update}
                  required
                  className={!form.student ? 'unselected' : ''}
                >
                  <option value="" disabled>Select the student type</option>
                  <option value="school">School Student</option>
                  <option value="college">College Student</option>
                </select>
              </div>
            </div>

            {notification.message && (
              <div className={`notification ${notification.type}`}>
                {notification.message}
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>

          

          
        </div>
      </div>
    </div>
  );}
};

export default RegisterSurya;