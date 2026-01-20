import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateButton = () => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex items-center justify-center gap-4 text-xs text-sp-text-muted">
      {location.pathname === '/private' && isAuthenticated && (
        <button
          onClick={logout}
          className="hover:text-sp-text transition-all"
        >
          Logout
        </button>
      )}
      <Link
        to="/private"
        className="hover:text-sp-text transition-all flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Intern
      </Link>
    </div>
  );
};

export default PrivateButton;
