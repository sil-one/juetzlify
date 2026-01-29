import React from 'react';

/**
 * Featured show overlay component
 * Displays a full-screen modal with featured show showcase
 * Dismissible by clicking X button or anywhere on the card
 */
const FeaturedShowOverlay = ({ show, onDismiss }) => {
  if (!show) return null;

  const handleBackgroundClick = (e) => {
    // Only dismiss if clicking the background or the card itself (not content within)
    if (e.target === e.currentTarget) {
      onDismiss();
    } else if (e.target.closest('.featured-show-card')) {
      onDismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-sp-black/95"
      onClick={handleBackgroundClick}
    >
      <div
        className="featured-show-card relative max-w-md w-full bg-sp-dark rounded-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        onClick={handleBackgroundClick}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 z-10 p-2 text-sp-text-secondary hover:text-sp-text transition-colors"
          title="Schließä"
          aria-label="Close showcase"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Show image - takes most of the space */}
        <div className="flex-1 min-h-64">
          <img
            src={`/featured-shows/${show.filename}`}
            alt={show.alt}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Footer text */}
        <div className="bg-sp-dark p-4 text-center">
          <p className="text-sp-text-secondary text-sm font-medium">
            Wärbig
          </p>
          <p className="text-xs text-sp-text-muted mt-1">
            Drick irgendwo anä zum wägtuä
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeaturedShowOverlay;
