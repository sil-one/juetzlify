import { useState, useEffect, useRef, useCallback } from 'react';

// Spring physics tuned for water-like inertia:
// moderate stiffness for responsive tilt, high damping retention for sloshy overshoot
const STIFFNESS = 0.06;
const DAMPING = 0.94;

export default function useAccelerometer(enabled) {
  const [gravityX, setGravityX] = useState(0);
  const targetGravityX = useRef(0);
  const currentGravityX = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef(null);
  const permissionGranted = useRef(false);
  const hasOrientation = useRef(false);

  const requestPermission = useCallback(async () => {
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
    // Android / desktop — no permission needed
    permissionGranted.current = true;
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Primary: deviceorientation — gamma is in device coords so it naturally
    // handles all orientations including upside-down. Also works with
    // Chrome DevTools sensor simulation.
    const handleOrientation = (e) => {
      if (e.gamma == null) return;
      hasOrientation.current = true;
      const gammaRad = (e.gamma * Math.PI) / 180;
      targetGravityX.current = Math.max(-1, Math.min(1, Math.sin(gammaRad)));
    };

    // Fallback: devicemotion — for devices that don't fire deviceorientation
    const handleMotion = (e) => {
      if (hasOrientation.current) return;
      const ag = e.accelerationIncludingGravity;
      if (!ag || ag.x == null) return;
      const mag = Math.sqrt(ag.x ** 2 + (ag.y ?? 0) ** 2 + (ag.z ?? 0) ** 2);
      if (mag < 5) return;
      targetGravityX.current = Math.max(-1, Math.min(1, -ag.x / 9.81));
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

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [enabled]);

  return { gravityX, requestPermission };
}
