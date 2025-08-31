import {BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
// import { useState } from 'react';
// import Login from './pages/Login'
// import Register from './pages/Register'
import Profile from './pages/Profile'
// import CustomCursor from './CustomCursor';
import HomePage from './pages/HomePage'
// import ChatWindow from './pages/ChatWindow'
// import ChatList from './pages/ChatList'
import BrowseSeniors from './pages/BrowseSeniors';
// import SeniorChatList from './pages/SeniorChatList'
import Match from './pages/MatchResults';
import Navbar from './components/navbar';
import LoginSurya from './pages/loginSurya';
import RegisterSurya from './pages/registerSurya';
import ChatPage from './pages/chatPage';
import SeniorProfile from './pages/seniorProfile';
import Contact from './pages/contact'
// import ThamizhProfile from './pages/thamizh_profile'
//thamizh




function App() {
  // const [start,setStart]=useState(true);
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
         pauseOnFocusLoss={false} 
        draggable
        pauseOnHover
        theme="colored"
          style={{ marginTop: "100px" }} 
          

      />
      <Navbar/>
      <Routes>
        {/* <Route path='/Login' element={<Login/>}/> */}
        {/* <Route path = '/Register' element ={<Register/>}/> */}
        <Route path='/Profile' element={<Profile/>}/>
        <Route path='/match' element={<Match/>}/>
        <Route path='/' element={<HomePage/>}/>
        {/* <Route path="/chat/:senderId/:receiverId/:receiver" element={<ChatWindow />} /> */}
        {/* <Route path='/chatlist' element={<ChatList />} /> */}
        <Route path='/browseseniors' element={<BrowseSeniors/>}/>
        {/* <Route path='/seniorchatlist' element={<SeniorChatList />} /> */}
        <Route path='/login' element={<LoginSurya />} />
        <Route path='/register' element={<RegisterSurya />} />
        <Route path='/chatpage' element={<ChatPage />} />
        <Route path='/Profile/:id' element={<SeniorProfile />} />
        <Route path='/contact' element={<Contact />} />
        

        {/* <Route path='/thamizh_profile' element={<ThamizhProfile />} /> */}

        
      </Routes>
    
    </Router>
  );
}

export default App;
