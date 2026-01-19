import React, { useRef, useEffect, useState } from 'react';

const MarqueeText = ({ text, className = '' }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;

        if (textWidth > containerWidth) {
          setShouldScroll(true);
          setScrollDistance(textWidth - containerWidth + 20); // 20px extra padding
        } else {
          setShouldScroll(false);
          setScrollDistance(0);
        }
      }
    };

    checkOverflow();

    // Recheck on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  // Calculate animation duration based on text length (slower for longer text)
  const animationDuration = Math.max(4, scrollDistance / 30);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${shouldScroll ? 'marquee-text' : ''}`}
        style={
          shouldScroll
            ? {
                '--scroll-distance': `-${scrollDistance}px`,
                '--animation-duration': `${animationDuration}s`,
              }
            : {}
        }
      >
        {text}
      </span>
    </div>
  );
};

export default MarqueeText;
