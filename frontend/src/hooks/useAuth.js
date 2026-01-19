import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';

export const useAuth = (authType = 'private') => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `juetzlify-auth-${authType}`;

  useEffect(() => {
    // Check if user is already authenticated
    const storedAuth = sessionStorage.getItem(storageKey);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [storageKey]);

  const login = async (password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/${authType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem(storageKey, 'true');
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: data.error || 'Invalid password' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  };

  const logout = () => {
    sessionStorage.removeItem(storageKey);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isLoading, login, logout };
};
