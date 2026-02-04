/**
 * Convert ISO timestamp to relative time format
 * @param {string} isoTimestamp - ISO timestamp string
 * @returns {string} Relative time string (e.g., "just now", "5 min ago", "2 hours ago")
 */
export function getRelativeTime(isoTimestamp) {
  if (!isoTimestamp) {
    return 'unknown';
  }

  const now = new Date();
  const timestamp = new Date(isoTimestamp);

  // Check for invalid date
  if (isNaN(timestamp.getTime())) {
    return 'invalid date';
  }

  const diffMs = now - timestamp;

  // Handle future timestamps
  if (diffMs < 0) {
    return 'in the future';
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} min ago`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  }
}
