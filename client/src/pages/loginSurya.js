import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import './loginSurya.css';
import Loading from './loading';


function Login() {

  const[isLoading,setIsLoading]=useState(false);
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: '',
    password: ''
  });

  const update = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const response = await axios.post('/login', data);
      console.log(response);


      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', response.data.user.id);
      localStorage.setItem('student', response.data.user.student);
  toast.success('Login successful! Kindly proceed');
  navigate('/profile');
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Login credentials not matched!');
      } else if (err.response?.status === 400) {
        toast.error('Username/password not matched!');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
      setData({ email: '', password: '' });
      console.error('Login failed', err);
    }finally{
      setIsLoading(false);
    }
  };

  if(isLoading){
    return <Loading/>
  }else{
  return (
    <div className="auth-container">
      {/* Branding Section */}
      <div className="branding-section">
        <div className="branding-content">
          <div className="logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9.5V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 9.5L12 4L21 9.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 19V14C7 12.8954 7.89543 12 9 12H15C16.1046 12 17 12.8954 17 14V19" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            EduBridge
          </div>
          <h1>Platform To Find Your Perfect College Match</h1>
          <br />
          
          <hr></hr>
          <br></br>
          <p>Sign in to connect with seniors, explore college options with various features and continue your educational journey.</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="form-section">
        <div className="form-wrapper">
          <h2>Sign In</h2>
          <p className="form-subheading">
            New to Edu Bridge? <Link to="/register">Create an account</Link>
          </p>

          <form onSubmit={submit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="you@example.com" 
                value={data.email} 
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
                value={data.password} 
                onChange={update}
                required 
              />
            </div>
            <div className="form-options">
              <div className="checkbox-group">
                <input type="checkbox" id="remember" name="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <button type="button" className="forgot-password-btn">Forgot password?</button>
            </div>
            <button id="signin" type="submit" className="auth-btn">Sign In</button>
          </form>

          <div className="separator">
            <span>OR</span>
          </div>

          <button className="social-btn">
            <svg className="social-icon" viewBox="0 0 48 48" width="24" height="24">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,36.506,44,30.825,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  )}
}

export default Login;