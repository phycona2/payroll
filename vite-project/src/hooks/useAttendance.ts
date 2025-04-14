import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.config';
import { useNavigate } from 'react-router-dom';

// Helper function to get user from localStorage
const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Helper to calculate hours worked
const calculateHoursWorked = (punchIn: string | null, punchOut: string | null) => {
  if (!punchIn || !punchOut) return 0;
  
  const [inHours, inMinutes] = punchIn.split(':').map(Number);
  const [outHours, outMinutes] = punchOut.split(':').map(Number);
  
  const totalInMinutes = inHours * 60 + inMinutes;
  const totalOutMinutes = outHours * 60 + outMinutes;
  
  return Number((Math.max(0, (totalOutMinutes - totalInMinutes) / 60)).toFixed(2));
};

export function useAttendanceData(selectedDate: string) {
  const navigate = useNavigate();
  
  return useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: async () => {
      const user = getUser();
      if (!user) {
        navigate('/login');
        throw new Error('User not authenticated');
      }
      
      const response = await axios.get(`${ENDPOINTS.ATTENDANCE}/employee`, {
        withCredentials: true,
        params: { 
          date: selectedDate,
          employee_id: user.id
        },
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.success) {
        return response.data.data
          .filter((record: any) => Number(record.employee_id) === user.id)
          .map((record: any) => ({
            id: Number(record.id),
            employee_id: Number(record.employee_id),
            punch_in: record.punch_in ? 
              (record.punch_in.includes(' ') ? record.punch_in.split(' ')[1] : record.punch_in) 
              : null,
            punch_out: record.punch_out ? 
              (record.punch_out.includes(' ') ? record.punch_out.split(' ')[1] : record.punch_out) 
              : null,
            date: record.date,
            hours_worked: record.hours_worked !== undefined ? 
              Number(record.hours_worked) : 
              calculateHoursWorked(
                record.punch_in ? (record.punch_in.includes(' ') ? record.punch_in.split(' ')[1] : record.punch_in) : null,
                record.punch_out ? (record.punch_out.includes(' ') ? record.punch_out.split(' ')[1] : record.punch_out) : null
              )
          }));
      } else {
        throw new Error(response.data.message || 'Failed to load attendance data');
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMonthlyAttendance(currentMonth: string) {
  const navigate = useNavigate();
  
  return useQuery({
    queryKey: ['attendance', 'monthly', currentMonth],
    queryFn: async () => {
      const user = getUser();
      if (!user) {
        navigate('/login');
        throw new Error('User not authenticated');
      }
      
      const response = await axios.get(`${ENDPOINTS.ATTENDANCE}/employee/monthly`, {
        withCredentials: true,
        params: { 
          month: currentMonth,
          employee_id: user.id
        },
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.success) {
        return response.data.data
          .filter((record: any) => record.employee_id === user.id)
          .map((record: any) => ({
            id: Number(record.id),
            employee_id: Number(record.employee_id),
            punch_in: record.punch_in,
            punch_out: record.punch_out,
            date: record.date,
            hours_worked: record.hours_worked !== undefined ? 
              Number(record.hours_worked) : 
              calculateHoursWorked(record.punch_in, record.punch_out)
          }));
      } else {
        throw new Error(response.data.message || 'Failed to load monthly attendance data');
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

interface PunchOutParams {
  id: number;
  date: string;
}

export function usePunchOut(recordId: number) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (params: PunchOutParams) => {
      const user = getUser();
      if (!user) {
        navigate('/login');
        throw new Error('User not authenticated');
      }
      
      // Get the current attendance record to preserve punch_in time
      const currentRecord = await axios.get(`${ENDPOINTS.ATTENDANCE}/employee`, {
        withCredentials: true,
        params: { 
          date: params.date,
          employee_id: user.id
        },
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });

      // Make sure we have data and it's an array
      if (!currentRecord.data.success || !Array.isArray(currentRecord.data.data)) {
        throw new Error('Failed to fetch current attendance record');
      }

      const existingRecord = currentRecord.data.data
        .filter((record: any) => Number(record.employee_id) === user.id)
        .find((record: any) => Number(record.id) === params.id);

      if (!existingRecord) {
        throw new Error('Attendance record not found');
      }

      if (!existingRecord.punch_in) {
        throw new Error('No punch-in time found for this record');
      }

      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      
      // Extract punch_in time, handling both datetime and time-only formats
      const punch_in = existingRecord.punch_in.includes(' ') 
        ? existingRecord.punch_in.split(' ')[1] 
        : existingRecord.punch_in;
      
      const hours_worked = calculateHoursWorked(punch_in, currentTime);

      const response = await axios.put(ENDPOINTS.ATTENDANCE, {
        id: params.id,
        employee_id: user.id,  // Add employee_id to ensure we're updating the correct record
        date: params.date,
        punch_out: currentTime,
        punch_in: punch_in,
        hours_worked: hours_worked
      }, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to punch out');
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch attendance queries
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['attendance', today] });
      
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      queryClient.invalidateQueries({ queryKey: ['attendance', 'monthly', currentMonth] });
    }
  });
}

export function usePunchIn() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async () => {
      const user = getUser();
      if (!user) {
        navigate('/login');
        throw new Error('User not authenticated');
      }
      
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      const today = now.toISOString().split('T')[0];
      
      const response = await axios.post(ENDPOINTS.ATTENDANCE, {
        employee_id: user.id,
        date: today,
        punch_in: currentTime
      }, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to punch in');
      }
      
      return response.data;
    },
    onSuccess: () => {
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['attendance', today] });
    }
  });
} 