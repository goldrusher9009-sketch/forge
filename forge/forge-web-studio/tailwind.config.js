/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forge: {
          50: '#f8f7ff',
          100: '#f0edff',
          200: '#e6e0ff',
          300: '#d4c5ff',
          400: '#b8a0ff',
          500: '#9876ff',
          600: '#7c4aff',
          700: '#6630f0',
          800: '#5226d0',
          900: '#3d1aa0',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
