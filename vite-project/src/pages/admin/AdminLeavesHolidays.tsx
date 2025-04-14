import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ENDPOINTS } from '../../config/api.config';
import SplineLight from '../../components/Spline/SplineChip';
import { useAuth } from '../../contexts/AuthContext';

interface Leave {
  id: number;
  employee_name: string;
  start_date: string;
  end_date: string;
  type: 'annual' | 'sick' | 'personal';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

interface Holiday {
  id: number;
  name: string;
  date: string;
  description: string;
}

const AdminLeavesHolidays: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'leaves' | 'holidays'>('leaves');
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

  const { isAdmin, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/adminlogin');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const adminData = localStorage.getItem('admin');
    if (!adminData || !isAdmin) {
      setError('Unauthorized: Please log in as admin');
      setIsLoading(false);
      navigate('/adminlogin');
      return;
    }

    try {
      const admin = JSON.parse(adminData);
      
      // Log the endpoints we're calling for debugging
      console.log('Fetching from leaves endpoint:', ENDPOINTS.LEAVES);
      console.log('Fetching from holidays endpoint:', ENDPOINTS.HOLIDAYS);
      
      const [leavesResponse, holidaysResponse] = await Promise.all([
        axios.get(ENDPOINTS.LEAVES, { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${admin.sessionId}`,
          }
        }),
        axios.get(ENDPOINTS.HOLIDAYS, { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${admin.sessionId}`,
          }
        })
      ]);
      
      // Log the responses for debugging
      console.log('Leaves API response:', leavesResponse.data);
      console.log('Holidays API response:', holidaysResponse.data);
      
      // Handle different response formats
      // For leaves data
      if (leavesResponse.data.leaves) {
        setLeaves(leavesResponse.data.leaves);
      } else if (Array.isArray(leavesResponse.data)) {
        setLeaves(leavesResponse.data);
      } else if (leavesResponse.data.data && Array.isArray(leavesResponse.data.data)) {
        setLeaves(leavesResponse.data.data);
      } else {
        console.error('Unexpected leaves response format:', leavesResponse.data);
        setLeaves([]);
      }
      
      // For holidays data
      if (holidaysResponse.data.holidays) {
        setHolidays(holidaysResponse.data.holidays);
      } else if (Array.isArray(holidaysResponse.data)) {
        setHolidays(holidaysResponse.data);
      } else if (holidaysResponse.data.data && Array.isArray(holidaysResponse.data.data)) {
        setHolidays(holidaysResponse.data.data);
      } else {
        console.error('Unexpected holidays response format:', holidaysResponse.data);
        setHolidays([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (axios.isAxiosError(error)) {
        console.error('API error details:', error.response?.data);
        if (error.response?.status === 401) {
          setError('Session expired. Please log in again.');
          navigate('/adminlogin');
        } else {
          setError(`Failed to load data: ${error.response?.data?.message || error.message}`);
        }
      } else {
        setError('Failed to load data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId: number, action: 'approve' | 'reject') => {
    try {
      // Get admin data for authorization
      const adminData = localStorage.getItem('admin');
      if (!adminData) {
        setError('Unauthorized: Please log in as admin');
        return;
      }
      
      const admin = JSON.parse(adminData);
      
      // Log the action for debugging
      console.log(`Sending ${action} action for leave ID ${leaveId}`);
      
      // Update to match the API documentation format
      const payload = {
        id: leaveId,
        status: action === 'approve' ? 'approved' : 'rejected'
      };
      
      const response = await axios.put(ENDPOINTS.LEAVES, payload, { 
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${admin.sessionId}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Leave action response:', response.data);
      
      // Show success message
      alert(`Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh leaves data
      fetchData();
    } catch (error) {
      console.error('Error updating leave:', error);
      if (axios.isAxiosError(error)) {
        console.error('API error details:', error.response?.data);
        setError(`Failed to update leave status: ${error.response?.data?.message || error.message}`);
      } else {
        setError('Failed to update leave status');
      }
    }
  };

  const handleDeleteLeave = async (leaveId: number) => {
    if (!confirm('Are you sure you want to delete this leave record?')) {
      return;
    }
    
    try {
      // Get admin data for authorization
      const adminData = localStorage.getItem('admin');
      if (!adminData) {
        setError('Unauthorized: Please log in as admin');
        return;
      }
      
      const admin = JSON.parse(adminData);
      
      console.log(`Deleting leave with ID ${leaveId}`);
      
      const response = await axios.delete(`${ENDPOINTS.LEAVES}?id=${leaveId}`, { 
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${admin.sessionId}`,
        }
      });
      
      console.log('Delete leave response:', response.data);
      
      // Show success message
      alert('Leave record deleted successfully');
      
      // If we're viewing the leave details modal, close it
      if (selectedLeave && selectedLeave.id === leaveId) {
        setSelectedLeave(null);
      }
      
      // Refresh leaves data
      fetchData();
    } catch (error) {
      console.error('Error deleting leave:', error);
      if (axios.isAxiosError(error)) {
        console.error('API error details:', error.response?.data);
        setError(`Failed to delete leave: ${error.response?.data?.message || error.message}`);
      } else {
        setError('Failed to delete leave');
      }
    }
  };

  const handleAddHoliday = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      // Get admin data for authorization
      const adminData = localStorage.getItem('admin');
      if (!adminData) {
        setError('Unauthorized: Please log in as admin');
        return;
      }
      
      const admin = JSON.parse(adminData);
      
      const holidayData = {
        name: formData.get('name'),
        date: formData.get('date'),
        description: formData.get('description') || ''
      };
      
      console.log('Adding holiday with data:', holidayData);
      
      const response = await axios.post(ENDPOINTS.HOLIDAYS, holidayData, { 
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${admin.sessionId}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Add holiday response:', response.data);
      
      // Show success message
      alert('Holiday added successfully');
      
      // Refresh holidays data
      fetchData();
      form.reset();
    } catch (error) {
      console.error('Error adding holiday:', error);
      if (axios.isAxiosError(error)) {
        console.error('API error details:', error.response?.data);
        setError(`Failed to add holiday: ${error.response?.data?.message || error.message}`);
      } else {
        setError('Failed to add holiday');
      }
    }
  };

  const handleDeleteHoliday = async (holidayId: number) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return;
    }
    
    try {
      // Get admin data for authorization
      const adminData = localStorage.getItem('admin');
      if (!adminData) {
        setError('Unauthorized: Please log in as admin');
        return;
      }
      
      const admin = JSON.parse(adminData);
      
      console.log(`Deleting holiday with ID ${holidayId}`);
      
      const response = await axios.delete(`${ENDPOINTS.HOLIDAYS}?id=${holidayId}`, { 
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${admin.sessionId}`,
        }
      });
      
      console.log('Delete holiday response:', response.data);
      
      // Show success message
      alert('Holiday deleted successfully');
      
      // Refresh holidays data
      fetchData();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      if (axios.isAxiosError(error)) {
        console.error('API error details:', error.response?.data);
        setError(`Failed to delete holiday: ${error.response?.data?.message || error.message}`);
      } else {
        setError('Failed to delete holiday');
      }
    }
  };

  const handleViewLeaveDetails = (leave: Leave) => {
    setSelectedLeave(leave);
  };

  const handleCloseLeaveDetails = () => {
    setSelectedLeave(null);
  };

  return (
    <div className="w-full min-h-screen relative">
      {/* Spline Background */}
      <div className="fixed inset-0 w-full h-full z-0 bg-black">
        <SplineLight />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full min-h-[calc(100vh-12rem)] p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
            bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Leaves & Holidays
          </h1>
          <p className="text-gray-400">Manage employee leaves and company holidays</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-2 rounded-xl transition-all duration-200 ${
              activeTab === 'leaves'
                ? 'bg-blue-600 text-white'
                : 'bg-black/20 text-gray-400 hover:text-white'
            }`}
          >
            Leave Requests
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-2 rounded-xl transition-all duration-200 ${
              activeTab === 'holidays'
                ? 'bg-blue-600 text-white'
                : 'bg-black/20 text-gray-400 hover:text-white'
            }`}
          >
            Holidays
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full"></div>
              <p className="text-gray-400 mt-2">Loading data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
            </div>
          ) : activeTab === 'leaves' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Employee</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {leaves.map((leave) => (
                    <tr 
                      key={leave.id} 
                      className="hover:bg-white/5 cursor-pointer"
                      onClick={() => handleViewLeaveDetails(leave)}
                    >
                      <td className="px-6 py-4 text-white">{leave.employee_name}</td>
                      <td className="px-6 py-4 text-gray-300 capitalize">{leave.type}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          leave.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                          leave.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {leave.status === 'pending' ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveAction(leave.id, 'approve');
                                }}
                                className="text-green-400 hover:text-green-300 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveAction(leave.id, 'reject');
                                }}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveAction(leave.id, 'approve');
                              }}
                              className="text-green-400 hover:text-green-300 transition-colors"
                            >
                              Approved
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLeave(leave.id);
                            }}
                            className="text-gray-400 hover:text-gray-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              {/* Add Holiday Form */}
              <form onSubmit={handleAddHoliday} className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Holiday Name"
                    className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white"
                    required
                  />
                  <input
                    type="date"
                    name="date"
                    className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white"
                    required
                  />
                  <input
                    type="text"
                    name="description"
                    placeholder="Description (optional)"
                    className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500"
                  >
                    Add Holiday
                  </button>
                </div>
              </form>

              {/* Holidays List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="bg-black/30 border border-white/10 rounded-xl p-4 relative"
                  >
                    <h3 className="text-white font-semibold mb-2">{holiday.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {new Date(holiday.date).toLocaleDateString()}
                    </p>
                    {holiday.description && (
                      <p className="text-gray-400 text-sm mt-2">{holiday.description}</p>
                    )}
                    <button
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete holiday"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedLeave && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/80 border border-white/10 rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Leave Details</h3>
                <button 
                  onClick={handleCloseLeaveDetails}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Employee</p>
                  <p className="text-white">{selectedLeave.employee_name}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Type</p>
                  <p className="text-white capitalize">{selectedLeave.type}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white">
                    {new Date(selectedLeave.start_date).toLocaleDateString()} - {new Date(selectedLeave.end_date).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedLeave.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                    selectedLeave.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {selectedLeave.status}
                  </span>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Reason</p>
                  <p className="text-white">{selectedLeave.reason || 'No reason provided'}</p>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  {selectedLeave.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => {
                          handleLeaveAction(selectedLeave.id, 'approve');
                          handleCloseLeaveDetails();
                        }}
                        className="flex-1 px-4 py-2 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleLeaveAction(selectedLeave.id, 'reject');
                          handleCloseLeaveDetails();
                        }}
                        className="flex-1 px-4 py-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        handleLeaveAction(selectedLeave.id, 'approve');
                        handleCloseLeaveDetails();
                      }}
                      className="flex-1 px-4 py-2 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-colors"
                    >
                      Approved
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDeleteLeave(selectedLeave.id);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600/20 text-gray-400 rounded-xl hover:bg-gray-600/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeavesHolidays; 