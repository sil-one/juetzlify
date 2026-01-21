import { motion } from 'framer-motion';

const SlideNavigation = ({ currentSlide, totalSlides, onPrev, onNext, onDotClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="slide-navigation"
    >
      <button
        className="nav-arrow"
        onClick={onPrev}
        disabled={currentSlide === 0}
        aria-label="Previous slide"
      >
        ←
      </button>

      <div className="nav-dots">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            className={`nav-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => onDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <button
        className="nav-arrow"
        onClick={onNext}
        disabled={currentSlide === totalSlides - 1}
        aria-label="Next slide"
      >
        →
      </button>
    </motion.div>
  );
};

export default SlideNavigation;
