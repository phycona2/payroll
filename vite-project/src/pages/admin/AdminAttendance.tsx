import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ENDPOINTS } from '../../config/api.config';
import { useAuth } from '../../contexts/AuthContext';
import SplineBlackwhole from '../../components/Spline/SplineBlackwhole';

interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name?: string;
  punch_in: string;
  punch_out: string;
  date: string;
  hours_worked?: number;
}

interface Employee {
  id: string;
  name: string;
}

const AdminAttendance: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Form state for adding/editing attendance
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({
    employee_id: 0,
    punch_in: '',
    punch_out: '',
    date: selectedDate
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/adminlogin');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAttendanceData();
      fetchEmployees();
    }
  }, [selectedDate, isAdmin]);

  const fetchAttendanceData = async () => {
    // Check authentication first
    const adminData = localStorage.getItem('admin');
    if (!adminData || !isAdmin) {
      setError('Unauthorized: Please log in as admin');
      setIsLoading(false);
      navigate('/adminlogin');
      return;
    }

    try {
      // Get admin data for token
      const admin = JSON.parse(adminData);
      
      const response = await axios.get(`${ENDPOINTS.ATTENDANCE}`, {
        withCredentials: true,
        params: { date: selectedDate },
        headers: {
          'Authorization': `Bearer ${admin.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.success) {
        // Process and transform the data
        const processedRecords = response.data.data.map((record: any) => ({
          id: Number(record.id),
          employee_id: Number(record.employee_id),
          employee_name: record.employee_name || `Employee ${record.employee_id}`,
          punch_in: record.punch_in,
          punch_out: record.punch_out,
          date: record.date,
          // Use hours_worked from API response if available, otherwise calculate it
          hours_worked: record.hours_worked !== undefined ? 
            Number(record.hours_worked) : 
            calculateHoursWorked(record.punch_in, record.punch_out)
        }));

        setAttendanceRecords(processedRecords);
      } else {
        setError(response.data.message || 'Failed to load attendance data');
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/adminlogin');
      } else {
        setError('Failed to load attendance data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const adminData = localStorage.getItem('admin');
      if (!adminData) return;
      
      const admin = JSON.parse(adminData);
      
      const response = await axios.get(`${ENDPOINTS.EMPLOYEES}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${admin.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.success) {
        setEmployees(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const calculateHoursWorked = (punchIn: string, punchOut: string): number => {
    if (!punchIn || !punchOut) return 0;
    
    const [inHours, inMinutes] = punchIn.split(':').map(Number);
    const [outHours, outMinutes] = punchOut.split(':').map(Number);
    
    const inTime = inHours * 60 + inMinutes;
    const outTime = outHours * 60 + outMinutes;
    
    // Calculate difference in minutes, then convert to hours
    const diffMinutes = outTime - inTime;
    return Math.round((diffMinutes / 60) * 100) / 100; // Round to 2 decimal places
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const employeeName = record.employee_name?.toLowerCase() || '';
    return employeeName.includes((searchTerm || '').toLowerCase());
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.punch_in || !formData.punch_out || !formData.date) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const adminData = localStorage.getItem('admin');
      if (!adminData) throw new Error('Admin session not found');
      
      const admin = JSON.parse(adminData);
      const headers = {
        'Authorization': `Bearer ${admin.sessionId}`,
        'Content-Type': 'application/json',
      };
      
      let response;
      
      if (isEditing && formData.id) {
        // Update existing record
        response = await axios.put(ENDPOINTS.ATTENDANCE, formData, {
          withCredentials: true,
          headers
        });
      } else {
        // Add new record
        response = await axios.post(ENDPOINTS.ATTENDANCE, formData, {
          withCredentials: true,
          headers
        });
      }
      
      if (response.data.success) {
        alert(response.data.message || `Attendance record ${isEditing ? 'updated' : 'added'} successfully`);
        // Reset form and refresh data
        setFormData({
          employee_id: 0,
          punch_in: '',
          punch_out: '',
          date: selectedDate
        });
        setIsFormOpen(false);
        setIsEditing(false);
        fetchAttendanceData();
      } else {
        throw new Error(response.data.message || `Failed to ${isEditing ? 'update' : 'add'} attendance record`);
      }
    } catch (error) {
      console.error('Error saving attendance record:', error);
      alert(error instanceof Error ? error.message : 'An error occurred while saving the attendance record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setFormData({
      id: record.id,
      employee_id: record.employee_id,
      punch_in: record.punch_in,
      punch_out: record.punch_out,
      date: record.date
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const adminData = localStorage.getItem('admin');
      if (!adminData) throw new Error('Admin session not found');
      
      const admin = JSON.parse(adminData);
      
      const response = await axios.delete(`${ENDPOINTS.ATTENDANCE}?id=${id}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${admin.sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.success) {
        alert('Attendance record deleted successfully');
        fetchAttendanceData();
      } else {
        throw new Error(response.data.message || 'Failed to delete attendance record');
      }
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      alert(error instanceof Error ? error.message : 'An error occurred while deleting the attendance record');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen relative">
      {/* Spline Background */}
      <div className="fixed inset-0 w-full h-full z-0 bg-black">
        <SplineBlackwhole />
      </div>

      {/* Content */}
      {authLoading ? (
        <div className="w-full min-h-[calc(100vh-12rem)] p-6 flex items-center justify-center relative z-10">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full"></div>
        </div>
      ) : (
        <div className="w-full min-h-[calc(100vh-12rem)] p-6 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
              bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Attendance Management
            </h1>
            <p className="text-gray-400">Track and manage employee attendance records</p>
          </div>

          {/* Attendance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Present Today</h3>
                <span className="text-3xl">👥</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {filteredRecords.length}
              </p>
              <p className="text-sm text-gray-400">Employees checked in</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Average Hours</h3>
                <span className="text-3xl">⏱️</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {filteredRecords.length > 0 
                  ? (filteredRecords.reduce((sum, record) => sum + (record.hours_worked || 0), 0) / filteredRecords.length).toFixed(1)
                  : '0.0'}
              </p>
              <p className="text-sm text-gray-400">Hours per employee</p>
            </div>

            <div className="bg-gradient-to-br from-green-600/10 to-green-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Total Hours</h3>
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {filteredRecords.reduce((sum, record) => sum + (record.hours_worked || 0), 0).toFixed(1)}
              </p>
              <p className="text-sm text-gray-400">Worked today</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                  transition-all duration-200 text-white"
              />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                  transition-all duration-200 text-white placeholder-gray-500"
              />
            </div>
            <button
              onClick={() => {
                setFormData({
                  employee_id: 0,
                  punch_in: '',
                  punch_out: '',
                  date: selectedDate
                });
                setIsEditing(false);
                setIsFormOpen(true);
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 
                transition-all duration-200 flex items-center gap-2 disabled:opacity-50
                disabled:cursor-not-allowed"
            >
              <span>➕</span> Add Attendance
            </button>
          </div>

          {/* Add/Edit Attendance Form */}
          {isFormOpen && (
            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                {isEditing ? 'Edit Attendance Record' : 'Add New Attendance Record'}
              </h3>
              <form onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Employee</label>
                    <select
                      value={formData.employee_id || ''}
                      onChange={(e) => setFormData({...formData, employee_id: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                        transition-all duration-200 text-white"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                        transition-all duration-200 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Punch In</label>
                    <input
                      type="time"
                      value={formData.punch_in || ''}
                      onChange={(e) => setFormData({...formData, punch_in: e.target.value})}
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                        transition-all duration-200 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Punch Out</label>
                    <input
                      type="time"
                      value={formData.punch_out || ''}
                      onChange={(e) => setFormData({...formData, punch_out: e.target.value})}
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                        transition-all duration-200 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 
                      transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 
                      transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{isEditing ? 'Update Record' : 'Add Record'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Attendance Table */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full"></div>
                <p className="text-gray-400 mt-2">Loading attendance data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Employee</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Punch In</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Punch Out</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Hours Worked</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                          No attendance records found for this date
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-white/5">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                                <span className="text-blue-400">
                                  {record.employee_name?.charAt(0) || 'E'}
                                </span>
                              </div>
                              <span className="text-white">{record.employee_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {record.punch_in}
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {record.punch_out}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            {record.hours_worked?.toFixed(1) || '0.0'} hrs
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditRecord(record)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                Edit
                              </button>
                              <span className="text-gray-600">|</span>
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance; 