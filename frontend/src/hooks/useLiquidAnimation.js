import { useState, useEffect, useRef } from 'react';

// Spring physics — controls how fast the base water level rises
const SPRING_STIFFNESS = 0.1;
const SPRING_DAMPING = 0.82;
const SPRING_THRESHOLD = 0.3;

// Standing-wave sloshing modes (natural modes of a rectangular container)
// Mode n: cos(n * π * x) — at t=0, mode 1 has water piled on left (cos(0)=1) and low on right (cos(π)=−1)
const WAVE_MODES = [
  { n: 1, amplitude: 0.35, freq: 7.0 },   // fundamental: left-right slosh
  { n: 2, amplitude: 0.15, freq: 11.0 },   // 2nd harmonic: adds mid-bar texture
];
const WAVE_DECAY = 1.8;           // exponential damping rate (e^-1.8t)
const WAVE_SETTLE = 0.02;         // waves done when amplitude factor < 2%

// Number of points along the water surface polygon
const SURFACE_POINTS = 20;

// Maximum slope of water surface at full tilt (|gravityX| = 1).
// Large enough that water fully pools on one side at most progress levels.
const MAX_SLOPE = 600;

/**
 * Compute the y-offset for a clamped linear water surface that preserves area.
 *
 * The surface is: h(x) = offset + slope*(x - 0.5), clamped to [0, 100].
 * We solve for offset such that the integral over x=[0,1] equals `level`.
 *
 * Three regimes depending on how steep the slope is:
 *   1. No clamping:     slope is gentle, line stays within [0, 100]
 *   2. Single clamping: line dips below 0 (or above 100) on one side
 *   3. Both clamping:   line exceeds both bounds — water pools on one side
 */
function areaPreservingOffset(absSlope, level) {
  if (absSlope < 0.01) return level;

  const minSide = Math.min(level, 100 - level);

  // Case 1: no clamping needed
  if (absSlope <= 2 * minSide) return level;

  // Case 3: both bounds exceeded — steep slope
  if (absSlope * minSide >= 5000) {
    return 50 + (level - 50) * absSlope / 100;
  }

  // Case 2: single-side clamping
  if (level <= 50) {
    // Bottom clamping (low fill, water piles on gravity side)
    return -absSlope / 2 + Math.sqrt(2 * absSlope * level);
  }
  // Top clamping (high fill, empty pocket on anti-gravity side)
  return 100 + absSlope / 2 - Math.sqrt(2 * absSlope * (100 - level));
}

/**
 * Build a CSS polygon clipPath for the water surface.
 *
 * @param {number} level       - base water level 0–100 (% of bar height)
 * @param {number|null} elapsed - seconds since activation (null = no waves)
 * @param {number} gravityX    - gravity along bar axis, -1 (left) to +1 (right)
 * @param {number} targetLevel - target water level (for wave amplitude scaling)
 */
function buildClipPath(level, elapsed, gravityX, targetLevel) {
  const absSlope = Math.abs(gravityX) * MAX_SLOPE;
  const offset = areaPreservingOffset(absSlope, level);
  const sign = Math.sign(gravityX) || 1;

  const points = [];

  for (let i = 0; i <= SURFACE_POINTS; i++) {
    const x = i / SURFACE_POINTS; // 0 = left edge, 1 = right edge
    let surface = offset + sign * absSlope * (x - 0.5);

    // Overlay sloshing waves during activation animation
    if (elapsed != null && targetLevel > 0) {
      const decay = Math.exp(-WAVE_DECAY * elapsed);
      for (const { n, amplitude, freq } of WAVE_MODES) {
        // cos(n*π*x) gives the spatial shape; cos(freq*t) oscillates it in time
        surface += targetLevel * amplitude * Math.cos(n * Math.PI * x) * Math.cos(freq * elapsed) * decay;
      }
    }

    // Clamp to valid range
    surface = Math.max(0, Math.min(100, surface));

    // Convert water level to CSS Y (0% = top of element, 100% = bottom)
    const yPct = 100 - surface;

    const xStr = `${(x * 100).toFixed(1)}%`;
    const yStr = `${yPct.toFixed(1)}%`;

    points.push(`${xStr} ${yStr}`);
  }

  // Close polygon at bottom corners
  points.push('100% 100%', '0% 100%');
  return `polygon(${points.join(', ')})`;
}

export default function useLiquidAnimation(isActive, gravityX, progressPercent) {
  // animState: { baseLevel, elapsed, target } during spring+wave animation, null when settled
  const [animState, setAnimState] = useState(null);
  const wasActive = useRef(isActive);
  const rafId = useRef(null);
  const spring = useRef({ pos: 0, vel: 0 });
  const progressRef = useRef(progressPercent);
  const startTimeRef = useRef(0);

  // Keep progressRef in sync via effect (not render) to satisfy linter
  useEffect(() => {
    progressRef.current = progressPercent;
  }, [progressPercent]);

  // Activation / deactivation — only re-runs when isActive toggles
  useEffect(() => {
    if (isActive && !wasActive.current) {
      // Fresh activation — spring from 0 to current progress + sloshing waves
      const target = progressRef.current;
      spring.current = { pos: 0, vel: 0 };

      const animate = (now) => {
        const s = spring.current;
        const dist = target - s.pos;
        s.vel += dist * SPRING_STIFFNESS;
        s.vel *= SPRING_DAMPING;
        s.pos += s.vel;

        const elapsed = (now - startTimeRef.current) / 1000;
        const springDone = Math.abs(s.vel) < SPRING_THRESHOLD && Math.abs(dist) < SPRING_THRESHOLD;
        const wavesDone = Math.exp(-WAVE_DECAY * elapsed) < WAVE_SETTLE;

        if (springDone && wavesDone) {
          setAnimState(null); // settle — clipPath tracks progressPercent directly
          return;
        }

        setAnimState({ baseLevel: s.pos, elapsed, target });
        rafId.current = requestAnimationFrame(animate);
      };

      // Kick off on next frame to avoid sync setState in effect body
      rafId.current = requestAnimationFrame((now) => {
        startTimeRef.current = now;
        setAnimState({ baseLevel: 0, elapsed: 0, target });
        rafId.current = requestAnimationFrame(animate);
      });
    } else if (!isActive && wasActive.current) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      Promise.resolve().then(() => setAnimState(null));
    }

    wasActive.current = isActive;

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isActive]);

  if (!isActive) {
    return { clipPath: undefined, isLiquid: false };
  }

  // During animation: use spring level + waves; after settling: track live progress
  const level = animState ? animState.baseLevel : progressPercent;
  const elapsed = animState ? animState.elapsed : null;
  const targetLevel = animState ? animState.target : progressPercent;

  return {
    clipPath: buildClipPath(level, elapsed, gravityX, targetLevel),
    isLiquid: true,
  };
}
