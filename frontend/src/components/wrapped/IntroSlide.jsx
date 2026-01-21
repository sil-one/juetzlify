import { motion } from 'framer-motion';

const IntroSlide = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6 }}
      className="slide-container"
    >
      <h1 className="wrapped-title">Jützlify Wrapped</h1>
      <div className="wrapped-divider" />
      <p className="wrapped-subtitle">Fasnacht 2026 Edition</p>
      <div className="swipe-hint">
        ← Swipe oder Pfiil-Tästä druckä →
      </div>
    </motion.div>
  );
};

export default IntroSlide;
