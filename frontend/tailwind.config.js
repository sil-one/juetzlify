/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'juetzlify-red': '#F50000',
        'juetzlify-yellow': '#FFCC00',
      },
    },
  },
  plugins: [],
}
