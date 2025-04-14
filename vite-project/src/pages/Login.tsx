import React, { useState } from 'react';
import SplineRobo from '../components/Spline/SplineRobo';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onTabChange: (tab: string) => void;
}

const Login: React.FC<LoginProps> = ({ onTabChange }) => {
  const { setIsAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });
  
  const navigate = useNavigate();

  // Add validation functions
  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate all fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (emailError || passwordError) {
      setTouched({ email: true, password: true });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.login({
        email: formData.email,
        password: formData.password,
        remember_me: formData.rememberMe
      });

      if (result && result.success) {
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
          setIsAuthenticated(true);
          navigate('/home');
        }
      } else {
        setError(result?.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Login failed. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get validation states
  const emailError = touched.email ? validateEmail(formData.email) : '';
  const passwordError = touched.password ? validatePassword(formData.password) : '';

  return (
    <div className="w-full aspect-[16/9] flex relative overflow-hidden">
      {/* Spline Scene - Full Width with improved interactivity */}
      <div className="w-full h-full absolute inset-0 z-0" 
           style={{ 
             transform: 'translateX(40vh)',
             pointerEvents: 'all', // Changed from 'auto' to 'all'
             transition: 'transform 0.3s ease-out'
           }}>
        <div className="w-full h-full relative group cursor-pointer">
          {/* Add an overlay for hover effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent 
            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <SplineRobo />
        </div>
      </div>

      {/* Form Content - Ensure it's above the Spline scene */}
      <div className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-12 z-10" 
           style={{ 
             transform: 'translateX(2vh)',
             transition: 'transform 0.3s ease-out' // Smooth transition for form movement
           }}>
        <div className="w-full max-w-md backdrop-blur-md bg-black/20 p-8 rounded-2xl border border-white/10 
          shadow-2xl transition-all duration-300 hover:border-white/20"
          style={{ pointerEvents: 'auto' }}>
          <div className="text-left mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
              bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="text-gray-400">Please enter your details to sign in</p>
          </div>
          
          {/* Show error message if exists */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-4 py-3 bg-black/30 border rounded-xl 
                    transition-all duration-200 text-white placeholder-gray-500
                    ${emailError 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-white/10 focus:ring-blue-500/50 hover:border-white/20'
                    }`}
                  placeholder="Enter your email"
                  required
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-400">{emailError}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onBlur={() => handleBlur('password')}
                  className={`w-full px-4 py-3 bg-black/30 border rounded-xl pr-12
                    transition-all duration-200 text-white placeholder-gray-500
                    ${passwordError 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-white/10 focus:ring-blue-500/50 hover:border-white/20'
                    }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
                    hover:text-gray-300 focus:outline-none"
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
                {passwordError && (
                  <p className="mt-1 text-sm text-red-400">{passwordError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-black/30 
                    text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0
                    group-hover:border-white/20"
                />
                <span className="ml-2 text-gray-300 group-hover:text-gray-200 transition-colors">
                  Remember me
                </span>
              </label>
              <button 
                type="button" 
                className="text-blue-400 hover:text-blue-300 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg px-2 py-1 -mx-2"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !!emailError || !!passwordError}
              className="w-full px-4 py-3 text-white bg-blue-600 rounded-xl 
                hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                font-medium shadow-lg shadow-blue-500/25 disabled:opacity-50 
                disabled:hover:scale-100 disabled:cursor-not-allowed
                relative overflow-hidden"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/register')}
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg px-2 py-1 -mx-2"
              >
                Register Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 