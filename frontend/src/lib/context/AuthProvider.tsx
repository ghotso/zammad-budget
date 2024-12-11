import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, logout as apiLogout, checkAuth } from '../api';
import { useSettings } from '../hooks/useSettings';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { settings } = useSettings();

  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('Checking authentication status...');
      const isAuthed = await checkAuth();
      console.log('Authentication check result:', isAuthed);
      
      setIsAuthenticated(isAuthed);
      
      if (!isAuthed && window.location.pathname !== '/login') {
        console.log('Not authenticated, redirecting to login');
        navigate('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      if (window.location.pathname !== '/login') {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let authCheckInterval: ReturnType<typeof setInterval>;
    
    const startAuthCheck = () => {
      console.log('Starting auth check interval');
      checkAuthStatus();
      // Check auth every minute multiplied by the session duration (default to 5 minutes)
      const interval = (settings?.sessionDuration || 5) * 60 * 1000;
      console.log(`Setting auth check interval to ${interval}ms`);
      authCheckInterval = setInterval(checkAuthStatus, interval);
    };

    startAuthCheck();

    return () => {
      if (authCheckInterval) {
        console.log('Clearing auth check interval');
        clearInterval(authCheckInterval);
      }
    };
  }, [checkAuthStatus, settings?.sessionDuration]);

  const login = async (password: string) => {
    try {
      console.log('Attempting login...');
      setIsLoading(true);
      await apiLogin(password);
      console.log('Login successful, verifying authentication');
      await checkAuthStatus();
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Attempting logout...');
      setIsLoading(true);
      await apiLogout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setIsLoading(false);
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}