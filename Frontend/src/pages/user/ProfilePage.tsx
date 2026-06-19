import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar, FaCamera, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useAuthStore } from '../../store/useAuthStore';
import userService from '../../services/user.service';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    zipCode: '',
    dateOfBirth: '',
    bio: '',
  });

  const [editedData, setEditedData] = useState({ ...profileData });

  // Helper function to validate image URL
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Update profile data when user data changes
  useEffect(() => {
    console.log('User data from store:', user); // Debug log
    
    if (user) {
      // The user object has 'username' not 'name'
      const userName = user.username || user.name || '';
      const nameParts = userName.split(' ');
      const first = nameParts[0] || '';
      const last = nameParts.slice(1).join(' ') || '';
      
      // Set profile image from user object only if it's a valid URL
      const profileImg = user.profile_image || user.profile_picture_url;
      if (profileImg && isValidImageUrl(profileImg)) {
        setProfileImage(profileImg);
        setImageError(false);
      } else {
        setProfileImage(null);
      }
      
      setProfileData((prev) => ({
        ...prev,
        firstName: first,
        lastName: last,
        email: user.email || '',
      }));
      setEditedData((prev) => ({
        ...prev,
        firstName: first,
        lastName: last,
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleEdit = () => {
    setEditedData({ ...profileData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // For now, just update local state without calling the API
      // TODO: Backend endpoint needs to be created
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setProfileData({ ...editedData });
      setIsEditing(false);
      
      // Optionally show a success message
      alert('Profile updated successfully! (Note: Changes are only saved locally for now)');
      
      // If you want to call the API in the future, uncomment this:
      // await userService.updateProfile({
      //   firstName: editedData.firstName,
      //   lastName: editedData.lastName,
      //   email: editedData.email,
      //   phone: editedData.phone,
      // });
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedData({ ...profileData });
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploadingImage(true);
    setImageError(false); // Reset error state

    try {
      const data = await userService.uploadProfileImage(file);
      
      // Validate the returned image URL
      if (data.imageUrl && isValidImageUrl(data.imageUrl)) {
        // Update the local state with the new image URL
        setProfileImage(data.imageUrl);
        setImageError(false);
        
        // Update the auth store with the new user data
        const login = useAuthStore.getState().login;
        if (data.user) {
          login(data.user);
        }
        
        alert('Profile image updated successfully!');
      } else {
        throw new Error('Invalid image URL returned from server');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
      setImageError(true);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Show loading if user data is not available
  if (!user) {
    return (
      <main className="profile-page">
        <div className="profile-header">
          <h1 className="page-title">
            <FaUser className="title-icon" />
            Profile Settings
          </h1>
          <p className="page-subtitle">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1 className="page-title">
          <FaUser className="title-icon" />
          Profile Settings
        </h1>
        <p className="page-subtitle">
          Manage your personal information and account details
        </p>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {/* Profile Avatar Section */}
        <div className="profile-avatar-section">
          <div className="avatar-card">
            <div className="avatar-container">
              <div className="avatar-circle">
                {profileImage && !imageError ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    onError={() => {
                      setImageError(true);
                      setProfileImage(null);
                    }}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: '50%', 
                      objectFit: 'cover' 
                    }} 
                  />
                ) : (
                  <FaUser size={60} />
                )}
              </div>
              <label className="avatar-upload-btn" style={{ position: 'relative' }}>
                <FaCamera /> {isUploadingImage ? 'Uploading...' : 'Change Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <div className="avatar-info">
              <h2 className="user-name">
                {profileData.firstName || profileData.lastName
                  ? `${profileData.firstName} ${profileData.lastName}`.trim()
                  : user?.username || user?.name || 'User'}
              </h2>
              <p className="user-email">{profileData.email || user?.email || 'No email'}</p>
              <span className="user-badge verified">Verified Account</span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="profile-form-section">
          <div className="form-header">
            <h3 className="form-title">Personal Information</h3>
            {!isEditing ? (
              <button className="btn-edit" onClick={handleEdit}>
                <FaEdit /> Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button className="btn-save" onClick={handleSave} disabled={isLoading}>
                  <FaSave /> {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn-cancel" onClick={handleCancel} disabled={isLoading}>
                  <FaTimes /> Cancel
                </button>
              </div>
            )}
          </div>

          <div className="profile-form">
            {/* Name Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FaUser /> First Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={isEditing ? editedData.firstName : profileData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <FaUser /> Last Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={isEditing ? editedData.lastName : profileData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Contact Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FaEnvelope /> Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={isEditing ? editedData.email : profileData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <FaPhone /> Phone Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  value={isEditing ? editedData.phone : profileData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="form-row">
              <div className="form-group full-width">
                <label className="form-label">
                  <FaCalendar /> Date of Birth
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={isEditing ? editedData.dateOfBirth : profileData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Address Row */}
            <div className="form-row">
              <div className="form-group full-width">
                <label className="form-label">
                  <FaMapMarkerAlt /> Street Address
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={isEditing ? editedData.address : profileData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Location Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FaMapMarkerAlt /> City
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={isEditing ? editedData.city : profileData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <FaMapMarkerAlt /> Zip Code
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={isEditing ? editedData.zipCode : profileData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Country */}
            <div className="form-row">
              <div className="form-group full-width">
                <label className="form-label">
                  <FaMapMarkerAlt /> Country
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={isEditing ? editedData.country : profileData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="form-row">
              <div className="form-group full-width">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={isEditing ? editedData.bio : profileData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
