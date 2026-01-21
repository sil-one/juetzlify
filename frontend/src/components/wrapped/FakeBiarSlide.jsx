import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const FakeBiarSlide = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <CountUp
        end={79321}
        duration={2}
        separator="'"
        className="wrapped-big-number"
      />
      <div className="wrapped-label">Biär trunkä</div>
      <div className="wrapped-divider" />
      <p className="wrapped-text">
        Da gaht nu eppis! Hoffentli sind alli wieder guät hei cho.
      </p>
    </motion.div>
  );
};

export default FakeBiarSlide;
