import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.config';
import SplineTri from '../components/Spline/SplineTri';

interface LeaveRequest {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  type: 'annual' | 'sick' | 'personal';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

const Leaves: React.FC = () => {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    type: 'annual',
    reason: ''
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      // Get user data for token
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      
      const user = JSON.parse(userStr);
      
      const response = await axios.get(ENDPOINTS.LEAVES, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      // Check if response is an array (direct data from API)
      if (Array.isArray(response.data)) {
        // Filter leaves for the current user
        const userLeaves = response.data
          .filter((leave: any) => String(leave.employee_id) === String(user.id))
          .map((leave: any) => ({
            id: Number(leave.id),
            employee_id: Number(leave.employee_id),
            start_date: leave.start_date,
            end_date: leave.end_date,
            type: leave.type.toLowerCase().includes('annual') ? 'annual' : 
                  leave.type.toLowerCase().includes('sick') ? 'sick' : 'personal',
            status: leave.status.toLowerCase(),
            reason: leave.reason || ''
          })) as LeaveRequest[];
        
        setLeaveRequests(userLeaves);
      } 
      // Check if response has a success property and data array
      else if (response.data.success && Array.isArray(response.data.data)) {
        const processedRequests = response.data.data
          .filter((request: any) => String(request.employee_id) === String(user.id))
          .map((request: any) => ({
            id: Number(request.id),
            employee_id: Number(request.employee_id),
            start_date: request.start_date,
            end_date: request.end_date,
            type: request.type.toLowerCase().includes('annual') ? 'annual' : 
                  request.type.toLowerCase().includes('sick') ? 'sick' : 'personal',
            status: request.status.toLowerCase(),
            reason: request.reason || ''
          }));
        
        setLeaveRequests(processedRequests);
      } else {
        setError('Failed to load leave requests: Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/login');
      } else {
        setError('Failed to load leave requests. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      
      const user = JSON.parse(userStr);
      
      // Validate dates
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        alert('Start date cannot be in the past');
        setIsLoading(false);
        return;
      }
      
      if (endDate < startDate) {
        alert('End date cannot be before start date');
        setIsLoading(false);
        return;
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
      
      if (response.data.success) {
        alert('Leave request submitted successfully!');
        setIsFormOpen(false);
        setFormData({
          start_date: '',
          end_date: '',
          type: 'annual',
          reason: ''
        });
        fetchLeaveRequests();
      } else {
        setError(response.data.message || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit leave request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      
      const user = JSON.parse(userStr);
      
      const response = await axios.delete(`${ENDPOINTS.LEAVES}?id=${id}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.success) {
        alert('Leave request cancelled successfully!');
        fetchLeaveRequests();
      } else {
        setError(response.data.message || 'Failed to cancel leave request');
      }
    } catch (error) {
      console.error('Error cancelling leave request:', error);
      alert('Failed to cancel leave request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate the duration of leave in days
  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  };

  // Get status color for display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div className="w-full min-h-screen relative">
      {/* Update Spline Background */}
      <div className="fixed inset-0 w-full h-full z-0 bg-black">
        <SplineTri />
      </div>

      {/* Content */}
      <div className="w-full min-h-[calc(100vh-12rem)] p-6 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
            bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Leave Requests
          </h1>
          <p className="text-gray-400">Apply for and manage your leave requests</p>
        </div>

        {/* Request Leave Button */}
        <div className="mb-6">
          <button
            onClick={() => setIsFormOpen(true)}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request Leave
          </button>
        </div>

        {/* Leave Request Form */}
        {isFormOpen && (
          <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-md 
            border border-white/10 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">New Leave Request</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                      focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                      transition-all duration-200 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                      focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                      transition-all duration-200 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Leave Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                    focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                    transition-all duration-200 text-white"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Reason (Optional)</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                    focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                    transition-all duration-200 text-white"
                  placeholder="Please provide a reason for your leave request..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-xl hover:bg-gray-600/30 
                    transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Leave Requests History */}
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          <h3 className="text-xl font-semibold text-white p-6 border-b border-white/10">
            Leave History
          </h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full"></div>
              <p className="text-gray-400 mt-2">Loading leave requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No leave requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Start Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">End Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {leaveRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-white capitalize">
                        {request.type}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(request.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(request.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-white">
                        {calculateDuration(request.start_date, request.end_date)} days
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Leave Balance Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-600/10 to-green-800/10 backdrop-blur-md 
            border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Annual Leave</h3>
            <p className="text-2xl font-bold text-white">
              {20 - leaveRequests
                .filter(req => req.type === 'annual' && req.status !== 'rejected')
                .reduce((total, req) => total + calculateDuration(req.start_date, req.end_date), 0)} days
            </p>
            <p className="text-gray-400 text-sm mt-1">remaining of 20 days</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-md 
            border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Sick Leave</h3>
            <p className="text-2xl font-bold text-white">
              {10 - leaveRequests
                .filter(req => req.type === 'sick' && req.status !== 'rejected')
                .reduce((total, req) => total + calculateDuration(req.start_date, req.end_date), 0)} days
            </p>
            <p className="text-gray-400 text-sm mt-1">remaining of 10 days</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-md 
            border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Personal Leave</h3>
            <p className="text-2xl font-bold text-white">
              {5 - leaveRequests
                .filter(req => req.type === 'personal' && req.status !== 'rejected')
                .reduce((total, req) => total + calculateDuration(req.start_date, req.end_date), 0)} days
            </p>
            <p className="text-gray-400 text-sm mt-1">remaining of 5 days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaves; 