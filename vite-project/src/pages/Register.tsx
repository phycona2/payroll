import React, { useState, useEffect, useCallback } from 'react';
import SplineAssist from '../components/Spline/SplineAssist';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/auth.service';


interface InputFieldProps {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  error?: string;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

// Input field wrapper component moved outside
const InputField = React.memo(({ 
  label, 
  name, 
  type, 
  placeholder, 
  value,
  error,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  onChange,
  disabled = false
}: InputFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-medium text-gray-300">
      {label}
    </label>
    <div className="relative">
      <input
        type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-black/30 border rounded-xl 
          transition-all duration-200 text-white placeholder-gray-500
          ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-white/10 focus:ring-blue-500/50 hover:border-white/20'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          focus:outline-none focus:ring-2 focus:border-transparent`}
        placeholder={placeholder}
        required
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          disabled={disabled}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
            hover:text-gray-300 transition-colors duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500 animate-fadeIn">{error}</p>
      )}
    </div>
  </div>
));

interface RegisterProps {
  onTabChange: (tab: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onTabChange }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    acceptTerms: false
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Password strength checker
  useEffect(() => {
    const strength = calculatePasswordStrength(formData.password);
    setPasswordStrength(strength);
  }, [formData.password]);

  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'from-red-500 to-red-600';
    if (passwordStrength <= 50) return 'from-yellow-500 to-yellow-600';
    if (passwordStrength <= 75) return 'from-blue-500 to-blue-600';
    return 'from-green-500 to-green-600';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const validateField = useCallback((name: string, value: string) => {
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? '' : 'Please enter a valid email address';
      case 'password':
        const requirements = [];
        if (value.length < 8) requirements.push('at least 8 characters');
        if (!/[A-Z]/.test(value)) requirements.push('one uppercase letter');
        if (!/[0-9]/.test(value)) requirements.push('one number');
        if (!/[^A-Za-z0-9]/.test(value)) requirements.push('one special character');
        return requirements.length > 0 
          ? `Password must contain ${requirements.join(', ')}` 
          : '';
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords do not match' : '';
      case 'fullName':
        return value.length < 2 ? 'Please enter your full name' : '';
      default:
        return '';
    }
  }, [formData.password]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Debounce validation for better performance
    if (type !== 'checkbox') {
      const timeoutId = setTimeout(() => {
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
        
        if (name === 'password' && formData.confirmPassword) {
          const confirmError = value !== formData.confirmPassword ? 'Passwords do not match' : '';
          setErrors(prev => ({
            ...prev,
            confirmPassword: confirmError
          }));
        }
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [validateField, formData.confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
      fullName: validateField('fullName', formData.fullName)
    };
    
    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Log the request payload
      console.log('Sending registration request:', {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        department: "",
        designation: "",
        bank_account: ""
      });

      const result = await authService.register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        department: "",
        designation: "",
        bank_account: ""
      });

      // Log the API response
      console.log('Registration API response:', result);

      // Check if result exists and has success property
      if (result && result.success) {
        // Success! Show success message and redirect
        alert('Registration successful! Please sign in to continue.');
        navigate('/login');
      } else {
        // API returned failure
        const errorMessage = result?.message || 'Registration failed. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle Axios error with more detail
      if (axios.isAxiosError(error)) {
        console.log('Axios error response:', error.response?.data);
        const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
        alert(errorMessage);
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex relative overflow-hidden">
      {/* Spline Scene - Full Width */}
      <div className="w-full h-full absolute inset-0">
        <SplineAssist />
      </div>

      {/* Form Content */}
      <div className="absolute inset-0 flex flex-col items-start justify-center px-4 sm:px-8 md:px-12" 
           style={{ pointerEvents: 'none' }}>
        <div className="w-full max-w-md backdrop-blur-md bg-black/20 p-6 sm:p-8 rounded-2xl border border-white/10 
          shadow-2xl transition-all duration-300 hover:border-white/20 mx-auto lg:mx-0"
          style={{ pointerEvents: 'auto' }}>
          <div className="text-left mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
              bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-gray-400">Please fill in your details to register</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Full Name"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              error={errors.fullName}
              onChange={handleChange}
              disabled={isLoading}
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              error={errors.email}
              onChange={handleChange}
              disabled={isLoading}
            />

            <div className="space-y-1">
              <InputField
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                error={errors.password}
                showPasswordToggle
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                onChange={handleChange}
                disabled={isLoading}
              />
              
              {formData.password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getPasswordStrengthColor()} 
                        transition-all duration-500 ease-out`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-400">
                      Password strength: <span className="font-medium">{getPasswordStrengthLabel()}</span>
                    </p>
                    <p className="text-xs text-gray-400">{passwordStrength}%</p>
                  </div>
                </div>
              )}
            </div>

            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              error={errors.confirmPassword}
              showPasswordToggle
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              onChange={handleChange}
              disabled={isLoading}
            />

            <div className="flex items-center text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-white/10 bg-black/30 
                    text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                  required
                />
                <span className="ml-2 text-gray-300">
                  I accept the{' '}
                  <button type="button" className="text-blue-400 hover:text-blue-300 transition-colors">
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button type="button" className="text-blue-400 hover:text-blue-300 transition-colors">
                    Privacy Policy
                  </button>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || Object.values(errors).some(error => error !== '')}
              className="w-full px-4 py-3 text-white bg-blue-600 rounded-xl 
                hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                font-medium shadow-lg shadow-blue-500/25 disabled:opacity-50 
                disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 