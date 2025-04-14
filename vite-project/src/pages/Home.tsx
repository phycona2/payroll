import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SplineBlackwhole from '../components/Spline/SplineBlackwhole';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.config';

// Add interface for the dashboard data structure
interface DashboardData {
  employee: {
    name: string;
    email: string;
    department: string;
    designation: string;
  };
  dashboard: {
    attendance: {
      last_punch_in: string | null;
      last_punch_out: string | null;
      last_date: string | null;
      hours_worked: string;
    };
    salary: {
      base_salary: number;
      overtime: number;
      deductions: number;
      net_salary: number;
      last_payment_month: string | null;
    };
    time_tracking: {
      days_present: number;
      total_hours: string;
      current_month: string;
    };
    leaves: {
      pending_requests: number;
    };
    recent_activity: Array<{
      type: string;
      date: string;
      amount: string;
      status: string;
    }>;
  };
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userStr);
      const response = await axios.get(ENDPOINTS.EMPLOYEE_DETAILS, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.sessionId}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-gray-500 text-center p-4">No data available</div>;
  }

  const { employee, dashboard } = dashboardData;

  return (
    <div className="w-full min-h-screen relative">
      {/* Add Spline Background */}
      <div className="fixed inset-0 w-full h-full z-0 bg-black">
        <SplineBlackwhole />
      </div>

      {/* Add relative positioning and z-index to the content */}
      <div className="w-full min-h-[calc(100vh-12rem)] p-6 relative z-10">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
            bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back, <span className="text-white font-medium">{employee.name}</span>
          </p>
          <p className="text-gray-400">{employee.designation} - {employee.department}</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Attendance Card */}
          <div 
            onClick={() => navigate('/attendance')}
            className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300
              group hover:transform hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Attendance</h3>
              <span className="text-3xl">⏱️</span>
            </div>
            <div className="space-y-2">
              <p className="text-gray-400">Today's Status</p>
              <p className="text-sm text-gray-400">
                {dashboard.attendance.last_punch_in ? 'Punched In' : 'Not Punched In'}
              </p>
              <p className="text-sm text-gray-400">
                Hours: {dashboard.attendance.hours_worked}
              </p>
            </div>
          </div>

          {/* Salary Overview Card */}
          <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-md 
            border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300
            group hover:transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Salary Overview</h3>
              <span className="text-3xl">💰</span>
            </div>
            <div className="space-y-2">
              <p className="text-gray-400">Net Salary</p>
              <p className="text-2xl font-bold text-white">
                ${dashboard.salary.net_salary.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">
                Last paid: {dashboard.salary.last_payment_month || 'Not available'}
              </p>
            </div>
          </div>

          {/* Time Tracking Card */}
          <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-md 
            border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300
            group hover:transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Time Tracking</h3>
              <span className="text-3xl">⏰</span>
            </div>
            <div className="space-y-2">
              <p className="text-gray-400">{dashboard.time_tracking.current_month}</p>
              <p className="text-2xl font-bold text-white">
                {dashboard.time_tracking.total_hours} Hours
              </p>
              <p className="text-sm text-gray-400">
                {dashboard.time_tracking.days_present} days present
              </p>
            </div>
          </div>

          {/* Documents Card */}
          <div className="bg-gradient-to-br from-green-600/10 to-green-800/10 backdrop-blur-md 
            border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300
            group hover:transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Documents</h3>
              <span className="text-3xl">📄</span>
            </div>
            <div className="space-y-2">
              <p className="text-gray-400">Recent</p>
              <p className="text-2xl font-bold text-white">3 New</p>
              <p className="text-sm text-gray-400">Tax documents ready</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Recent Activity</h2>
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/10">
              {dashboard.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">
                      {activity.type === 'payroll' ? '💸' : '📝'}
                    </span>
                    <div>
                      <p className="text-white font-medium">
                        {activity.type === 'payroll' ? 'Salary Processed' : 'Attendance'}
                      </p>
                      <p className="text-sm text-gray-400">{activity.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {activity.type === 'payroll' ? `$${activity.amount}` : `${activity.amount} hrs`}
                    </p>
                    <p className="text-sm text-green-400">{activity.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 