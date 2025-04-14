import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService, EmployeeFormData } from '../../services/admin.service';
import SplineLight from '../../components/Spline/SplineLight';
import { useAuth } from '../../contexts/AuthContext';

const AddEditEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    password: '',
    department: '',
    designation: '',
    bank_account: ''
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/adminlogin');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  const fetchEmployeeData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const response = await adminService.getEmployeeById(id);
      if (response.success && response.data) {
        const { password, ...employeeData } = response.data;
        setFormData(employeeData);
      } else {
        setError('Failed to fetch employee data');
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      setError('Failed to fetch employee data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = id
        ? await adminService.updateEmployee(id, formData)
        : await adminService.createEmployee(formData);

      if (response.success) {
        navigate('/admin/employees');
      } else {
        setError(response.message || 'Failed to save employee');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      setError('Failed to save employee');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            {id ? 'Edit Employee' : 'Add New Employee'}
          </h1>
          <p className="text-gray-400">
            {id ? 'Update employee information' : 'Create a new employee account'}
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                      focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                      transition-all duration-200 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                      focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                      transition-all duration-200 text-white"
                  />
                </div>

                {!id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!id}
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                        transition-all duration-200 text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                      focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                      transition-all duration-200 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                      focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                      transition-all duration-200 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bank Account
                  </label>
                  <input
                    type="text"
                    name="bank_account"
                    value={formData.bank_account}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl 
                      focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                      transition-all duration-200 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/admin/employees')}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : id ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditEmployee; 