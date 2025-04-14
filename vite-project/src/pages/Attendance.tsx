import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttendanceData, useMonthlyAttendance, usePunchIn, usePunchOut } from '../hooks/useAttendance';
import SplineVoice from '../components/Spline/SplineVoice';

interface AttendanceRecord {
  id: number;
  employee_id: number;
  punch_in: string | null;
  punch_out: string | null;
  date: string;
  hours_worked: number;
}

const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [error, setError] = useState('');

  // Use React Query hooks
  const { 
    data: attendanceRecords = [], 
    isLoading: isLoadingAttendance,
    error: attendanceError
  } = useAttendanceData(selectedDate);
  
  const {
    data: monthlyRecords = [],
    isLoading: isLoadingMonthly,
    error: monthlyError,
    refetch: fetchMonthlyAttendance
  } = useMonthlyAttendance(currentMonth);
  
  const punchInMutation = usePunchIn();
  const punchOutMutation = usePunchOut(todayRecord?.id || 0);

  // Set today's record when data is loaded
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayRec = attendanceRecords.find((record: AttendanceRecord) => record.date === today);
      
      if (todayRec) {
        setTodayRecord(todayRec);
        setIsPunchedIn(!!todayRec.punch_in && !todayRec.punch_out);
      } else {
        setTodayRecord(null);
        setIsPunchedIn(false);
      }
    } else {
      setTodayRecord(null);
      setIsPunchedIn(false);
    }
  }, [attendanceRecords]);

  // Handle errors from React Query
  useEffect(() => {
    if (attendanceError) {
      setError(attendanceError instanceof Error ? attendanceError.message : 'Failed to load attendance data');
    } else if (monthlyError) {
      setError(monthlyError instanceof Error ? monthlyError.message : 'Failed to load monthly attendance data');
    } else {
      setError('');
    }
  }, [attendanceError, monthlyError]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMonth(e.target.value);
  };

  const handlePunchIn = async () => {
    try {
      await punchInMutation.mutateAsync();
      alert('Punched in successfully!');
    } catch (error) {
      console.error('Error punching in:', error);
      alert('Failed to punch in. Please try again.');
    }
  };

  const handlePunchOut = async () => {
    if (!todayRecord?.id) {
      console.error('No attendance record found for today');
      alert('Cannot punch out: No attendance record found for today');
      return;
    }
    
    try {
      await punchOutMutation.mutateAsync({
        id: todayRecord.id,
        date: new Date().toISOString().split('T')[0]
      });
      alert('Punched out successfully!');
    } catch (error) {
      console.error('Error punching out:', error);
      if (error instanceof Error) {
        alert(`Failed to punch out: ${error.message}`);
      } else {
        alert('Failed to punch out. Please try again.');
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Rest of your component remains the same...
  // Just replace isLoading with (isLoadingAttendance || isLoadingMonthly || punchInMutation.isPending || punchOutMutation.isPending)
  
  const isLoading = isLoadingAttendance || isLoadingMonthly || punchInMutation.isPending || punchOutMutation.isPending;

  return (
    <div className="w-full min-h-screen relative">
      {/* Spline Background */}
      <div className="fixed inset-0 w-full h-full z-0 bg-black">
        <SplineVoice />
      </div>

      {/* Content */}
      <div className="w-full min-h-[calc(100vh-12rem)] p-6 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
            bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            My Attendance
          </h1>
          <p className="text-gray-400">Track your daily attendance records</p>
        </div>

        {/* Punch In/Out Card */}
        <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-md 
          border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Today's Attendance</h3>
              {!todayRecord?.punch_in ? (
                <div className="flex items-center text-gray-400 mb-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                  Not punched in yet
                </div>
              ) : (
                <>
                  <div className="flex items-center text-gray-400 mb-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                    <span>Punched in at </span>
                    <span className="text-white ml-1 font-medium">{todayRecord.punch_in}</span>
                  </div>
                  
                  {todayRecord.punch_out ? (
                    <div className="flex items-center text-gray-400 mb-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                      <span>Punched out at </span>
                      <span className="text-white ml-1 font-medium">{todayRecord.punch_out}</span>
                    </div>
                  ) : null}
                  
                  {todayRecord.punch_in && todayRecord.punch_out && (
                    <div className="mt-3 px-4 py-2 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Hours worked today:</span>
                        <span className="text-white font-bold text-lg">
                          {todayRecord.hours_worked?.toFixed(1) || '0.0'} hrs
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Add shift status indicator */}
              <div className="mt-3">
                {todayRecord?.punch_out ? (
                  <div className="inline-flex items-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    <span className="text-green-400 text-sm">Shift Completed</span>
                  </div>
                ) : todayRecord?.punch_in ? (
                  <div className="inline-flex items-center px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                    <span className="text-blue-400 text-sm">Shift In Progress</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                    <span className="text-yellow-400 text-sm">Shift Not Started</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handlePunchIn}
                disabled={isLoading || isPunchedIn || (todayRecord?.punch_in && todayRecord?.punch_out)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(todayRecord?.punch_in && todayRecord?.punch_out) ? 'Completed for Today' : 'Punch In'}
              </button>
              <button
                onClick={handlePunchOut}
                disabled={isLoading || !isPunchedIn}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Punch Out
              </button>
            </div>
          </div>
        </div>

        {/* Date and Month Selectors */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-gray-300 mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                transition-all duration-200 text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-300 mb-2">View Monthly History</label>
            <div className="flex gap-2">
              <input
                type="month"
                value={currentMonth}
                onChange={handleMonthChange}
                className="flex-1 px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                  transition-all duration-200 text-white"
              />
              <button
                onClick={() => fetchMonthlyAttendance()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 
                  transition-all duration-200"
              >
                View
              </button>
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          <h3 className="text-xl font-semibold text-white p-6 border-b border-white/10">
            Attendance History
          </h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full"></div>
              <p className="text-gray-400 mt-2">Loading attendance data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Day</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Punch In</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Punch Out</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Hours Worked</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {attendanceRecords.map((record: AttendanceRecord) => {
                    const recordDate = new Date(record.date);
                    const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'short' });
                    const isComplete = record.punch_in && record.punch_out;
                    const isToday = record.date === new Date().toISOString().split('T')[0];
                    
                    return (
                      <tr key={record.id} className={`hover:bg-white/5 ${isToday ? 'bg-blue-900/10' : ''}`}>
                        <td className="px-6 py-4 text-white">
                          {recordDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {dayName}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {record.punch_in || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {record.punch_out || '-'}
                        </td>
                        <td className="px-6 py-4 text-white font-medium">
                          {record.hours_worked?.toFixed(1) || '0.0'} hrs
                        </td>
                        <td className="px-6 py-4">
                          {isComplete ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs">
                              Complete
                            </span>
                          ) : record.punch_in ? (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">
                              In Progress
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs">
                              Absent
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Summary Section */}
        {attendanceRecords.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-600/10 to-green-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Total Hours</h3>
              <p className="text-2xl font-bold text-white">
                {attendanceRecords.reduce((total: number, record: AttendanceRecord) => total + (record.hours_worked || 0), 0).toFixed(1)} hrs
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Days Present</h3>
              <p className="text-2xl font-bold text-white">
                {attendanceRecords.filter((record: AttendanceRecord) => record.punch_in).length}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Average Hours/Day</h3>
              <p className="text-2xl font-bold text-white">
                {(attendanceRecords.reduce((total: number, record: AttendanceRecord) => total + (record.hours_worked || 0), 0) / 
                  (attendanceRecords.filter((record: AttendanceRecord) => record.hours_worked).length || 1)).toFixed(1)} hrs
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance; 