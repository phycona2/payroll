// Dashboard API service
import axios from 'axios';
import { ENDPOINTS } from '../config/api.config';

// Types
export interface DashboardStats {
  overview: {
    total_employees: string;
    present_today: number;
    on_time_today: string;
    late_today: string;
  };
  payroll: {
    processed_this_month: number;
    total_payout: string;
    pending_payrolls: number;
  };
  leaves: {
    pending_requests: Array<{
      id: number;
      employee_id: number;
      start_date: string;
      end_date: string;
      type: string;
      status: string;
      employee_name: string;
    }>;
  };
  activities: Array<{
    type: string;
    activity_date: string;
    description: string;
  }>;
  holidays: Array<{
    id: number;
    name: string;
    date: string;
  }>;
  department_stats: Array<{
    department: string;
    count: string;
  }>;
}

export interface Activity {
  icon: string;
  title: string;
  date: string;
  details: string;
}

// API response interfaces
interface EmployeeChange {
  action_type: string;
  date: string;
  details: string;
}

interface PayrollEvent {
  status: string;
  date: string;
  details: string;
}

interface LeaveRequest {
  status: string;
  date: string;
  employee_name: string;
}

// Add rate limiting handling
const RATE_LIMIT_DELAY = 1000; // 1 second delay between retries
const MAX_RETRIES = 3;

// Check if the user is authenticated
export const checkAuthentication = async (): Promise<boolean> => {
  try {
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
      return false;
    }
    
    const admin = JSON.parse(adminStr);
    
    // Make a request to the auth check endpoint
    const response = await axios.get(ENDPOINTS.AUTH_CHECK, {
      headers: {
        'Authorization': `Bearer ${admin.token || ''}`,
        'X-Admin-ID': admin.id || ''
      },
      withCredentials: true
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const adminStr = localStorage.getItem('admin');
  if (!adminStr) {
    return {};
  }
  
  try {
    const admin = JSON.parse(adminStr);
    
    // Check if admin data is valid
    if (!admin || !admin.token) {
      console.error('Invalid admin data in localStorage');
      return {};
    }
    
    // Return a simpler set of headers that should work with most APIs
    return {
      'Authorization': `Bearer ${admin.token}`,
      'X-Admin-Token': admin.token
    };
  } catch (error) {
    console.error('Error parsing admin data:', error);
    return {};
  }
};

// Update getDashboardStats function
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
      console.error('No admin data found in localStorage');
      return getFallbackStats();
    }

    const admin = JSON.parse(adminStr);
    
    const response = await axios.get(ENDPOINTS.DASHBOARD, {
      headers: {
        'Authorization': `Bearer ${admin.sessionId}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('Invalid response format from API');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return getFallbackStats();
  }
};

// Update getRecentActivities to match the PHP API
export const getRecentActivities = async (limit = 5): Promise<Activity[]> => {
  try {
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
      return getFallbackActivities();
    }

    const admin = JSON.parse(adminStr);
    
    const response = await axios.get(ENDPOINTS.DASHBOARD, {
      params: { 
        action: 'activities',
        limit 
      },
      headers: {
        'Authorization': `Bearer ${admin.sessionId}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    // Map API response to our Activity interface
    return response.data.map((activity: any) => ({
      icon: getActivityIcon(activity.type),
      title: activity.title,
      date: activity.date,
      details: activity.details
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return getFallbackActivities();
  }
};

// Update getActivityIcon function to handle new activity types
export const getActivityIcon = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'leave':
      return '📝';
    case 'attendance':
      return '📊';
    case 'payroll':
      return '💸';
    default:
      return '📋';
  }
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

// Update getFallbackStats
export const getFallbackStats = (): DashboardStats => {
  return {
    overview: {
      total_employees: "0",
      present_today: 0,
      on_time_today: "0",
      late_today: "0"
    },
    payroll: {
      processed_this_month: 0,
      total_payout: "0.00",
      pending_payrolls: 0
    },
    leaves: {
      pending_requests: []
    },
    activities: [],
    holidays: [],
    department_stats: []
  };
};

// Fallback data for recent activities
export const getFallbackActivities = (): Activity[] => {
  return [
    { icon: '📝', title: 'No Recent Activities', date: '', details: 'Check back later' }
  ];
}; 