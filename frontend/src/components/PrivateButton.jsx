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
          className="px-3 py-2 bg-gray-800 text-gray-400 hover:text-juetzlify-yellow rounded-lg text-sm transition-colors"
        >
          Logout
        </button>
      )}
      <Link
        to="/private"
        className="px-4 py-2 bg-black text-juetzlify-yellow hover:bg-gray-900 rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg"
      >
        🔒 Jützlify Intern
      </Link>
    </div>
  );
};

export default PrivateButton;
