/**
 * Download Limit Modal - Shows Swiss German error when limit reached
 */

import { useEffect } from 'react';

const DownloadLimitModal = ({ isOpen, onClose, maxTracks }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-modal max-w-sm w-full bg-sp-dark border border-sp-light-gray rounded-lg p-6 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-sp-text mb-3">
          Download-Limit erreicht
        </h3>
        <p className="text-sp-text-secondary mb-6">
          Sorry, dis Grät understitzt leider nur {maxTracks} Liäder, dü bisch scho am Maximum
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-sp-green text-sp-black font-semibold rounded-full hover:bg-sp-green/90 transition-colors"
        >
          Ok, verstande
        </button>
      </div>
    </div>
  );
};

export default DownloadLimitModal;
