import { useState, useEffect, useRef, useCallback } from 'react';

const STIFFNESS = 0.08;
const DAMPING = 0.75;

export default function useAccelerometer(enabled) {
  const [gravityX, setGravityX] = useState(0);
  const targetGravityX = useRef(0);
  const currentGravityX = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef(null);
  const permissionGranted = useRef(false);
  const hasMotion = useRef(false); // true once a real devicemotion event arrives

  const requestPermission = useCallback(async () => {
    // iOS 13+ requires explicit permission for both event types
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        const result = await DeviceMotionEvent.requestPermission();
        permissionGranted.current = result === 'granted';
        return permissionGranted.current;
      } catch {
        return false;
      }
    }
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        permissionGranted.current = result === 'granted';
        return permissionGranted.current;
      } catch {
        return false;
      }
    }
    // Android / desktop — no permission needed
    permissionGranted.current = true;
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Primary: devicemotion — real gravity vector, handles all orientations incl. upside-down
    const handleMotion = (e) => {
      const ag = e.accelerationIncludingGravity;
      if (!ag || ag.x == null) return;
      // Only trust devicemotion if we detect real gravity (~9.81 m/s²).
      // Chrome DevTools fires devicemotion with zeros, which would block
      // the deviceorientation fallback.
      const mag = Math.sqrt(ag.x ** 2 + (ag.y ?? 0) ** 2 + (ag.z ?? 0) ** 2);
      if (mag < 5) return;
      hasMotion.current = true;
      // ag.x > 0 when right side tilts down → water flows right
      targetGravityX.current = Math.max(-1, Math.min(1, ag.x / 9.81));
    };

    // Fallback: deviceorientation — for Chrome DevTools sensor simulation
    const handleOrientation = (e) => {
      if (hasMotion.current) return; // prefer devicemotion when available
      if (e.gamma == null) return;
      // sin(gamma) ≈ gravity fraction along X for typical phone orientations
      const gammaRad = (e.gamma * Math.PI) / 180;
      targetGravityX.current = Math.max(-1, Math.min(1, Math.sin(gammaRad)));
    };

    const animate = () => {
      velocity.current +=
        (targetGravityX.current - currentGravityX.current) * STIFFNESS;
      velocity.current *= DAMPING;
      currentGravityX.current += velocity.current;

      const rounded = Math.round(currentGravityX.current * 1000) / 1000;
      setGravityX(rounded);

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('devicemotion', handleMotion);
    window.addEventListener('deviceorientation', handleOrientation);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('deviceorientation', handleOrientation);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [enabled]);

  return { gravityX, requestPermission };
}
