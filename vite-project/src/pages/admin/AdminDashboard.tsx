import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SplinePartical from '../../components/Spline/SplinePartical';
import { 
  getDashboardStats, 
  getRecentActivities, 
  formatCurrency, 
  DashboardStats, 
  Activity,
  getFallbackStats,
  getFallbackActivities,
  getActivityIcon
} from '../../services/dashboardService';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, setIsAdmin } = useAuth();
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initDashboard = async () => {
      // Check if admin is logged in
      const adminStr = localStorage.getItem('admin');
      if (!adminStr) {
        console.log('No admin data found, redirecting to login');
        setIsAdmin(false);
        navigate('/adminlogin');
        return;
      }

      try {
        const admin = JSON.parse(adminStr);
        if (!admin || !admin.id) {
          throw new Error('Invalid admin data');
        }
        
        setAdminName(admin.name || admin.username || 'Admin');
        setIsAdmin(true);
        
        // Only fetch data if component is still mounted
        if (mounted) {
          await fetchDashboardData();
        }
        
      } catch (err) {
        console.error('Dashboard initialization error:', err);
        localStorage.removeItem('admin');
        setIsAdmin(false);
        navigate('/adminlogin');
      }
    };

    initDashboard();
    
    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(() => {
      if (mounted) {
        fetchDashboardData();
      }
    }, 5 * 60 * 1000);

    // Clean up
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [navigate, setIsAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get stats data with error handling
      try {
        console.log('Fetching dashboard stats...');
        const statsData = await getDashboardStats();
        console.log('Received stats data:', statsData);
        
        // Validate the stats data
        if (!statsData || typeof statsData !== 'object') {
          throw new Error('Invalid stats data received');
        }
        
        setStats(statsData);
        
      } catch (err) {
        console.error('Error fetching stats:', err);
        
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            throw err; // Propagate auth errors
          }
          setError(`API Error: ${err.response?.data?.message || err.message}`);
        } else {
          setError('Failed to load dashboard stats');
        }
        
        setStats(getFallbackStats());
      }
      
      // Get activities data with error handling
      try {
        const activitiesData = await getRecentActivities(5);
        setActivities(activitiesData);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setActivities(getFallbackActivities());
      }
      
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      
      // Handle authentication errors
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        console.log('Authentication error, redirecting to login');
        localStorage.removeItem('admin');
        setIsAdmin(false);
        navigate('/adminlogin');
        return;
      }
      
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !stats) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center max-w-md p-6 bg-red-900/20 rounded-lg border border-red-500/30">
          <p className="text-xl mb-4">⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen relative">
      {/* Spline Background with black base */}
      <div className="fixed inset-0 w-full h-full z-0 bg-black">
        <SplinePartical />
      </div>

      {/* Dashboard Content */}
      <div className="relative z-10 w-full min-h-[calc(100vh-12rem)] p-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
            bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back, <span className="text-white font-medium">{adminName}</span>
          </p>
          <p className="text-gray-400">Manage your organization's payroll system</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Employee Management Card */}
          <div 
            onClick={() => navigate('/admin/employees')}
            className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300
              group hover:transform hover:scale-[1.02] cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Employees</h3>
              <span className="text-3xl">👥</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400">Total Employees</p>
                <p className="text-2xl font-bold text-white">{stats?.overview.total_employees || '0'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-green-400">{stats?.overview.on_time_today || '0'}</p>
                  <p className="text-gray-400">On Time Today</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-yellow-400">{stats?.overview.late_today || '0'}</p>
                  <p className="text-gray-400">Late Today</p>
                </div>
              </div>
              <p className="text-sm text-emerald-400">
                {stats?.leaves.pending_requests.length || 0} pending leave requests
              </p>
            </div>
          </div>

          {/* Payroll Overview Card */}
          <div 
            onClick={() => navigate('/admin/payroll')}
            className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300
              group hover:transform hover:scale-[1.02] cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Payroll</h3>
              <span className="text-3xl">💰</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400">Monthly Payroll</p>
                <p className="text-2xl font-bold text-white">
                  ${Number(stats?.payroll.total_payout || 0).toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-purple-400">{stats?.payroll.processed_this_month || '0'}</p>
                  <p className="text-gray-400">Processed</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-orange-400">{stats?.payroll.pending_payrolls || '0'}</p>
                  <p className="text-gray-400">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Card */}
          <div 
            onClick={() => navigate('/admin/attendance')}
            className="bg-gradient-to-br from-green-600/10 to-green-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300
              group hover:transform hover:scale-[1.02] cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Attendance</h3>
              <span className="text-3xl">📊</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400">Today's Attendance</p>
                <p className="text-2xl font-bold text-white">{stats?.overview.present_today || '0'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-green-400">{stats?.overview.on_time_today || '0'}</p>
                  <p className="text-gray-400">On Time</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-red-400">{stats?.overview.late_today || '0'}</p>
                  <p className="text-gray-400">Late</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Recent Activity</h2>
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/10">
              {loading && !stats?.activities.length ? (
                <div className="p-6 text-center text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Loading activities...</p>
                </div>
              ) : stats?.activities.length ? (
                stats.activities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                      <div>
                        <p className="text-white font-medium">{activity.description}</p>
                        <p className="text-sm text-gray-400">{activity.activity_date}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-400">
                  <p>No recent activities found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Last updated indicator */}
        <div className="mt-6 text-right">
          <p className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
            {loading && <span className="ml-2 inline-block animate-pulse">⟳</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 