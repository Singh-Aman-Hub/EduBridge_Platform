import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from '../axiosConfig';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // for preview
  const [load,setLoad]= useState(true)
  const fileInputRef = useRef(null); // to trigger file input click

  const studentType = localStorage.getItem('student');
  const userId = localStorage.getItem('user');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/protected');
        setProfile(res.data.data);
        setFormData(res.data.data);
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 400) {
          toast.error("Session expired or unauthorized. Please login again.");
          localStorage.clear();
          navigate('/login');
        } else {
          console.error('Fetch error:', err);
        }
      }finally{
        setLoad(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Handle input field changes (excluding image)
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (studentType === 'college') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [name]: value,
        },
      }));
    }
  };

  // Handle file selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file)); // show preview
      setFormData(prev => ({ ...prev, imageFile: file })); // save to formData
    }
  };

  // Handle Save button click
  const handleUpdate = async () => {
    try {
      const route = studentType === 'college' ? `/profile/senior/${userId}` : `/profile/junior/${userId}`;
      const form = new FormData();

      // Append image file if selected
      if (formData.imageFile) {
        form.append('image', formData.imageFile);
      }

      // Append other form fields
      if (studentType === 'college') {
        form.append('college', formData.college || '');
        form.append('fieldOfStudy', formData.fieldOfStudy || '');
        form.append('degree', formData.degree || '');
        form.append('city', formData.city || '');
        form.append('currentFee', formData.currentFee || '');
        form.append('goals', formData.goals || '');
      } else {
        form.append('collegeType', formData.preferences?.collegeType || '');
        form.append('fieldInterest', formData.preferences?.fieldInterest || '');
        form.append('locationPreference', formData.preferences?.locationPreference || '');
      }

      const res = await axios.put(route, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

  toast.success(res.data.msg);
      setEditMode(false);

      // Update local state with new data
      setProfile(prev => ({
        ...prev,
        ...formData,
        image: selectedImage || prev.image,
        preferences: {
          ...formData.preferences,
        },
      }));
    } catch (err) {
      console.error('Update error:', err);
  toast.error("Something went wrong while updating your profile.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
  toast.info("Logged out successfully");
    navigate('/login');
  };

  // if (!profile) return <div className="loading">Loading profile...</div>;

  const renderDetail = (label, value) => (
    <div className="profile-detail">
      <label>{label}</label>
      <p>{value || 'Not Available'}</p>
    </div>
  );

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
    <div className="profile-container">
      <div className="profile-card">
        <div className="left-section">
          <img
            src={selectedImage || profile.image || 'Image/default-profile.png'}
            alt={profile.name}
            className="profile-img"
          />

          {/* Show upload option only in edit mode */}
          {editMode && (
            <>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <button className="upload-btn" onClick={() => fileInputRef.current.click()}>
                {selectedImage ? 'Change Profile Pic' : 'Choose Profile Pic'}
              </button>
            </>
          )}

          <h2 className="profile-name">{profile.name}</h2>
          <span className="profile-type">
            {profile.student === 'college' ? 'Senior Student' : 'Junior Student'}
          </span>
          {(!profile.image) && <h5>* Click on EDIT option to add additional details to profile incl your profile photo!</h5>}
          <br></br>
           <div className="profile-detail">
                <label>Email:   <u>{profile.email}</u></label>
            </div>
        </div>
       

        <div className="right-section">
          

          {profile.student === 'college' ? (
            editMode ? (
              <>
                <div className="profile-edit-label">College Name</div>
                <input name="college" value={formData.college || ''} onChange={handleChange} placeholder="College Name" />
                <div className="profile-edit-label">Field of Study</div>
                <input name="fieldOfStudy" value={formData.fieldOfStudy || ''} onChange={handleChange} placeholder="Field of Study" />
                <div className="profile-edit-label">Degree</div>
                <input name="degree" value={formData.degree || ''} onChange={handleChange} placeholder="Degree" />
                <div className="profile-edit-label">City</div>
                <input name="city" value={formData.city || ''} onChange={handleChange} placeholder="City" />
                <div className="profile-edit-label">Current Fee</div>
                <input name="currentFee" type="number" value={formData.currentFee || ''} onChange={handleChange} placeholder="Current Fee" />
                <div className="profile-edit-label">Future Goals</div>
                <textarea name="goals" rows="3" value={formData.goals || ''} onChange={handleChange} placeholder="Future Goals" />
              </>
            ) : (
              <>
                {renderDetail("College", profile.college)}
                {renderDetail("Field of Study", profile.fieldOfStudy)}
                {renderDetail("Degree", profile.degree)}
                {renderDetail("City", profile.city)}
                {renderDetail("Current Fee", profile.currentFee)}
                {renderDetail("Future Goals", profile.goals)}
              </>
            )
          ) : (
            editMode ? (
              <>
                <div className="profile-edit-label">Preferred College Type</div>
                <input name="collegeType" value={formData.preferences?.collegeType || ''} onChange={handleChange} placeholder="Preferred College Type" />
                <div className="profile-edit-label">Field of Interest</div>
                <input name="fieldInterest" value={formData.preferences?.fieldInterest || ''} onChange={handleChange} placeholder="Field of Interest" />
                <div className="profile-edit-label">Location Preference</div>
                <input name="locationPreference" value={formData.preferences?.locationPreference || ''} onChange={handleChange} placeholder="Location Preference" />
              </>
            ) : (
              <>
                {renderDetail("Preferred College Type", profile.preferences?.collegeType)}
                {renderDetail("Field Interest", profile.preferences?.fieldInterest)}
                {renderDetail("Location Preference", profile.preferences?.locationPreference)}
              </>
            )
          )}

          <div className="button-group">
            {editMode ? (
              <button className="save-btn" onClick={handleUpdate}>Save Changes</button>
            ) : (
              <button className="edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
            )}
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;