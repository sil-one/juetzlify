import { motion } from 'framer-motion';
import { useMemo } from 'react';
import CountUp from 'react-countup';
import { calculateMillions } from '../../utils/wrappedHelpers';

const FakeFasnachtsfleSlide = () => {
  const millions = useMemo(() => calculateMillions(), []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎊</div>
      <div className="wrapped-big-number">
        <CountUp
          end={millions}
          duration={2}
          separator="'"
        />
        <span> Mio.</span>
      </div>
      <div className="wrapped-label">Fasnachtsflee umägriärt</div>
      <div className="wrapped-divider" />
      <p className="wrapped-text">
        Ä riesigi Mängi Flee! Villicht sölletmer das nöchsts Johr besser im Griff ha.
      </p>
    </motion.div>
  );
};

export default FakeFasnachtsfleSlide;
