import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.config';
import { useNavigate } from 'react-router-dom';

// Helper function to get user from localStorage
const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export function useLeaveRequests() {
  const navigate = useNavigate();
  
  return useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const user = getUser();
      if (!user) {
        navigate('/login');
        throw new Error('User not authenticated');
      }
      
      const response = await axios.get(ENDPOINTS.LEAVES, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.success) {
        // Handle different response formats
        let leaveData;
        if (response.data.leaves) {
          leaveData = response.data.leaves;
        } else if (Array.isArray(response.data.data)) {
          leaveData = response.data.data;
        } else if (Array.isArray(response.data)) {
          leaveData = response.data;
        } else {
          throw new Error('Unexpected response format');
        }
        
        // Filter leaves for current user
        return leaveData.filter((leave: any) => 
          Number(leave.employee_id) === Number(user.id)
        );
      } else {
        throw new Error(response.data.message || 'Failed to load leave requests');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSubmitLeaveRequest() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (formData: {
      start_date: string;
      end_date: string;
      type: 'annual' | 'sick' | 'personal';
      reason: string;
    }) => {
      const user = getUser();
      if (!user) {
        navigate('/login');
        throw new Error('User not authenticated');
      }
      
      const response = await axios.post(ENDPOINTS.LEAVES, {
        employee_id: user.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        type: formData.type,
        status: 'pending',
        reason: formData.reason
      }, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to submit leave request');
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch leaves query
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    }
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (leaveId: number) => {
      const user = getUser();
      if (!user) {
        navigate('/login');
        throw new Error('User not authenticated');
      }
      
      const response = await axios.delete(`${ENDPOINTS.LEAVES}?id=${leaveId}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to cancel leave request');
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch leaves query
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    }
  });
} 