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
      <div className="wrapped-label">Insgesamt</div>
      <CountUp
        end={hours}
        duration={2}
        className="wrapped-big-number"
      />
      <div className="wrapped-label">Stundä Müsig glost, also</div>
      <CountUp
        end={parseFloat((hours / 24).toFixed(1))}
        duration={2}
        decimals={1}
        className="wrapped-big-number"
      />
      <div className="wrapped-label">Täg am Stuck!</div>
    </motion.div>
  );
};

export default TotalHoursSlide;
