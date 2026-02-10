import { useState, useRef, useCallback } from 'react';

const STORAGE_KEY = 'juetzlify-easter-egg';
const TAP_THRESHOLD = 10;
const TAP_WINDOW_MS = 3000;

export default function useEasterEgg() {
  const [isActive, setIsActive] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );
  const [showPopup, setShowPopup] = useState(false);

  const tapCount = useRef(0);
  const lastTapTime = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current > TAP_WINDOW_MS) {
      tapCount.current = 0;
    }
    lastTapTime.current = now;
    tapCount.current += 1;

    if (tapCount.current >= TAP_THRESHOLD) {
      tapCount.current = 0;
      if (isActive) {
        // Deactivate
        setIsActive(false);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        // Activate — show popup first
        setShowPopup(true);
      }
    }
  }, [isActive]);

  const dismissPopup = useCallback(() => {
    setShowPopup(false);
    setIsActive(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  return { isActive, showPopup, handleTap, dismissPopup };
}
