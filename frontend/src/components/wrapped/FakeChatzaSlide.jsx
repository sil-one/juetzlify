import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const FakeChatzaSlide = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎺🥁</div>
      <CountUp
        end={8427}
        duration={2}
        separator="'"
        className="wrapped-big-number"
      />
      <div className="wrapped-label">mal der komplett Chatzämüsigmarsch gspilt</div>
      <div className="wrapped-divider" />
      <p className="wrapped-text">
        Vo Afang bis Änd. Das isch echti Hingab!
      </p>
    </motion.div>
  );
};

export default FakeChatzaSlide;
