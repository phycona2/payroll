import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, UpdateProfileData } from '../services/auth.service';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { Toast } from '../components/Toast';

const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg 
                hover:bg-blue-500 transition-colors"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState({
    id: 0,
    name: '',
    email: '',
    department: '',
    designation: '',
    bank_account: ''
  });
  const [errors, setErrors] = useState({
    department: '',
    designation: '',
    bank_account: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Add state to track which fields are being edited
  const [editingFields, setEditingFields] = useState<{
    department: boolean;
    designation: boolean;
    bank_account: boolean;
  }>({
    department: false,
    designation: false,
    bank_account: false
  });

  // Helper to check if any field is being edited
  const isAnyFieldEditing = Object.values(editingFields).some(value => value);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(prev => ({
        ...prev,
        ...userData,
        // Ensure all required fields have at least an empty string
        department: userData.department || '',
        designation: userData.designation || '',
        bank_account: userData.bank_account || ''
      }));
    }
  }, []);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'department':
        return !value ? 'Department is required' : '';
      case 'designation':
        return !value ? 'Designation is required' : '';
      case 'bank_account':
        return !value ? 'Bank account is required' : '';
      default:
        return '';
    }
  };

  // Modify handleChange to only validate fields being edited
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
    
    // Only validate if the field is being edited
    if (editingFields[name as keyof typeof editingFields]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, value.trim())
      }));
    }
  };

  // Add toggle edit function for individual fields
  const toggleFieldEdit = (field: keyof typeof editingFields) => {
    setEditingFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));

    // Reset error for this field when toggling edit mode off
    if (editingFields[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateFields = () => {
    const newErrors = {
      department: validateField('department', user.department.trim()),
      designation: validateField('designation', user.designation.trim()),
      bank_account: validateField('bank_account', user.bank_account.trim())
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Add keyboard shortcuts
  useHotkeys('ctrl+s, cmd+s', (e) => {
    e.preventDefault();
    if (isAnyFieldEditing) {
      setShowSaveModal(true);
    }
  });

  useHotkeys('esc', () => {
    if (isAnyFieldEditing) {
      cancelAllEdits();
    }
  });

  // Modify handleSubmit to use the confirmation modal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveModal(true);
  };

  // Modify handleSaveConfirm to include name and email fields
  const handleSaveConfirm = async () => {
    setShowSaveModal(false);
    setIsSaving(true);
    
    try {
      // Get current user data from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Only validate and update fields that were edited
      const editedFields = Object.entries(editingFields)
        .filter(([_, isEditing]) => isEditing)
        .reduce((acc, [field]) => ({
          ...acc,
          [field]: typeof user[field as keyof typeof user] === 'string' 
            ? (user[field as keyof typeof user] as string).trim()
            : user[field as keyof typeof user]
        }), {} as Partial<typeof user>);

      if (Object.keys(editedFields).length === 0) {
        return;
      }

      // Validate only edited fields
      const newErrors = Object.keys(editedFields).reduce((acc, field) => ({
        ...acc,
        [field]: validateField(field, String(editedFields[field as keyof typeof user] || ''))
      }), {} as typeof errors);

      setErrors(newErrors);

      if (Object.values(newErrors).some(error => error !== '')) {
        setIsSaving(false);
        return;
      }

      // Add type for updateData, including name and email from current user
      const updateData: UpdateProfileData = {
        user_id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        department: currentUser.department || '',
        designation: currentUser.designation || '',
        bank_account: currentUser.bank_account || '',
        ...editedFields
      };

      // Validate that no required fields are undefined or empty
      const requiredFields = ['department', 'designation', 'bank_account'] as const;
      const missingFields = requiredFields.filter(field => !updateData[field]);
      
      if (missingFields.length > 0) {
        setErrors(prev => ({
          ...prev,
          ...missingFields.reduce((acc, field) => ({ ...acc, [field]: `${field} is required` }), {})
        }));
        setIsSaving(false);
        return;
      }

      const result = await authService.updateProfile(updateData);

      if (result.success) {
        // Replace alert with toast
        const updatedFields = Object.keys(editedFields).join(', ');
        setToastMessage(`Successfully updated: ${updatedFields}`);
        setShowToast(true);
        
        // Hide toast after 5 seconds
        setTimeout(() => setShowToast(false), 5000);

        // Update localStorage with the new values
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          ...editedFields
        }));

        // Reset only the fields that were being edited
        setEditingFields(prev => 
          Object.keys(prev).reduce((acc, key) => ({
            ...acc,
            [key]: false
          }), prev)
        );
      } else {
        setToastMessage(result.message || 'Failed to update profile');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      
      if (axios.isAxiosError(error)) {
        setToastMessage(error.response?.data?.message || 'Failed to update profile');
      } else {
        setToastMessage('An unexpected error occurred');
      }
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Add a new function to handle canceling all edits
  const cancelAllEdits = () => {
    // Reset all editing states
    setEditingFields({
      department: false,
      designation: false,
      bank_account: false
    });
    
    // Reset all errors
    setErrors({
      department: '',
      designation: '',
      bank_account: ''
    });
    
    // Reset form data to original values
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(prev => ({
        ...prev,
        department: userData.department || '',
        designation: userData.designation || '',
        bank_account: userData.bank_account || ''
      }));
    }
  };

  // Add a confirmation dialog before canceling edits if there are unsaved changes
  const handleCancelEdit = (field: keyof typeof editingFields) => {
    const hasChanges = user[field] !== JSON.parse(localStorage.getItem('user') || '{}')[field];
    
    if (hasChanges && !confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return;
    }
    
    toggleFieldEdit(field);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Add the confirmation modal */}
      <ConfirmModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleSaveConfirm}
        title="Save Changes"
        message="Are you sure you want to save these changes? This action cannot be undone."
      />

      {/* Add the toast notification */}
      <AnimatePresence>
        {showToast && (
          <Toast
            message={toastMessage}
            onClose={() => setShowToast(false)}
          />
        )}
      </AnimatePresence>

      {/* Add keyboard shortcut hints */}
      {isAnyFieldEditing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm 
            rounded-lg p-3 border border-white/10 text-sm text-gray-400"
        >
          <div className="flex items-center gap-2 mb-1">
            <kbd className="px-2 py-1 bg-black/30 rounded text-xs">⌘/Ctrl + S</kbd>
            <span>Save changes</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-black/30 rounded text-xs">Esc</kbd>
            <span>Cancel all changes</span>
          </div>
        </motion.div>
      )}

      <div className="w-full min-h-[calc(100vh-12rem)] p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header with improved styling */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white 
                bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Account Settings
              </h1>
              {isAnyFieldEditing && (
                <span className="px-2 py-1 text-xs font-medium text-amber-400 bg-amber-400/10 
                  border border-amber-400/20 rounded-full animate-pulse">
                  Editing...
                </span>
              )}
            </div>
            <p className="text-gray-400">Manage your account preferences and information</p>
          </div>

          {/* Settings Form with improved visual hierarchy */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="space-y-6">
                {/* Profile Section with improved visual hierarchy and organization */}
                <div className="flex items-start justify-between border-b border-white/10 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 
                        flex items-center justify-center text-xl font-bold text-white uppercase">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 
                        rounded-full border-2 border-gray-900"></div>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                        Profile Information
                        {isAnyFieldEditing && (
                          <span className="px-2 py-1 text-xs font-medium text-amber-400 
                            bg-amber-400/10 border border-amber-400/20 rounded-full animate-pulse">
                            Editing...
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-400 mt-1">
                        Manage your account details and preferences
                      </p>
                    </div>
                  </div>
                  {Object.values(editingFields).filter(Boolean).length > 1 && (
                    <button
                      type="button"
                      onClick={cancelAllEdits}
                      className="text-sm text-red-400 hover:text-red-300 
                        transition-colors flex items-center gap-2 px-3 py-2 rounded-lg
                        hover:bg-red-400/10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel All Changes
                    </button>
                  )}
                </div>

                {/* Profile Fields Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information Group */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Existing read-only fields (name and email) */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          Full Name
                          <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">
                            Read-only
                          </span>
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            name="name"
                            value={user.name}
                            disabled={true}
                            className="w-full px-4 py-3 bg-black/30 border rounded-xl 
                              text-white opacity-50 cursor-not-allowed border-white/10
                              group-hover:border-white/20 transition-colors"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          Email Address
                          <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">
                            Read-only
                          </span>
                        </label>
                        <div className="relative group">
                          <input
                            type="email"
                            name="email"
                            value={user.email}
                            disabled={true}
                            className="w-full px-4 py-3 bg-black/30 border rounded-xl 
                              text-white opacity-50 cursor-not-allowed border-white/10
                              group-hover:border-white/20 transition-colors"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Work Information Group */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Work Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Existing editable fields with enhanced styling */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            Department
                            <span className="text-red-400">*</span>
                            {editingFields.department && (
                              <span className="text-xs text-blue-400">Editing</span>
                            )}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleCancelEdit('department')}
                            className={`text-xs px-2 py-1 rounded-lg transition-all duration-200
                              ${editingFields.department 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'text-blue-400 hover:bg-blue-400/10'}`}
                          >
                            {editingFields.department ? 'Cancel' : 'Edit'}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            name="department"
                            value={user.department}
                            onChange={handleChange}
                            disabled={!editingFields.department}
                            placeholder="Enter your department"
                            className={`w-full px-4 py-3 bg-black/30 border rounded-xl 
                              transition-all duration-200 text-white placeholder-gray-500
                              ${!editingFields.department ? 'opacity-50' : ''}
                              ${errors.department && editingFields.department ? 'border-red-400' : 'border-white/10'}
                              ${editingFields.department ? 'focus:ring-blue-500/50 hover:border-white/20' : ''}
                              focus:outline-none focus:ring-2 focus:border-transparent`}
                          />
                          {editingFields.department && !errors.department && user.department && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </div>
                        {errors.department && editingFields.department && (
                          <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.department}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-300">
                            Designation
                            <span className="text-red-400 ml-1">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleCancelEdit('designation')}
                            className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                          >
                            {editingFields.designation ? 'Cancel' : 'Edit'}
                          </button>
                        </div>
                        <input
                          type="text"
                          name="designation"
                          value={user.designation}
                          onChange={handleChange}
                          disabled={!editingFields.designation}
                          placeholder="Enter your designation"
                          className={`w-full px-4 py-3 bg-black/30 border rounded-xl 
                            transition-all duration-200 text-white placeholder-gray-500
                            ${!editingFields.designation ? 'opacity-50' : ''}
                            ${errors.designation && editingFields.designation ? 'border-red-400' : 'border-white/10'}
                            ${editingFields.designation ? 'focus:ring-blue-500/50 hover:border-white/20' : ''}
                            focus:outline-none focus:ring-2 focus:border-transparent`}
                        />
                        {errors.designation && editingFields.designation && 
                          <p className="text-red-400 text-sm mt-1">{errors.designation}</p>
                        }
                      </div>
                    </div>
                  </div>

                  {/* Banking Information Group */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Banking Information
                    </h3>
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">
                          Bank Account
                          <span className="text-red-400 ml-1">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCancelEdit('bank_account')}
                          className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                        >
                          {editingFields.bank_account ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                      <input
                        type="text"
                        name="bank_account"
                        value={user.bank_account}
                        onChange={handleChange}
                        disabled={!editingFields.bank_account}
                        placeholder="Enter your bank account number"
                        className={`w-full px-4 py-3 bg-black/30 border rounded-xl 
                          transition-all duration-200 text-white placeholder-gray-500
                          ${!editingFields.bank_account ? 'opacity-50' : ''}
                          ${errors.bank_account && editingFields.bank_account ? 'border-red-400' : 'border-white/10'}
                          ${editingFields.bank_account ? 'focus:ring-blue-500/50 hover:border-white/20' : ''}
                          focus:outline-none focus:ring-2 focus:border-transparent`}
                      />
                      {errors.bank_account && editingFields.bank_account && 
                        <p className="text-red-400 text-sm mt-1">{errors.bank_account}</p>
                      }
                    </div>
                  </div>
                </div>

                {/* Save Button with improved feedback */}
                {isAnyFieldEditing && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-400">
                        <span className="text-red-400">*</span> Required fields
                      </span>
                      <span className="text-xs text-gray-400">
                        All changes will be saved together
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full px-4 py-3 text-white bg-blue-600 rounded-xl 
                        hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                        transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                        font-medium shadow-lg shadow-blue-500/25 disabled:opacity-50 
                        disabled:hover:scale-100 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Logout Button with improved styling */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLogout}
                className="group px-4 py-2 text-red-400 hover:text-red-300 
                  transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Settings; 