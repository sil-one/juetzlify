import React from 'react';
import InstallButton from './InstallButton';

const CopyrightFooter = () => {
  return (
    <div className="w-full py-8 text-center space-y-3">
      <div className="flex justify-center">
        <InstallButton />
      </div>
      <p className="text-sp-text-muted text-xs sm:text-sm opacity-60">
        © Jützlitypen 2026
      </p>
    </div>
  );
};

export default CopyrightFooter;
