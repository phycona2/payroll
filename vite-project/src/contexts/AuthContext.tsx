import React, { createContext, useContext, useState, useEffect } from 'react';
import { queryClient } from '../services/queryClient';

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  adminLogout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount and after any localStorage changes
    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      const adminStr = localStorage.getItem('admin');
      
      if (adminStr) {
        setIsAdmin(true);
        setIsAuthenticated(true);
      } else if (userStr) {
        setIsAdmin(false);
        setIsAuthenticated(true);
      } else {
        setIsAdmin(false);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
    setIsAuthenticated(false);
    setIsAdmin(false);
    
    // Clear all query cache on logout
    queryClient.clear();
  };

  const adminLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('sessionId');
    setIsAdmin(false);
    setIsAuthenticated(false);
    
    // Clear all query cache on logout
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      setIsAuthenticated, 
      logout,
      isAdmin,
      setIsAdmin,
      adminLogout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 