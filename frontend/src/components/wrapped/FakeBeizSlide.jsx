import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const FakeBeizSlide = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🥴😴</div>
      <CountUp
        end={572}
        duration={2}
        className="wrapped-big-number"
      />
      <div className="wrapped-label">Mal idr Beiz igschlafä</div>
      <div className="wrapped-divider" />
      <p className="wrapped-text">
        Es isch eifach so gmiätlich gsi! Diä 500 Meter bis is Bett hättsch ez wirkli niämerem chennä atuä.
      </p>
    </motion.div>
  );
};

export default FakeBeizSlide;
