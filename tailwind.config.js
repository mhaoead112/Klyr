/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4B5EFF',
        'primary-dark': '#3B4EEF',
        'light-gray': '#DCDCE6',
        'dark-blue': '#0B102C',
        'placeholder': '#A0A0B2',
        'secondary': '#8A8AA3',
        'card-bg': '#ECECF4',
        'gradient': '#7174F9',
        'dark-card': '#1A1D29',
        'dark-bg': '#0F1419',
        'dark-surface': '#1E2328',
        'glass-light': 'rgba(255, 255, 255, 0.1)',
        'glass-dark': 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.2)',
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'h1': ['32px', '40px'],
        'h2': ['24px', '32px'],
        'h3': ['20px', '28px'],
        'body-lg': ['18px', '26px'],
        'body': ['16px', '24px'],
        'body-sm': ['14px', '20px'],
        'caption': ['12px', '16px'],
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};