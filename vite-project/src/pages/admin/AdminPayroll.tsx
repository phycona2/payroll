import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ENDPOINTS } from '../../config/api.config';
import { useAuth } from '../../contexts/AuthContext';
import SplineCoins from '../../components/Spline/SplineCoins';

interface PayrollRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  month: string;
  base_salary: number;
  overtime: number;
  deductions: number;
  net_salary: number;
  status: 'Pending' | 'Approved' | 'Failed';
  payment_date: string;
}

interface Employee {
  id: string;
  name: string;
}

const AdminPayroll: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/adminlogin');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPayrollData();
    }
  }, [selectedMonth, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
    }
  }, [isAdmin]);

  const calculateNetSalary = (base: number, overtime: number, deductions: number): number => {
    return base + overtime - deductions;
  };

  const fetchPayrollData = async () => {
    // Check authentication first
    const adminData = localStorage.getItem('admin');
    if (!adminData || !isAdmin) {
      setError('Unauthorized: Please log in as admin');
      setIsLoading(false);
      navigate('/adminlogin');
      return;
    }

    try {
      // Get admin data for potential token
      const admin = JSON.parse(adminData);
      
      const response = await axios.get(`${ENDPOINTS.PAYROLL}`, {
        withCredentials: true,
        params: { month: selectedMonth },
        headers: {
          'Authorization': `Bearer ${admin.sessionId}`, // Add session token if your API expects it
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.success) {
        // Filter out invalid records and transform the data
        const validatedRecords = response.data.data
          .filter((record: any) => {
            // Filter out records with null or invalid essential data
            return record 
              && record.id 
              && record.employee_id 
              && record.base_salary !== null 
              && record.overtime !== null 
              && record.deductions !== null;
          })
          .map((record: any) => ({
            id: Number(record.id),
            employee_id: Number(record.employee_id),
            employee_name: record.employee_name || `Employee ${record.employee_id}`,
            month: record.month || selectedMonth,
            base_salary: Number(record.base_salary) || 0,
            overtime: Number(record.overtime) || 0,
            deductions: Number(record.deductions) || 0,
            net_salary: Number(record.net_salary) || calculateNetSalary(
              Number(record.base_salary) || 0,
              Number(record.overtime) || 0,
              Number(record.deductions) || 0
            ),
            status: ['Pending', 'Approved', 'Failed'].includes(record.status) 
              ? record.status 
              : 'Pending',
            payment_date: record.payment_date || new Date().toISOString().split('T')[0]
          }));

        setPayrollRecords(validatedRecords);
        
        // If we filtered out any records, log a warning
        if (validatedRecords.length < response.data.data.length) {
          console.warn(`Filtered out ${response.data.data.length - validatedRecords.length} invalid payroll records`);
        }
      } else {
        setError(response.data.message || 'Failed to load payroll data');
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/adminlogin');
      } else {
        setError('Failed to load payroll data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const adminData = localStorage.getItem('admin');
      if (!adminData) throw new Error('Admin session not found');
      
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

  const filteredRecords = payrollRecords.filter(record =>
    record.employee_name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const getTotalPayroll = () => {
    return filteredRecords.reduce((sum, record) => sum + record.net_salary, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-500/10 text-green-400';
      case 'Pending':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'Failed':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const handleProcessPayroll = async () => {
    if (!confirm('Are you sure you want to approve all pending payments?')) {
      return;
    }

    setIsLoading(true);
    try {
      const adminData = localStorage.getItem('admin');
      if (!adminData) throw new Error('Admin session not found');
      
      const admin = JSON.parse(adminData);

      // Get all pending records
      const pendingRecords = payrollRecords.filter(record => record.status === 'Pending');

      if (pendingRecords.length === 0) {
        alert('No pending payments to approve');
        return;
      }

      // Update each pending record to Approved status with simplified payload
      for (const record of pendingRecords) {
        await axios.put(
          ENDPOINTS.PAYROLL,
          {
            id: record.id,
            status: 'Approved'
          },
          {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${admin.sessionId}`,
              'Content-Type': 'application/json',
            }
          }
        );
      }

      await fetchPayrollData();
      alert('All pending payments have been approved!');
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve payments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const adminData = localStorage.getItem('admin');
      if (!adminData) throw new Error('Admin session not found');
      
      const admin = JSON.parse(adminData);
      
      // Simplified payload to match backend expectations
      const response = await axios.put(
        ENDPOINTS.PAYROLL,
        {
          id,
          status: newStatus
        },
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${admin.sessionId}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        await fetchPayrollData();
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update status. Please try again.');
    }
  };

  const handleAddPayment = async () => {
    setIsFormOpen(true);
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const paymentData = {
      employee_id: Number(formData.get('employee_id')),
      month: selectedMonth,
      base_salary: Number(formData.get('base_salary')),
      overtime: Number(formData.get('overtime')),
      deductions: Number(formData.get('deductions'))
    };

    try {
      const adminData = localStorage.getItem('admin');
      if (!adminData) throw new Error('Admin session not found');
      
      const admin = JSON.parse(adminData);
      
      const response = await axios.post(
        ENDPOINTS.PAYROLL,
        paymentData,
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${admin.sessionId}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        setIsFormOpen(false);
        await fetchPayrollData();
        alert('Payment added successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to add payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert(error instanceof Error ? error.message : 'Failed to add payment. Please try again.');
    }
  };

  const handleDeletePayroll = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) {
      return;
    }

    try {
      const adminData = localStorage.getItem('admin');
      if (!adminData) throw new Error('Admin session not found');
      
      const admin = JSON.parse(adminData);
      
      const response = await axios.delete(`${ENDPOINTS.PAYROLL}?id=${id}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${admin.sessionId}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        await fetchPayrollData();
        alert('Payroll record deleted successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to delete payroll record');
      }
    } catch (error) {
      console.error('Error deleting payroll record:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete payroll record. Please try again.');
    }
  };

  return (
    authLoading ? (
      <div className="w-full min-h-[calc(100vh-12rem)] p-6 flex items-center justify-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full"></div>
      </div>
    ) : (
      <div className="w-full min-h-screen relative">
        {/* Background with Spline */}
        <div className="fixed inset-0 w-full h-full z-0">
          <SplineCoins />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full min-h-[calc(100vh-12rem)] p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
              bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Payroll Management
            </h1>
            <p className="text-gray-400">Process and manage employee payroll</p>
          </div>

          {/* Payroll Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Total Payroll</h3>
                <span className="text-3xl">💰</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ${getTotalPayroll().toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Current month total</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Employees</h3>
                <span className="text-3xl">👥</span>
              </div>
              <p className="text-2xl font-bold text-white">{filteredRecords.length}</p>
              <p className="text-sm text-gray-400">Active payroll records</p>
            </div>

            <div className="bg-gradient-to-br from-green-600/10 to-green-800/10 backdrop-blur-md 
              border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Status</h3>
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {payrollRecords.filter(r => r.status === 'Approved').length}
              </p>
              <p className="text-sm text-gray-400">Approved payments</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
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
            <div className="flex gap-4">
              <button
                onClick={handleAddPayment}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-500 
                  transition-all duration-200 flex items-center gap-2 disabled:opacity-50
                  disabled:cursor-not-allowed"
              >
                <span>➕</span> Add Payment
              </button>
              <button
                onClick={handleProcessPayroll}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 
                  transition-all duration-200 flex items-center gap-2 disabled:opacity-50
                  disabled:cursor-not-allowed"
              >
                <span>💸</span> Process Payroll
              </button>
            </div>
          </div>

          {/* Add Payment Form */}
          {isFormOpen && (
            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Add New Payment</h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddPaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Employee
                    </label>
                    <select
                      name="employee_id"
                      required
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                        transition-all duration-200 text-white"
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
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Base Salary
                    </label>
                    <input
                      type="number"
                      name="base_salary"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                        transition-all duration-200 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Overtime
                    </label>
                    <input
                      type="number"
                      name="overtime"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                        transition-all duration-200 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Deductions
                    </label>
                    <input
                      type="number"
                      name="deductions"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                        transition-all duration-200 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 
                      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payroll Table */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full"></div>
                <p className="text-gray-400 mt-2">Loading payroll data...</p>
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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Base Salary</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Overtime</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Deductions</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Net Salary</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                              <span className="text-blue-400">
                                {record.employee_name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-white">{record.employee_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          ${record.base_salary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          ${record.overtime.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          ${record.deductions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-white font-medium">
                          ${record.net_salary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                            {record.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(record.id, 'Approved')}
                                  className="text-xs bg-blue-500/10 text-blue-400 hover:text-blue-300 px-2 py-1 rounded-full transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleDeletePayroll(record.id)}
                                  className="text-xs bg-red-500/10 text-red-400 hover:text-red-300 px-2 py-1 rounded-full transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {new Date(record.payment_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default AdminPayroll;
