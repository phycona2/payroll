const API_BASE_URL = 'http://localhost/payroll_system/api';

export const ENDPOINTS = {
  // Authentication endpoints
  REGISTER: `${API_BASE_URL}/register.php`,
  LOGIN: `${API_BASE_URL}/login.php`,
  
  AUTH_CHECK: `${API_BASE_URL}/auth.php`,
  LOGOUT: `${API_BASE_URL}/logout.php`,

  // Employee management endpoints
  EMPLOYEES: `${API_BASE_URL}/employees.php`,
  EMPLOYEE_DETAILS: `${API_BASE_URL}/home.php`,
  UPDATE_USER_PROFILE: `${API_BASE_URL}/update_user.php`,
  DELETE_USER: `${API_BASE_URL}/delete_user.php`,

  // Admin management endpoints
  ADMIN_USERS: `${API_BASE_URL}/admin_users.php`,
  ADMIN_LOGIN: `${API_BASE_URL}/admin_login.php`,
  
  // Dashboard endpoint
  DASHBOARD: `${API_BASE_URL}/admin_dashboard.php`,

  // Attendance management endpoints
  ATTENDANCE: `${API_BASE_URL}/attendance.php`,
  EMPLOYEE_ATTENDANCE: `${API_BASE_URL}/employee_attendance.php`,

  // Leave management endpoints
  LEAVES: `${API_BASE_URL}/leaves.php`,

  // Payroll management endpoints
  PAYROLL: `${API_BASE_URL}/payroll.php`,

  // Holiday management endpoints
  HOLIDAYS: `${API_BASE_URL}/holidays.php`,
}; 