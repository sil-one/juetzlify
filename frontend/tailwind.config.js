/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'juetzli-red': '#F50000',
        'juetzli-yellow': '#FFCC00',
      },
    },
  },
  plugins: [],
}
