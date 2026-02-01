import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../utils/constants';

const FirstLastSlide = ({ firstTrack, lastTrack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <div className="wrapped-label" style={{ marginBottom: '2rem' }}>
        Z erschtä und letschtä Liäd
      </div>

      <div className="first-last-container">
        {firstTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="first-last-item"
          >
            <div className="first-last-label">Ersts Lied</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
              <img
                src={`${API_BASE_URL}/album-art/${encodeURIComponent(firstTrack.trackId + '.jpg')}`}
                alt={firstTrack.title}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="first-last-title">{firstTrack.title}</div>
                <div className="first-last-artist">{firstTrack.artist}</div>
              </div>
            </div>
          </motion.div>
        )}

        {lastTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="first-last-item"
          >
            <div className="first-last-label">Letschts Lied</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
              <img
                src={`${API_BASE_URL}/album-art/${encodeURIComponent(lastTrack.trackId + '.jpg')}`}
                alt={lastTrack.title}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="first-last-title">{lastTrack.title}</div>
                <div className="first-last-artist">{lastTrack.artist}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <p className="wrapped-text" style={{ marginTop: '1.5rem' }}>
        Vo Afang bis Ändi - ä perfekti Fasnacht!
      </p>
    </motion.div>
  );
};

export default FirstLastSlide;
