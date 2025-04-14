import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, isLoading, setIsAdmin } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdminValid, setIsAdminValid] = useState(false);
  
  useEffect(() => {
    const checkAdmin = () => {
      try {
        const adminStr = localStorage.getItem('admin');
        if (!adminStr) {
          console.log('No admin data found in localStorage');
          setIsAdminValid(false);
          setIsAdmin(false);
          return;
        }
        
        // Parse admin data to verify it's valid JSON
        try {
          const admin = JSON.parse(adminStr);
          if (!admin || !admin.id) {
            // Invalid admin data
            console.log('Invalid admin data in localStorage:', admin);
            localStorage.removeItem('admin');
            setIsAdminValid(false);
            setIsAdmin(false);
            return;
          }
          
          console.log('Valid admin data found:', admin.email || admin.username);
          setIsAdminValid(true);
          setIsAdmin(true);
        } catch (parseError) {
          console.error('Error parsing admin JSON:', parseError);
          localStorage.removeItem('admin');
          setIsAdminValid(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        localStorage.removeItem('admin');
        setIsAdminValid(false);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAdmin();
  }, [setIsAdmin]);
  
  // Show loading state while checking
  if (isLoading || isChecking) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!isAdminValid) {
    console.log('Not authorized as admin, redirecting to login');
    return <Navigate to="/adminlogin" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute; 