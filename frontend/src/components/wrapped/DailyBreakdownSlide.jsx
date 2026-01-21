import { motion } from 'framer-motion';

const DailyBreakdownSlide = ({ playsByDay }) => {
  if (!playsByDay || playsByDay.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5 }}
        className="slide-container"
      >
        <div className="wrapped-label">Kei Plays gfundä</div>
      </motion.div>
    );
  }

  // Sort days by date to ensure correct carnival week order
  const sortedDays = [...playsByDay].sort((a, b) => a.date.localeCompare(b.date));
  const maxPlays = Math.max(...sortedDays.map(day => day.plays));

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <div className="wrapped-label" style={{ marginBottom: '2rem' }}>
        Plays pro Tag
      </div>

      <div className="bar-chart">
        {sortedDays.map((day, index) => {
          const percentage = (day.plays / maxPlays) * 100;

          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bar-item"
            >
              <div className="bar-label">{day.name}</div>
              <div className="bar-container">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="bar-fill"
                >
                  <span className="bar-value">{day.plays}</span>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DailyBreakdownSlide;
