import { useState, useEffect } from 'react';

// TODO: Replace with actual password hash
// Generate with: echo -n "your-password" | shasum -a 256
const PASSWORD_HASH = '6ac4acbf83605bd5786249a6c3f72c7cf2b3d7706e62a43c85955fe32603eb15';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const storedAuth = sessionStorage.getItem('juetzli-auth');
    if (storedAuth === PASSWORD_HASH) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (password) => {
    try {
      // Hash password using SHA-256
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex === PASSWORD_HASH) {
        sessionStorage.setItem('juetzli-auth', hashHex);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: 'Invalid password' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('juetzli-auth');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isLoading, login, logout };
};
