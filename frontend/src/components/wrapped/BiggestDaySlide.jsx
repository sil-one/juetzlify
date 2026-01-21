import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const BiggestDaySlide = ({ biggestDay }) => {
  if (!biggestDay) {
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <div className="wrapped-label" style={{ marginBottom: '1rem' }}>
        Dä gröschti Tag
      </div>

      <h2 className="wrapped-title" style={{ fontSize: '3rem' }}>
        {biggestDay.name}
      </h2>

      <CountUp
        end={biggestDay.plays}
        duration={2}
        separator="'"
        className="wrapped-big-number"
      />
      <div className="wrapped-label">Plays</div>

      <div className="wrapped-divider" />
      <p className="wrapped-text">
        Dä het sich richtig glohnt!
      </p>
    </motion.div>
  );
};

export default BiggestDaySlide;
