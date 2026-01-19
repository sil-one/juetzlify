// Spotify-inspired color palette
export const COLORS = {
  black: '#121212',
  dark: '#181818',
  gray: '#282828',
  lightGray: '#404040',
  green: '#2ECC71',
  greenBright: '#3EDC81',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#727272',
};

export const API_BASE_URL = import.meta.env.PROD
  ? '/api'
  : 'http://localhost:3000/api';

export const LOGO_ASPECT_RATIO = 1; // width:height (square 800x800)
