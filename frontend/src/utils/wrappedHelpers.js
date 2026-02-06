/**
 * Format duration in seconds to Swiss German format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "42 Stunde 17 Minute")
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0 && minutes === 0) {
    return '0 Minute';
  }

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'Stund' : 'Stunde'}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'Minut' : 'Minute'}`);
  }

  return parts.join(' ');
}

/**
 * Generate random millions for Fasnachtsflee slide
 * @returns {number} Random number between 1-999 millions
 */
export function calculateMillions() {
  return Math.floor(Math.random() * 999) + 1;
}

/**
 * Format number with Swiss apostrophe thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number (e.g., "79'321")
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/**
 * Calculate total listening duration from play count
 * Assumes average track length of 3 minutes
 * @param {number} playCount - Total number of plays
 * @returns {number} Total seconds
 */
export function estimateDuration(playCount) {
  const AVERAGE_TRACK_LENGTH = 240; // 4 minutes in seconds
  return playCount * AVERAGE_TRACK_LENGTH;
}
