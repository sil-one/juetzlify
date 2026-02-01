import { motion } from 'framer-motion';

const ThankYouSlide = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6 }}
      className="slide-container"
    >
      <h1 className="wrapped-title">Merci!</h1>
      <div className="wrapped-divider" />
      <p className="wrapped-subtitle">
        Für die geili Fasnacht 2026 säged yych d Jützlitypä
      </p>
      <p className="wrapped-text" style={{ marginTop: '2rem' }}>
        Bis zum negschtä Jahr! 🎭
      </p>
    </motion.div>
  );
};

export default ThankYouSlide;
