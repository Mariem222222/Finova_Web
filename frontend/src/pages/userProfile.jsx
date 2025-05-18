import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaUser,
  FaShieldAlt,
  FaBell,
  FaSave,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaUpload,
  FaLock,
  FaTrash,
  FaExclamationTriangle,
} from 'react-icons/fa';

const UserProfile = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    profilePicture: '',
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    emailNotifications: false,
  });

  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: ''
  });

  const [editing, setEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const authToken = localStorage.getItem('authToken'); // Retrieve authToken from localStorage

  // Fetch user profile from the backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/users/profile", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        let data = response.data;
        // Si le backend retourne 'name' mais pas 'firstName'/'lastName', on splitte
        if (data.name && (!data.firstName || !data.lastName)) {
          const [firstName, ...rest] = data.name.split(' ');
          data.firstName = firstName || '';
          data.lastName = rest.join(' ') || '';
        }
        setProfile(prev => ({
          ...prev,
          ...data
        }));
      } catch (error) {
        console.error('Failed to fetch user profile:', error.message);
      }
    };

    if (authToken) {
      fetchUserProfile();
    }
  }, [authToken]);

  // Form validation function
  const validateForm = () => {
    const errors = {};
    if (!profile.firstName.trim()) errors.firstName = 'First name is required';
    if (!profile.lastName.trim()) errors.lastName = 'Last name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) errors.email = 'Invalid email';

    // Validate date of birth
    const today = new Date();
    const dateOfBirth = new Date(profile.dateOfBirth);
    if (!profile.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else if (dateOfBirth >= today) {
      errors.dateOfBirth = 'Date of birth must be in the past';
    } else {
      const age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      const dayDiff = today.getDate() - dateOfBirth.getDate();
      if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
        errors.dateOfBirth = 'You must be at least 18 years old';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("firstName", profile.firstName);
    formData.append("lastName", profile.lastName);
    formData.append("email", profile.email);
    formData.append("phoneNumber", profile.phoneNumber);
    formData.append("dateOfBirth", profile.dateOfBirth);

    if (profile.profilePicture instanceof File) {
      formData.append("profilePicture", profile.profilePicture);
    }

    try {
      const response = await axios.put("http://localhost:5000/api/users/profile", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Always use the backend response!
      setProfile(prev => ({
        ...prev,
        ...response.data,
        profilePicture: response.data.profilePicture // ensure it's a string
      }));
      setEditing(false);
      setSavedSuccessfully(true);

      // Reset success message after 3 seconds
      setTimeout(() => setSavedSuccessfully(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Optionally, show an error message to the user
    }
  };

  const toggleSecuritySetting = (setting) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile((prev) => ({
        ...prev,
        profilePicture: file, // Store the file object for upload
      }));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete("http://localhost:5000/api/users/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      // Clear local storage and redirect to home
      localStorage.removeItem("authToken");
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete account:", error);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Error message component for DRY principle
  const ErrorMessage = ({ message }) => (
    <p className="text-red-500 text-sm mt-1 flex items-center">
      <FaTimesCircle className="mr-2" /> {message}
    </p>
  );

  // Form field component for reusability
  const FormField = ({ label, type, value, onChange, error, placeholder }) => (
    <div>
      <label className="block text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
      />
      {error && <ErrorMessage message={error} />}
    </div>
  );

  // Security setting toggle component
  const SecurityToggle = ({ icon, title, description, checked, onChange }) => (
    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
      <div className="flex items-center">
        {icon}
        <div>
          <span className="font-medium">{title}</span>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="slider round"></span>
      </label>
    </div>
  );

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-8 flex items-center animate-fade-in">
          <FaUser className="mr-4 text-blue-600 animate-bounce" /> User Profile
        </h1>

        {/* Profile Section */}
        <div className="bg-white shadow-2xl rounded-2xl p-8 mb-8 transform transition-all hover:scale-[1.01]">
          <div className="flex items-center mb-6 relative">
            <div className="relative">
              <img
                src={
                  profile.profilePicture && typeof profile.profilePicture === 'string'
                    ? (profile.profilePicture.startsWith('http')
                      ? profile.profilePicture
                      : `http://localhost:5000${profile.profilePicture}`)
                    : '/api/placeholder/200/200'}
                alt="Profile"
                className="w-32 h-32 rounded-full mr-6 object-cover border-4 border-blue-300 shadow-lg"
              />
              <label className="absolute bottom-0 right-6 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition flex items-center justify-center" title="Change photo">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <FaUpload size={14} />
              </label>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-blue-900">{profile.firstName} {profile.lastName}</h2>
              <p className="text-gray-600 text-lg">{profile.email}</p>
              <p className="text-gray-600">Born: {new Date(profile.dateOfBirth).toLocaleDateString('en-US')}</p>
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center"
              >
                <FaEdit className="mr-2" /> Edit
              </button>
            )}
          </div>

          {savedSuccessfully && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 flex items-center animate-fade-in">
              <FaCheckCircle className="mr-3 text-2xl" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {editing && (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  label="First Name"
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                  error={validationErrors.firstName}
                  placeholder="Your first name"
                />
                <FormField
                  label="Last Name"
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                  error={validationErrors.lastName}
                  placeholder="Your last name"
                />
              </div>
              <FormField
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                error={validationErrors.email}
                placeholder="your.email@example.com"
              />
              <FormField
                label="Phone Number"
                type="tel"
                value={profile.phoneNumber}
                onChange={(e) => setProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                error={validationErrors.phoneNumber}
                placeholder="+1 555 123 4567"
              />
              <FormField
                label="Date of Birth"
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) => setProfile(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                error={validationErrors.dateOfBirth}
              />

              {/* Password fields */}
              <div className="mt-8 mb-4 border-t pt-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                  <FaLock className="mr-3 text-blue-600" /> Change Password
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    label="Password"
                    type="password"
                    value={passwords.password}
                    onChange={(e) => setPasswords(prev => ({ ...prev, password: e.target.value }))}
                    error={validationErrors.password}
                    placeholder="New password"
                  />
                  <FormField
                    label="Confirm Password"
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    error={validationErrors.confirmPassword}
                    placeholder="Confirm password"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Leave blank if you don't want to change your password
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition flex items-center"
                >
                  <FaSave className="mr-2" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setPasswords({ password: '', confirmPassword: '' });
                    setValidationErrors({});
                  }}
                  className="bg-gray-200 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Settings */}
        <div className="bg-white shadow-2xl rounded-2xl p-8 transform transition-all hover:scale-[1.01]">
          <h2 className="text-2xl font-semibold text-blue-900 mb-6 flex items-center">
            <FaShieldAlt className="mr-3 text-blue-600" /> Security Settings
          </h2>

          <div className="space-y-6">
            <SecurityToggle
              icon={<FaShieldAlt className="mr-4 text-green-600 text-2xl" />}
              title="Two-Factor Authentication"
              description="Protect your account with an extra layer of security"
              checked={true}
              onChange={() => toggleSecuritySetting('twoFactorAuth')}
            />

            <SecurityToggle
              icon={<FaBell className="mr-4 text-blue-600 text-2xl" />}
              title="Email Notifications"
              description="Receive important updates via email"
              checked={true}
              onChange={() => toggleSecuritySetting('emailNotifications')}
            />

            {/* Delete Account Section */}
            <div className="mt-8 pt-6 border-t border-red-200">
              <h3 className="text-xl font-semibold text-red-600 mb-4 flex items-center">
                <FaExclamationTriangle className="mr-3" /> Danger Zone
              </h3>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
                >
                  <FaTrash className="mr-2" /> Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
              <FaExclamationTriangle className="mr-3" /> Delete Account
            </h3>
            <p className="text-gray-700 mb-4">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Please type "delete" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type 'delete' to confirm"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation.toLowerCase() !== 'delete' || isDeleting}
                className={`px-4 py-2 rounded-lg flex items-center ${deleteConfirmation.toLowerCase() === 'delete' && !isDeleting
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } transition`}
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" /> Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }

        input:checked + .slider {
          background-color: #2196F3;
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        .slider.round {
          border-radius: 34px;
        }

        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default UserProfile;