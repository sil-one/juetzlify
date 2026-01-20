import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';

/**
 * Decode JWT payload without verification (frontend only decoding)
 * Returns the decoded payload or null if invalid
 */
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(token) {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }
  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}

export const useAuth = (authType = 'private') => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const storageKey = `juetzlify-token`;

  useEffect(() => {
    // Check if user has a valid token
    const token = localStorage.getItem(storageKey);

    if (token && !isTokenExpired(token)) {
      const payload = decodeJWT(token);
      if (payload && payload.role) {
        setUserRole(payload.role);

        // Admin users have access to both admin and private
        // Private users only have access to private
        if (authType === 'admin' && payload.role === 'admin') {
          setIsAuthenticated(true);
        } else if (authType === 'private' && (payload.role === 'admin' || payload.role === 'private')) {
          setIsAuthenticated(true);
        }
      }
    } else if (token) {
      // Token exists but is expired - clean it up
      localStorage.removeItem(storageKey);
    }

    setIsLoading(false);
  }, [authType, storageKey]);

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

      if (data.success && data.token) {
        // Store the JWT token in localStorage
        localStorage.setItem(storageKey, data.token);
        setUserRole(data.role);
        setIsAuthenticated(true);
        return { success: true, role: data.role };
      }

      return { success: false, error: data.error || 'Invalid password' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem(storageKey);
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return { isAuthenticated, isLoading, login, logout, userRole };
};
