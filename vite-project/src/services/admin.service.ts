import axios from 'axios';
import { ENDPOINTS } from '../config/api.config';

// Create axios instance with default config
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  bank_account: string;
  created_at: string;
}

export interface EmployeeFormData {
  id?: string;
  name: string;
  email: string;
  password?: string;
  department: string;
  designation: string;
  bank_account: string;
}

export const adminService = {
  getEmployees: async (): Promise<{ success: boolean; data: Employee[]; message?: string }> => {
    try {
      const response = await api.get(ENDPOINTS.EMPLOYEES);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEmployee: async (employeeId: string): Promise<{ success: boolean; data: Employee; message?: string }> => {
    try {
      const response = await api.get(`${ENDPOINTS.EMPLOYEES}?id=${employeeId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addEmployee: async (employeeData: EmployeeFormData): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post(ENDPOINTS.EMPLOYEES, employeeData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateEmployee: async (employeeData: EmployeeFormData): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.put(ENDPOINTS.EMPLOYEES, employeeData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteEmployee: async (employeeId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`${ENDPOINTS.EMPLOYEES}?id=${employeeId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getEmployeeById(id: string) {
    try {
      const adminData = localStorage.getItem('admin');
      if (!adminData) throw new Error('Admin session not found');
      
      const admin = JSON.parse(adminData);
      
      const response = await api.get(`${ENDPOINTS.EMPLOYEES}/${id}`, {
        headers: {
          'Authorization': `Bearer ${admin.sessionId}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }
}; 