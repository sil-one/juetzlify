/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spotify-inspired dark theme
        'sp-black': '#121212',
        'sp-dark': '#181818',
        'sp-gray': '#282828',
        'sp-light-gray': '#404040',
        'sp-green': '#2ECC71',
        'sp-green-bright': '#3EDC81',
        'sp-text': '#FFFFFF',
        'sp-text-secondary': '#B3B3B3',
        'sp-text-muted': '#727272',
      },
    },
  },
  plugins: [],
}
