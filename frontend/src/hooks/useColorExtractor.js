import { useState, useEffect } from 'react';

// Extract dominant color from an image URL using canvas
const extractColor = (imageUrl) => {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Sample a small version for performance
      const sampleSize = 50;
      canvas.width = sampleSize;
      canvas.height = sampleSize;

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

      try {
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imageData.data;

        // Count color occurrences, grouping similar colors
        const colorCounts = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = Math.round(data[i] / 32) * 32;
          const g = Math.round(data[i + 1] / 32) * 32;
          const b = Math.round(data[i + 2] / 32) * 32;
          const a = data[i + 3];

          // Skip transparent or very dark/light pixels
          if (a < 128) continue;
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 220) continue;

          const key = `${r},${g},${b}`;
          colorCounts[key] = (colorCounts[key] || 0) + 1;
        }

        // Find the most common color
        let maxCount = 0;
        let dominantColor = null;

        for (const [color, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
          }
        }

        if (dominantColor) {
          const [r, g, b] = dominantColor.split(',').map(Number);
          // Boost saturation slightly for more vibrant glow
          const max = Math.max(r, g, b);
          const boost = max > 0 ? 255 / max : 1;
          const boostedR = Math.min(255, Math.round(r * boost * 0.8));
          const boostedG = Math.min(255, Math.round(g * boost * 0.8));
          const boostedB = Math.min(255, Math.round(b * boost * 0.8));

          resolve({
            rgb: `rgb(${r}, ${g}, ${b})`,
            rgba: (alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`,
            vibrant: `rgb(${boostedR}, ${boostedG}, ${boostedB})`,
            vibrantRgba: (alpha) => `rgba(${boostedR}, ${boostedG}, ${boostedB}, ${alpha})`,
          });
        } else {
          resolve(null);
        }
      } catch {
        // Canvas tainted or other error
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
};

// Hook to extract and cache dominant color from album art
const useColorExtractor = (imageUrl) => {
  const [state, setState] = useState({ color: null, isLoading: false });

  useEffect(() => {
    let cancelled = false;

    // Start async extraction
    const extract = async () => {
      if (!imageUrl) {
        return { color: null, isLoading: false };
      }
      const extractedColor = await extractColor(imageUrl);
      return { color: extractedColor, isLoading: false };
    };

    extract().then((newState) => {
      if (!cancelled) {
        setState(newState);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return { color: state.color, isLoading: state.isLoading };
};

// Static color cache for track list items (avoids re-extraction)
const colorCache = new Map();

export const getColorForImage = async (imageUrl) => {
  if (!imageUrl) return null;

  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl);
  }

  const color = await extractColor(imageUrl);
  colorCache.set(imageUrl, color);
  return color;
};

export default useColorExtractor;
