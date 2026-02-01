import { useState, useEffect } from 'react';

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date('2026-02-11T19:45:00+01:00');
      const now = new Date();
      const difference = targetDate - now;

      if (difference <= 0) {
        setIsExpired(true);
        return null;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    const updateCountdown = () => {
      const time = calculateTimeLeft();
      setTimeLeft(time);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  if (isExpired || !timeLeft) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-sp-text-secondary">
      <span className="text-sp-green">🎭</span>
      <div className="flex items-center gap-1">
        <span className="text-sp-green font-semibold">{timeLeft.days}</span>
        <span>Täg</span>
      </div>
      <span className="text-sp-text-muted">|</span>
      <div className="flex items-center gap-1">
        <span className="text-sp-green font-semibold">{timeLeft.hours}</span>
        <span>Stund</span>
      </div>
      <span className="text-sp-text-muted">|</span>
      <div className="flex items-center gap-1">
        <span className="text-sp-green font-semibold">{timeLeft.minutes}</span>
        <span>Minütä</span>
      </div>
      <span className="text-sp-text-muted">|</span>
      <div className="flex items-center gap-1">
        <span className="text-sp-green font-semibold">{timeLeft.seconds}</span>
        <span>Sekundä</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
