import axios from 'axios';
import { ENDPOINTS } from '../config/api.config.ts';

// Create axios instance with default config
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // This is crucial for handling sessions
});

// Add an interceptor to include the session ID in requests
api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  return config;
});

interface RegisterData {
  name: string;
  email: string;
  password: string;
  department: string;
  designation: string;
  bank_account: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    name: string;
    email: string;
    department?: string;
    designation?: string;
  };
  sessionId?: string; // Add sessionId to the response type
}

interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  logged_in?: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    department?: string;
    designation?: string;
    bank_account?: string;
  };
  sessionId?: string; // Add sessionId to the response type
}

export interface UpdateProfileData {
  user_id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
  bank_account: string;
}

interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    name: string;
    email: string;
    department: string;
    designation: string;
    bank_account: string;
  };
}

interface AdminLoginRequest {
  email: string;
  password: string;
}

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

export const authService = {
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    try {
      const response = await api.post<RegisterResponse>(ENDPOINTS.REGISTER, data);
      
      // Store the sessionId if provided
      if (response.data.sessionId) {
        localStorage.setItem('sessionId', response.data.sessionId);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>(ENDPOINTS.LOGIN, data);
      
      // Store the sessionId if provided
      if (response.data.sessionId) {
        localStorage.setItem('sessionId', response.data.sessionId);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (data: UpdateProfileData): Promise<UpdateProfileResponse> => {
    try {
      console.log('Sending update profile request with data:', data);
      const response = await api.put<UpdateProfileResponse>(
        ENDPOINTS.UPDATE_USER_PROFILE,
        data,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      console.log('Update profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  adminLogin: async (data: AdminLoginRequest): Promise<AdminLoginResponse> => {
    try {
      const response = await api.post<AdminLoginResponse>(ENDPOINTS.ADMIN_LOGIN, data, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
}; 