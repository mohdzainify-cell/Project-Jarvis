/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './electron/**/*.js'],
  theme: {
    extend: {
      colors: {
        'jarvis-bg': '#050a0f',
        'jarvis-panel': 'rgba(0,20,35,0.75)',
        'jarvis-cyan': '#00d4ff',
        'jarvis-dim': '#0099bb',
        'jarvis-border': 'rgba(0,212,255,0.25)',
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        display: ['Orbitron', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { top: '5%' },
          '50%': { top: '95%' },
        },
      },
    },
  },
  plugins: [],
};