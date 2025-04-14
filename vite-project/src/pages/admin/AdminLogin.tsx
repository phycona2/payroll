import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { ENDPOINTS } from '../../config/api.config';
import SplineFlow from '../../components/Spline/SplineFlow';

// Update the interface to match API response
interface AdminLoginResponse {
  success: boolean;
  message: string;
  admin?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  sessionId?: string;
}

const AdminLogin: React.FC = () => {
  const { setIsAuthenticated, setIsAdmin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in as admin
    const adminStr = localStorage.getItem('admin');
    if (adminStr) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Use authService instead of direct axios call for consistency
      const response = await authService.adminLogin({
        email: formData.email,
        password: formData.password
      });
      
      if (response.success && response.admin) {
        // Store admin data with all necessary fields
        const adminData = {
          id: response.admin.id,
          username: response.admin.username,
          email: response.admin.email,
          role: response.admin.role,
          name: response.admin.username, // Use username as name if not provided
          token: response.sessionId || 'admin-token', // Ensure token is always set
          sessionId: response.sessionId
        };
        
        // Store admin data in localStorage
        localStorage.setItem('admin', JSON.stringify(adminData));
        
        // Update auth context
        setIsAdmin(true);
        setIsAuthenticated(true);
        
        console.log('Admin login successful, navigating to dashboard');
        
        // Navigate to dashboard with a slight delay to ensure state is updated
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 100);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Login failed. Please try again.');
      } else {
        setError('An unexpected error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Spline Scene - Full Width */}
      <div className="w-full h-full absolute inset-0">
        <SplineFlow />
      </div>

      {/* Form Content */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="backdrop-blur-md bg-black/20 p-8 rounded-2xl border border-white/10 
            shadow-2xl transition-all duration-300 hover:border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
                bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Admin Portal
              </h1>
              <p className="text-gray-400">Secure access to admin dashboard</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl 
                      focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                      transition-all duration-200 text-white placeholder-gray-500
                      group-hover:border-white/20"
                    placeholder="admin@example.com"
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl 
                      focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                      transition-all duration-200 text-white placeholder-gray-500
                      group-hover:border-white/20 pr-12"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
                      hover:text-gray-300 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 
                  rounded-lg flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 
                  rounded-xl hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 
                  focus:ring-blue-500/50 transition-all duration-200 transform hover:scale-[1.02] 
                  active:scale-[0.98] font-medium shadow-lg shadow-blue-500/25 disabled:opacity-50 
                  disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  'Sign in to Dashboard'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 