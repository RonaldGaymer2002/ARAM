import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16a34a',
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'green-primary': '#4BAF47',
        'green-light': '#EDF7ED',
        'bg-page': '#F8F7F0',
        'black-heading': '#24231D',
        'body-text': '#878680',
        'border-default': '#E3E3E3',
        'border-dark': '#333F4D',
        'accent-blue': '#066AAB',
        'error-red': '#FF0000',
        'warning-amber': '#F57F17',
        'warning-light': '#FFF8E1',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(180deg, rgba(36,35,29,0.8) 0%, #4BAF47 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        'card': '30px 30px 80px 0px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        'card': '5px',
        'input': '8px',
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
