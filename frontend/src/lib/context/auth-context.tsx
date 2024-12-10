import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, logout as apiLogout } from '../api';
import { useSettings } from '../hooks/useSettings';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: async () => {
    throw new Error('AuthContext not initialized');
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { settings } = useSettings();

  const checkAuth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/organizations`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        setIsAuthenticated(false);
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
        return;
      }
      
      const isAuthed = response.ok;
      setIsAuthenticated(isAuthed);
      
      if (!isAuthed && window.location.pathname !== '/login') {
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
    let authCheckInterval: ReturnType<typeof setTimeout>;
    
    const startAuthCheck = () => {
      checkAuth();
      // Check auth every minute multiplied by the session duration (default to 5 minutes)
      const interval = (settings?.sessionDuration || 5) * 60 * 1000;
      authCheckInterval = setInterval(checkAuth, interval);
    };

    startAuthCheck();

    return () => {
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
      }
    };
  }, [checkAuth, settings?.sessionDuration]);

  const login = async (password: string) => {
    try {
      setIsLoading(true);
      await apiLogin(password);
      await checkAuth(); // Verify authentication after login
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
      setIsLoading(true);
      await apiLogout();
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

  return (
    <AuthContext.Provider 
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}