import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { useAuth as useAuthContext } from '../contexts/AuthContext';

export function useLogin() {
  const { setIsAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if (data.success && data.user) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify({
          ...data.user,
          sessionId: data.sessionId
        }));
        
        setIsAuthenticated(true);
        navigate('/home');
      }
      return data;
    }
  });
}

export function useRegister() {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      if (data.success) {
        alert('Registration successful! Please sign in to continue.');
        navigate('/login');
      }
      return data;
    }
  });
}

export function useAdminLogin() {
  const { setIsAuthenticated, setIsAdmin } = useAuthContext();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: authService.adminLogin,
    onSuccess: (data) => {
      if (data.success && data.admin) {
        // Store admin data in localStorage
        localStorage.setItem('admin', JSON.stringify({
          ...data.admin,
          sessionId: data.sessionId
        }));
        
        setIsAdmin(true);
        setIsAuthenticated(true);
        navigate('/admin/dashboard');
      }
      return data;
    }
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data, variables) => {
      if (data.success) {
        // Update the cached user data
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          localStorage.setItem('user', JSON.stringify({
            ...user,
            department: data.user?.department || user.department,
            designation: data.user?.designation || user.designation,
            bank_account: data.user?.bank_account || user.bank_account
          }));
        }
      }
      return data;
    }
  });
} 