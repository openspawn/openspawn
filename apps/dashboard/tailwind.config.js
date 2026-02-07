/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'landscape': { 'raw': '(orientation: landscape) and (max-height: 500px)' },
        'portrait': { 'raw': '(orientation: portrait)' },
      },
    },
  },
  plugins: [],
};
