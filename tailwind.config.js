// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Extend keyframes
      keyframes: {
        roll: {
          '0%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(-200%)' },
          '75%': { transform: 'translateY(-300%)' },
          '100%': { transform: 'translateY(0)' }
        },
        fadeIn: {
          'from': { 
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        }
      },
      // Extend animation
      animation: {
        'roll': 'roll 20s infinite',
        'fade-in': 'fadeIn 1s ease-in'
      },
      // Scrollbar customization
      scrollbar: {
        thin: {
          thumb: 'scrollbar-thumb-w-2',
          track: 'scrollbar-track-w-2',
        },
        wide: {
          thumb: 'scrollbar-thumb-w-6',
          track: 'scrollbar-track-w-6',
        },
      },
      // Custom colors
      colors: {
        scrollbarThumbDark: '#4a5568',
        scrollbarThumbLight: '#d4d4d8',
        scrollbarTrackDark: '#2d3748',
        scrollbarTrackLight: '#edf2f7',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};