import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ENDPOINTS } from '../../config/api.config';
import SplineLiq from '../../components/Spline/SplineLiq';  
import { adminService, Employee } from '../../services/admin.service';
import SplineLight from '../../components/Spline/SplineLight';

const AdminEmployees: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      console.log('Fetching employees...');
      const response = await adminService.getEmployees();
      console.log('API Response:', response);
      
      if (response.success) {
        setEmployees(response.data || []);
        console.log('Employees set:', response.data);
      } else {
        setError('Failed to fetch employees: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      if (axios.isAxiosError(error)) {
        setError(`Failed to load employees: ${error.response?.data?.message || error.message}`);
      } else {
        setError('Failed to load employees: Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Current employees state:', employees);
  }, [employees]);

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      const response = await adminService.deleteEmployee(employeeId);
      if (response.success) {
        // Refresh the employee list
        fetchEmployees();
      } else {
        alert(response.message || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  };

  const handleDeleteClick = (employeeId: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      handleDeleteEmployee(employeeId);
    }
  };

  return (
    <div className="w-full min-h-screen relative">
      {/* Spline Background */}
      <div className="fixed inset-0 w-full h-full z-0 bg-black">
        <SplineLiq />
      </div>

      {/* Content - now with relative positioning and z-index */}
      <div className="relative z-10 w-full min-h-[calc(100vh-12rem)] p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 
            bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Employee Management
          </h1>
          <p className="text-gray-400">Manage and view all employees in your organization</p>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                transition-all duration-200 text-white placeholder-gray-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          <button
            onClick={() => navigate('/admin/employees/add')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 
              transition-all duration-200 flex items-center gap-2"
          >
            <span>➕</span> Add Employee
          </button>
        </div>

        {/* Employees List */}
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full"></div>
              <p className="text-gray-400 mt-2">Loading employees...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Department</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Designation</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Joined Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                            <span className="text-blue-400">{employee.name.charAt(0)}</span>
                          </div>
                          <span className="text-white">{employee.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{employee.email}</td>
                      <td className="px-6 py-4 text-gray-300">{employee.department || '-'}</td>
                      <td className="px-6 py-4 text-gray-300">{employee.designation || '-'}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(employee.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteClick(employee.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEmployees; 