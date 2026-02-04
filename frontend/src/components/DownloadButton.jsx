/**
 * Download Button Component - Manages track download UI
 */

import { useState, useEffect } from 'react';
import { useDownloads } from '../contexts/DownloadsContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const DownloadButton = ({ trackId, track, size = 'small', className = '', showLabel = false }) => {
  const { getDownloadState, getDownloadProgress, downloadTrack, removeDownload } = useDownloads();
  const isOnline = useOnlineStatus();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const state = getDownloadState(trackId);
  const progress = getDownloadProgress(trackId);

  // Auto-cancel delete confirmation after 3 seconds
  useEffect(() => {
    if (showDeleteConfirm) {
      const timer = setTimeout(() => setShowDeleteConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDeleteConfirm]);

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent track from playing

    if (state === 'downloaded' && !showDeleteConfirm) {
      // First click: Show delete confirmation
      setShowDeleteConfirm(true);
    } else if (state === 'downloaded' && showDeleteConfirm) {
      // Second click: Delete
      removeDownload(trackId);
      setShowDeleteConfirm(false);
    } else if (state === 'not_downloaded' && isOnline) {
      // Download
      downloadTrack(track);
    } else if (state === 'failed') {
      // Retry
      downloadTrack(track);
    }
  };

  const iconSize = size === 'small' ? 20 : 24;
  const buttonSize = size === 'small' ? 'w-8 h-8' : 'w-10 h-10';

  // Render different icons based on state
  const renderIcon = () => {
    if (state === 'downloading') {
      // Circular progress indicator
      const circumference = 2 * Math.PI * 8;
      const offset = circumference - progress * circumference;

      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20">
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-sp-light-gray"
          />
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-sp-green transition-all duration-300"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
      );
    }

    if (state === 'downloaded' && showDeleteConfirm) {
      // Red trash icon
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
          <path
            d="M6 7v8a1 1 0 001 1h6a1 1 0 001-1V7M4 7h12M8 4h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          />
        </svg>
      );
    }

    if (state === 'downloaded') {
      // Green checkmark
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
          <path
            d="M16 6L7.5 14.5L4 11"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-sp-green"
          />
        </svg>
      );
    }

    if (state === 'failed') {
      // Red exclamation
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" className="text-red-500" />
          <path
            d="M10 6v4M10 13v1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-red-500"
          />
        </svg>
      );
    }

    // Not downloaded - download arrow
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
        <path
          d="M10 3v10m0 0l-4-4m4 4l4-4M4 17h12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-sp-text-muted group-hover:text-sp-text transition-colors"
        />
      </svg>
    );
  };

  const getTitle = () => {
    if (!isOnline && state === 'not_downloaded') {
      return 'Bisch offline, chasch nid abbäladä';
    }
    if (state === 'downloading') {
      return `Abbäladä... ${Math.round(progress * 100)}%`;
    }
    if (state === 'downloaded' && showDeleteConfirm) {
      return 'Numal drickä zum leschä';
    }
    if (state === 'downloaded') {
      return 'Abbäladä - drickä zum leschä';
    }
    if (state === 'failed') {
      return 'Fähler - probiär numal';
    }
    return 'Abbäladä für offline';
  };

  const isDisabled = (!isOnline && state === 'not_downloaded') || state === 'downloading';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        title={getTitle()}
        className={`
          ${buttonSize}
          flex items-center justify-center
          rounded-full
          transition-all duration-200
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sp-light-gray cursor-pointer'}
          ${state === 'downloaded' && showDeleteConfirm ? 'bg-red-500/20' : ''}
          group
        `}
      >
        {renderIcon()}
      </button>
      {showLabel && (
        <span className="text-xs text-sp-text-muted">
          {state === 'downloaded' ? 'Offline verfiägbar' : 'Offline verfiägbar machä'}
        </span>
      )}
    </div>
  );
};

export default DownloadButton;
