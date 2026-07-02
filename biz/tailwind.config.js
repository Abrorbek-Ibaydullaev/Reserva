/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: '#0D1B3E',
        teal: '#0A7E8C',
        gold: '#F59E0B',
      },
    },
  },
  plugins: [],
};
