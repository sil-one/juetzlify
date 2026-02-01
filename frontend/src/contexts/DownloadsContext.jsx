/**
 * Downloads Context - Provides download state and operations across app
 */

import React, { createContext, useContext } from 'react';
import { useDownloads as useDownloadsHook } from '../hooks/useDownloads';
import DownloadLimitModal from '../components/DownloadLimitModal';

const DownloadsContext = createContext(null);

export const DownloadsProvider = ({ children }) => {
  const downloadsState = useDownloadsHook();

  return (
    <DownloadsContext.Provider value={downloadsState}>
      {children}
      <DownloadLimitModal
        isOpen={downloadsState.showLimitModal}
        onClose={() => downloadsState.setShowLimitModal(false)}
        maxTracks={downloadsState.maxDownloads}
      />
    </DownloadsContext.Provider>
  );
};

export const useDownloads = () => {
  const context = useContext(DownloadsContext);
  if (!context) {
    throw new Error('useDownloads must be used within DownloadsProvider');
  }
  return context;
};
