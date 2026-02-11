import { useState, useRef, useCallback } from 'react';

const TAP_THRESHOLD = 10;
const TAP_WINDOW_MS = 3000;

export default function useEasterEgg() {
  const [isActive, setIsActive] = useState(false);
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
        setIsActive(false);
      } else {
        // Activate — show popup first
        setShowPopup(true);
      }
    }
  }, [isActive]);

  const dismissPopup = useCallback(() => {
    setShowPopup(false);
    setIsActive(true);
  }, []);

  return { isActive, showPopup, handleTap, dismissPopup };
}
