import React, { useState } from 'react';

const PasswordPrompt = ({ onSubmit, error }) => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(password);
    setIsSubmitting(false);
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-sp-black">
      <div className="max-w-md w-full bg-sp-dark p-8 rounded-xl shadow-2xl shadow-black/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sp-gray flex items-center justify-center">
            <svg className="w-8 h-8 text-sp-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-sp-text">Jützlify Interni Liäder</h2>
          <p className="text-sp-text-secondary">Bisch ä Jützlifyp? Wenn nei verreis!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-sp-gray border border-sp-light-gray rounded-full text-sp-text placeholder-sp-text-muted focus:outline-none focus:border-sp-green focus:ring-1 focus:ring-sp-green transition-all"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full py-3 bg-sp-green hover:bg-sp-green-bright text-black font-bold rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sp-green"
          >
            {isSubmitting ? 'Verifying...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordPrompt;
