export const COLORS = {
  red: '#F50000',
  yellow: '#FFCC00',
  black: '#000000',
  white: '#FFFFFF',
  darkGray: '#1a1a1a',
  lightGray: '#f5f5f5',
};

export const API_BASE_URL = import.meta.env.PROD
  ? '/api'
  : 'http://localhost:3000/api';

export const LOGO_ASPECT_RATIO = 1; // width:height (square 800x800)
