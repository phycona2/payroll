import './App.css'
import GlassTabBar from './components/GlassTabBar'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Settings from './pages/Settings'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRoute from './components/AdminRoute'
import AdminEmployees from './pages/admin/AdminEmployees'
import AdminPayroll from './pages/admin/AdminPayroll'
import AdminLeavesHolidays from './pages/admin/AdminLeavesHolidays'
import AddEditEmployee from './pages/admin/AddEditEmployee'
import AdminAttendance from './pages/admin/AdminAttendance'
import Attendance from './pages/Attendance'
import Leaves from './pages/Leaves'
import { useEffect } from 'react'
import Loading from './components/Loading/Loading'

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Move the authentication logic into a child component
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Create a new component for the main app content
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check authentication status and redirect accordingly
    const adminStr = localStorage.getItem('admin');
    const userStr = localStorage.getItem('user');
    const currentPath = location.pathname;

    // Define protected routes
    const adminRoutes = ['/admin/dashboard', '/admin/employees', '/admin/payroll', '/admin/leaves', '/admin/attendance'];
    const employeeRoutes = ['/home', '/settings', '/attendance', '/leaves'];
    const publicRoutes = ['/', '/login', '/register', '/adminlogin'];

    if (!adminStr && !userStr) {
      // Not authenticated
      if (!publicRoutes.includes(currentPath)) {
        navigate('/');
      }
    } else if (adminStr) {
      // Admin is logged in
      if (!adminRoutes.includes(currentPath)) {
        navigate('/admin/dashboard');
      }
    } else if (userStr) {
      // Employee is logged in
      if (!employeeRoutes.includes(currentPath)) {
        navigate('/home');
      }
    }
  }, [navigate, location.pathname]);

  const handleTabChange = (tab: string) => {
    switch (tab) {
      // Public routes
      case 'welcome':
        navigate('/');
        break;
      case 'login':
        navigate('/login');
        break;
      case 'register':
        navigate('/register');
        break;
      case 'adminlogin':
        navigate('/adminlogin');
        break;
      
      // Employee routes
      case 'home':
        navigate('/home');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'attendance':
        navigate('/attendance');
        break;
      case 'leaves':
        navigate('/leaves');
        break;
      
      // Admin routes
      case 'admin/dashboard':
        navigate('/admin/dashboard');
        break;
      case 'admin/employees':
        navigate('/admin/employees');
        break;
      case 'admin/payroll':
        navigate('/admin/payroll');
        break;
      case 'admin/leaves':
        navigate('/admin/leaves');
        break;
      case 'admin/attendance':
        navigate('/admin/attendance');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <GlassTabBar 
        activeTab={
          location.pathname === '/' 
            ? 'welcome' 
            : location.pathname.slice(1)
        } 
        onTabChange={handleTabChange} 
      />
      <main className="flex-1 w-full p-4">
        <div className="container mx-auto bg-black rounded-lg shadow-xl p-6">
          <Routes>
            <Route path="/" element={<Welcome onTabChange={handleTabChange} />} />
            <Route path="/login" element={<Login onTabChange={handleTabChange} />} />
            <Route path="/register" element={<Register onTabChange={handleTabChange} />} />
            <Route 
              path="/home" 
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <PrivateRoute>
                  <Attendance />
                </PrivateRoute>
              } 
            />
            <Route path="/adminlogin" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/employees" 
              element={
                <AdminRoute>
                  <AdminEmployees />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/payroll" 
              element={
                <AdminRoute>
                  <AdminPayroll />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/leaves" 
              element={
                <AdminRoute>
                  <AdminLeavesHolidays />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/employees/add" 
              element={
                <AdminRoute>
                  <AddEditEmployee />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/employees/edit/:id" 
              element={
                <AdminRoute>
                  <AddEditEmployee />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/attendance" 
              element={
                <AdminRoute>
                  <AdminAttendance />
                </AdminRoute>
              } 
            />
            <Route 
              path="/leaves" 
              element={
                <PrivateRoute>
                  <Leaves />
                </PrivateRoute>
              } 
            />
            <Route path="/loading" element={<Loading />} />
            {/* Catch-all route for 404 */}
            <Route path="*" element={<div className="text-white text-center py-10">
              <h2 className="text-3xl mb-4">Page Not Found</h2>
              <p className="mb-6">The page you're looking for doesn't exist or has been moved.</p>
              <button 
                onClick={() => navigate('/')} 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              >
                Go Home
              </button>
            </div>} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
 