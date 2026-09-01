/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6D5B5E',
          cocoa: '#70605E',
          dark: '#3C3028',
          cream: '#F5F1E8',
          creamLight: '#FAF7F2',
          accent: '#F5EDE3',
          paper: '#FAF9F6',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderColor: {
        brandLine: 'rgba(60, 48, 40, 0.18)',
      },
    },
  },
  plugins: [],
};
