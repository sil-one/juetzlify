import React, { useState, useEffect } from 'react';

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSTooltip, setShowIOSTooltip] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if already installed (standalone mode)
    const installed = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    setIsInstalled(installed);

    // Listen for beforeinstallprompt (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show tooltip with manual instructions
      setShowIOSTooltip(!showIOSTooltip);
    } else if (deferredPrompt) {
      // Trigger install prompt (Android/Chrome)
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    }
  };

  // Don't show button if already installed
  if (isInstalled) {
    return null;
  }

  // Only show on iOS or if beforeinstallprompt is available
  if (!isIOS && !deferredPrompt) {
    return null;
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleInstallClick}
        className="text-sp-text-muted hover:text-sp-green text-xs sm:text-sm opacity-60 hover:opacity-100 transition-all inline-flex items-center gap-1.5"
        aria-label="App installiere"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Installiärä</span>
      </button>

      {/* iOS Tooltip */}
      {showIOSTooltip && isIOS && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 sm:w-80">
          <div className="bg-sp-gray border border-sp-light-gray rounded-lg shadow-lg p-4">
            <div className="text-sp-text text-xs sm:text-sm space-y-2">
              <p className="font-medium text-sp-green mb-2">So installiärsch d'App:</p>
              <ol className="space-y-1.5 list-decimal list-inside text-sp-text-secondary">
                <li>Drick üfs Teilä-Symbol (z'Quadrad mim Pfiili) unnä am Bildschirm</li>
                <li>Scroll abbä und drick üf "Zum Home-Bildschirm"</li>
                <li>Drick üf "Hinzuäfiägä" zum bestätigä</li>
              </ol>
            </div>
            {/* Arrow pointer */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-sp-gray"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallButton;
