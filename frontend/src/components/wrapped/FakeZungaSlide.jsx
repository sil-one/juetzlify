import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const FakeZungaSlide = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👅☕</div>
      <CountUp
        end={621}
        duration={2}
        className="wrapped-big-number"
      />
      <div className="wrapped-label">Mal Zungä am Kaffee Zwätschgä verbrennt</div>
      <div className="wrapped-divider" />
      <p className="wrapped-text">
        Heissä Kaffee u chaltä Morge - ä klassischi Kombo!
      </p>
    </motion.div>
  );
};

export default FakeZungaSlide;
