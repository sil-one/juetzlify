import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateButton = () => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {location.pathname === '/private' && isAuthenticated && (
        <button
          onClick={logout}
          className="px-4 py-2 bg-sp-gray text-sp-text-secondary hover:text-sp-text rounded-full text-sm transition-all hover:bg-sp-light-gray"
        >
          Logout
        </button>
      )}
      <Link
        to="/private"
        className="px-5 py-2.5 bg-sp-dark hover:bg-sp-gray text-sp-text rounded-full text-sm font-medium transition-all flex items-center gap-2 border border-sp-light-gray hover:border-sp-green"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Jützlify Intern
      </Link>
    </div>
  );
};

export default PrivateButton;
