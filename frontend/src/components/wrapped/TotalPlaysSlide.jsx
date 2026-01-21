import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const TotalPlaysSlide = ({ uniqueTracks, totalPlays }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <CountUp
        end={uniqueTracks}
        duration={2}
        className="wrapped-big-number"
      />
      <div className="wrapped-label">verschiedeni Lieder</div>

      <div style={{ margin: '2rem 0' }}>
        <CountUp
          end={totalPlays}
          duration={2}
          separator="'"
          className="wrapped-big-number"
        />
        <div className="wrapped-label">mal abgspielt</div>
      </div>

      <div className="wrapped-divider" />
      <p className="wrapped-text">
        Das isch ä huufä Müsig für eini Fasnacht!
      </p>
    </motion.div>
  );
};

export default TotalPlaysSlide;
