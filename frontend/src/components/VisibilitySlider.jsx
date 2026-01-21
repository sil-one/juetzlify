import React from 'react';

const VisibilitySlider = ({ value, onChange }) => {
  // Map visibility to slider position: disabled=0, private=1, public=2
  const visibilityMap = {
    disabled: 0,
    private: 1,
    public: 2,
  };

  const reverseMap = {
    0: 'disabled',
    1: 'private',
    2: 'public',
  };

  const currentPosition = visibilityMap[value];

  const getColor = (position) => {
    switch (position) {
      case 0:
        return '#727272'; // sp-text-muted
      case 1:
        return '#60a5fa'; // blue-400
      case 2:
        return '#2ECC71'; // sp-green
      default:
        return '#727272';
    }
  };

  const handleSliderChange = (e) => {
    const newPosition = parseInt(e.target.value);
    onChange(reverseMap[newPosition]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' && currentPosition > 0) {
      onChange(reverseMap[currentPosition - 1]);
    } else if (e.key === 'ArrowRight' && currentPosition < 2) {
      onChange(reverseMap[currentPosition + 1]);
    }
  };

  const currentColor = getColor(currentPosition);

  // Calculate exact position for alignment
  const getExactPosition = (pos) => {
    // 4px padding on left, then distribute evenly across the remaining width
    const padding = 4; // px-1 = 4px
    return `calc(${padding}px + ${(pos / 2) * 100}% - ${pos * 2}px)`;
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <div className="relative h-8 flex items-center px-1">
        {/* Track background */}
        <div className="absolute left-1 right-1 h-0.5 bg-sp-gray rounded-full" />

        {/* Filled portion */}
        <div
          className="absolute left-1 h-0.5 rounded-full transition-all duration-300 ease-out"
          style={{
            width: `calc(${(currentPosition / 2) * 100}% - ${currentPosition * 2}px)`,
            backgroundColor: currentColor,
          }}
        />

        {/* Position markers - using absolute positioning for perfect alignment */}
        <div className="absolute left-0 right-0 pointer-events-none">
          {[0, 1, 2].map((pos) => (
            <div
              key={pos}
              className="absolute w-2.5 h-2.5 rounded-full transition-all duration-300"
              style={{
                left: getExactPosition(pos),
                top: '50%',
                transform: `translate(-50%, -50%) scale(${pos === currentPosition ? 1 : 0.8})`,
                backgroundColor: pos <= currentPosition ? getColor(pos) : '#282828',
                opacity: pos === currentPosition ? 1 : 0.5,
              }}
            />
          ))}
        </div>

        {/* Invisible range input */}
        <input
          type="range"
          min="0"
          max="2"
          step="1"
          value={currentPosition}
          onChange={handleSliderChange}
          onKeyDown={handleKeyDown}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          style={{ margin: 0 }}
        />

        {/* Draggable thumb - using same positioning as markers */}
        <div
          className="absolute w-5 h-5 rounded-full shadow-lg pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: getExactPosition(currentPosition),
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: currentColor,
            boxShadow: `0 2px 8px ${currentColor}40`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              backgroundColor: currentColor,
              opacity: 0.2,
            }}
          />
        </div>
      </div>

      {/* Compact labels */}
      <div className="flex justify-between text-[10px] text-sp-text-muted px-0.5">
        <span>Disabled</span>
        <span>Private</span>
        <span>Public</span>
      </div>
    </div>
  );
};

export default VisibilitySlider;
