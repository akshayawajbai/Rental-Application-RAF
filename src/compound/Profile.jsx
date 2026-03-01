import { useEffect, useState, useRef } from "react";
import toast from 'react-hot-toast'
import { User, Camera, Edit2, Save, X, Upload, Key, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { API } from '../config/api'
import '../compoundcss/Profile.css'
import { motion, AnimatePresence } from "framer-motion";

function Profile() {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordStep, setPasswordStep] = useState('forgot'); // 'forgot' or 'reset'
  const [resetForm, setResetForm] = useState({ email: '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    // Fetch user profile data
    fetch(API.usersProfile, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(data => {
        setUser(data);
        setEditForm({
          name: data.name,
          username: data.username,
          work: data.work || '',
          workDescription: data.workDescription || ''
        });
      })
      .catch(err => console.error(err));

    // Fetch profile image
    fetch(API.usersProfileImage, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("No image");
      })
      .then(data => {
        setProfileImage(`${API.base}${data.image}`);
      })
      .catch(err => console.log("No profile image found"));
  }, []);
  useEffect(() => {
    if (user) {
      console.log("Updated user state:", user);
    }
  }, [user]);
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('Image', file);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(API.usersUpdateImage, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImage(`${API.base}${data.image}`);
        // Update the image in nav by reloading
        window.location.reload();
        toast.success('Profile image updated successfully!');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(API.usersProfile, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: editForm.name,
          username: editForm.username,
          work: editForm.work,
          workDescription: editForm.workDescription
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Update user state with the edited data (fallback if backend doesn't return all fields)
        setUser({
          ...updatedUser,
          work: editForm.work,
          workDescription: editForm.workDescription
        });
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Error updating profile');
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem("authToken");

      // Get user ID from current user data
      const userId = user?.userId;

      if (!userId) {
        toast.error('User information not available');
        return;
      }

      const response = await fetch(API.usersForgotPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: resetForm.email,
          userId: userId
        })
      });

      const result = await response.text();

      if (response.ok) {
        toast.success('OTP has been sent to your email if it exists');
        setPasswordStep('reset');
      } else {
        toast.error(result || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(API.usersResetPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: resetForm.email,
          otp: resetForm.otp,
          newPassword: resetForm.newPassword
        })
      });

      const result = await response.text();

      if (response.ok) {
        toast.success('Password reset successfully!');
        setTimeout(() => {
          setShowPasswordReset(false);
          setPasswordStep('forgot');
          setResetForm({ email: '', otp: '', newPassword: '' });
          setMessage('');
        }, 2000);
      } else {
        toast.error(result || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  const handleResetInputChange = (field, value) => {
    setResetForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div className="profile-container" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
      <div className="circle-1"></div>
      <div className="circle-2"></div>
      <div className="circle-3"></div>
      <div className="circle-4"></div>
      <div className="circle-5"></div>
      <div className="profile-header">
        <h1>Profile</h1>
        <button
          className="edit-btn"
          onClick={() => {
            if (!isEditing) {
              // Entering edit mode - sync form with current user data
              setEditForm({
                name: user.name,
                username: user.username,
                work: user.work || '',
                workDescription: user.workDescription || ''
              });
            }
            setIsEditing(!isEditing);
          }}
        >
          {isEditing ? <X size={20} /> : <Edit2 size={20} />}
        </button>
      </div>

      {user ? (
        <div className="profile-content">
          <div className="profile-image-section">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <motion.div className="profile-image-container" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 200 }}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-placeholder">
                  <User size={60} />
                </div>
              )}
              <button
                className="camera-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Upload size={20} /> : <Camera size={20} />}
              </button>
            </motion.div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div className="profile-details">
            <div className="detail-item">
              {isEditing && <label>Name</label>}
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.input
                    key="edit-name"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="edit-input"
                    placeholder="Name"
                  />
                ) : (
                  <motion.p
                    key="view-name"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="detail-text name-text"
                  >
                    {user.name}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="detail-item">
              {isEditing && <label>Username</label>}
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="edit-input"
                  placeholder="Username"
                />
              ) : null}
            </div>

            <div className="detail-item">
              {isEditing && <label>Work</label>}
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.work || ''}
                  onChange={(e) => handleInputChange('work', e.target.value)}
                  className="edit-input"
                  placeholder="Work"
                />
              ) : (
                <p className="detail-text work-text">{user.work || 'Not specified'}</p>
              )}
            </div>

            <div className="detail-item">
              {isEditing && <label>Description</label>}
              {isEditing ? (
                <textarea
                  value={editForm.workDescription || ''}
                  onChange={(e) => handleInputChange('workDescription', e.target.value)}
                  className="edit-textarea"
                  rows={3}
                  placeholder="Description"
                />
              ) : (
                <p className="detail-text description-text">{user.workDescription || 'No description provided'}</p>
              )}
            </div>

            {isEditing && (
              <div className="edit-actions">
                <motion.button
                  className="save-btn"
                  onClick={handleProfileUpdate}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Save size={16} />
                  Save Changes
                </motion.button>

                <button
                  className="cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      name: user.name,
                      username: user.username,
                      work: user.work || '',
                      workDescription: user.workDescription || ''
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="password-reset-section">
              <button
                className="password-reset-btn"
                onClick={() => setShowPasswordReset(true)}
              >
                <Key size={16} />
                Reset Password
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {passwordStep === 'forgot' ? (
                  <><Mail size={20} /> Forgot Password</>
                ) : (
                  <><Lock size={20} /> Reset Password</>
                )}
              </h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowPasswordReset(false);
                  setPasswordStep('forgot');
                  setResetForm({ email: '', otp: '', newPassword: '' });
                  setMessage('');
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {passwordStep === 'forgot' ? (
                <div className="forgot-form">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={resetForm.email}
                      onChange={(e) => handleResetInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                      className="form-input"
                    />
                  </div>
                  <button
                    className="submit-btn"
                    onClick={handleForgotPassword}
                    disabled={loading || !resetForm.email}
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              ) : (
                <div className="reset-form">
                  <div className="form-group">
                    <label>OTP Code</label>
                    <input
                      type="text"
                      value={resetForm.otp}
                      onChange={(e) => handleResetInputChange('otp', e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="form-input"
                      maxLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={resetForm.newPassword}
                      onChange={(e) => handleResetInputChange('newPassword', e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="form-input"
                    />
                  </div>
                  <button
                    className="submit-btn"
                    onClick={handleResetPassword}
                    disabled={loading || !resetForm.otp || !resetForm.newPassword}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}

export default Profile;
