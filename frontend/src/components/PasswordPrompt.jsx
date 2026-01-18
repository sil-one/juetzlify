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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl ring-4 ring-juetzli-yellow">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-juetzli-yellow">🔒 Jützli Interni Liäder</h2>
          <p className="text-gray-300">Bisch ä Jützli? Wenn nei verreis!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-700 border-2 border-juetzli-yellow rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-juetzli-red transition-all"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="bg-red-900/70 border-2 border-red-500 text-white px-4 py-3 rounded-lg font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full player-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying...' : '🎉 Enter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordPrompt;
