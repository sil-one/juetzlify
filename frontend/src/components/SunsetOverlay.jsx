import { useState } from 'react';

const CLICKS_TO_DISMISS = 5;

const SunsetOverlay = ({ onDismiss }) => {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= CLICKS_TO_DISMISS) {
      onDismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] cursor-pointer select-none"
      onClick={handleClick}
    >
      <img
        src="/juetzlify_sunset.jpg"
        alt=""
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
};

export default SunsetOverlay;
