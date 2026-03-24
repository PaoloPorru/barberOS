/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: '#c9a84c', light: '#e8c97a', dim: 'rgba(201,168,76,0.12)' },
        dark: { DEFAULT: '#111111', card: '#181818', border: '#2a2a2a' },
        cream: '#f5f0e8',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
