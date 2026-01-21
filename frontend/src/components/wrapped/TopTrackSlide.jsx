import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../utils/constants';

const TopTrackSlide = ({ track }) => {
  if (!track) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5 }}
        className="slide-container"
      >
        <div className="wrapped-label">Kei Tracks gfundä</div>
      </motion.div>
    );
  }

  const albumArtUrl = `${API_BASE_URL}/album-art/${encodeURIComponent(track.trackId + '.jpg')}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <div className="wrapped-label" style={{ marginBottom: '2rem' }}>
        Dini Top Track
      </div>

      <div className="top-track-display">
        <img
          src={albumArtUrl}
          alt={track.title}
          className="top-track-art"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="top-track-info">
          <div className="top-track-title">{track.title}</div>
          <div className="top-track-artist">{track.artist}</div>
          <div className="wrapped-divider" />
          <div className="top-track-plays">{track.count} mal abgspielt</div>
        </div>
      </div>
    </motion.div>
  );
};

export default TopTrackSlide;
