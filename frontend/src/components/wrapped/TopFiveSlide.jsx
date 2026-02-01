import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../utils/constants';

const TopFiveSlide = ({ topTracks }) => {
  const topFive = topTracks.slice(0, 5);

  if (topFive.length === 0) {
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

  const topTrack = topFive[0];
  const albumArtUrl = `${API_BASE_URL}/album-art/${encodeURIComponent(topTrack.trackId + '.jpg')}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="slide-container"
    >
      <div className="wrapped-label" style={{ marginBottom: '2rem' }}>
        Fasnacht 2026 Top 5
      </div>

      {/* #1 Track - Big with Album Art */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🥇</div>
        <img
          src={albumArtUrl}
          alt={topTrack.title}
          style={{
            width: '180px',
            height: '180px',
            borderRadius: '12px',
            objectFit: 'cover',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(46, 204, 113, 0.3)',
            margin: '0 auto 1rem',
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#FFFFFF',
          marginBottom: '0.5rem',
        }}>
          {topTrack.title}
        </div>
        <div style={{
          fontSize: '1.1rem',
          color: '#B3B3B3',
          marginBottom: '0.5rem',
        }}>
          {topTrack.artist}
        </div>
        <div style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#2ECC71',
        }}>
          {topTrack.count} mal abgspielt
        </div>
      </motion.div>

      {/* Tracks 2-5 - Smaller List */}
      <div style={{ width: '100%', maxWidth: '450px' }}>
        {topFive.slice(1).map((track, index) => {
          const medals = ['🥈', '🥉', '4️⃣', '5️⃣'];
          const trackAlbumArtUrl = `${API_BASE_URL}/album-art/${encodeURIComponent(track.trackId + '.jpg')}`;

          return (
            <motion.div
              key={track.filename}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 1) * 0.1 + 0.3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: 'rgba(40, 40, 40, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                border: '1px solid rgba(46, 204, 113, 0.2)',
              }}
            >
              <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                {medals[index]}
              </div>
              <img
                src={trackAlbumArtUrl}
                alt={track.title}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {track.title}
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#B3B3B3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {track.artist}
                </div>
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#2ECC71',
                flexShrink: 0,
              }}>
                {track.count}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TopFiveSlide;
