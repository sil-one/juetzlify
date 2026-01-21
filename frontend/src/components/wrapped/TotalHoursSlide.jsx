import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { estimateDuration, formatDuration } from '../../utils/wrappedHelpers';

const TotalHoursSlide = ({ totalPlays }) => {
  const totalSeconds = estimateDuration(totalPlays);
  const hours = Math.floor(totalSeconds / 3600);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <CountUp
        end={hours}
        duration={2}
        className="wrapped-big-number"
      />
      <div className="wrapped-label">Stunde Müsig</div>
      <div className="wrapped-divider" />
      <p className="wrapped-text">
        {formatDuration(totalSeconds)} am Stück! Das isch meh als es ganzes Wucheänd.
      </p>
    </motion.div>
  );
};

export default TotalHoursSlide;
