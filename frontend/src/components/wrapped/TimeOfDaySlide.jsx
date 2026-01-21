import { motion } from 'framer-motion';

const TimeOfDaySlide = ({ mostActiveTimeOfDay, timeOfDayStats }) => {
  if (!mostActiveTimeOfDay) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5 }}
        className="slide-container"
      >
        <div className="wrapped-label">Kei Date gfundä</div>
      </motion.div>
    );
  }

  const periodNames = {
    morning: 'Morge',
    afternoon: 'Nachmittag',
    evening: 'Obig',
    night: 'Nacht',
  };

  const periodDescriptions = {
    morning: '8:00 - 13:00',
    afternoon: '13:00 - 18:00',
    evening: '18:00 - 00:00',
    night: '00:00 - 8:00',
  };

  const periodEmojis = {
    morning: '☀️',
    afternoon: '🌤️',
    evening: '🌙',
    night: '🌃',
  };

  const maxPlays = timeOfDayStats[0]?.plays || 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <div className="wrapped-label" style={{ marginBottom: '1rem' }}>
        Am meischte Müsig am
      </div>

      <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
        {periodEmojis[mostActiveTimeOfDay.period]}
      </div>

      <h2 className="wrapped-title" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
        {periodNames[mostActiveTimeOfDay.period]}
      </h2>

      <div className="wrapped-label" style={{ marginBottom: '2rem' }}>
        {periodDescriptions[mostActiveTimeOfDay.period]}
      </div>

      {/* Bar chart of all time periods */}
      <div className="bar-chart" style={{ maxWidth: '400px' }}>
        {timeOfDayStats.map((stat, index) => {
          const percentage = (stat.plays / maxPlays) * 100;

          return (
            <motion.div
              key={stat.period}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.15 }}
              className="bar-item"
              style={{ marginBottom: '0.75rem' }}
            >
              <div className="bar-label" style={{ minWidth: '110px' }}>
                {periodEmojis[stat.period]} {periodNames[stat.period]}
              </div>
              <div className="bar-container">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.15 }}
                  className="bar-fill"
                >
                  <span className="bar-value">{stat.plays}</span>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TimeOfDaySlide;
