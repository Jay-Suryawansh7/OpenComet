/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        background: '#0a0c10',
        surface: '#0c0e12',
        elevated: '#13161c',
        card: '#161a22',
      },
      keyframes: {
        'in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-0': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'zoom-in-95': {
          from: { transform: 'scale(0.95)' },
          to: { transform: 'scale(1)' },
        },
        'slide-in-from-bottom-2': {
          from: { transform: 'translateY(8px)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'in': 'in 150ms ease-out',
        'fade-in': 'fade-in-0 150ms ease-out',
      },
    },
  },
  plugins: [
    // animate-in utilities
    function ({ addUtilities }) {
      addUtilities({
        '.animate-in': {
          'animation-duration': '150ms',
          'animation-timing-function': 'ease-out',
          'animation-fill-mode': 'both',
          'animation-name': 'fade-in-0, zoom-in-95',
        },
      })
    },
  ],
}