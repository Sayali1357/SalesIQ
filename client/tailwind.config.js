/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0b0f19',
        card: '#131b2e',
        cardHover: '#1a243b',
        sidebar: '#0d1322',
        border: '#1e293b',
        muted: '#94a3b8',
        primary: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed',
          light: '#a78bfa',
          dark: '#6d28d9'
        },
        cyan: {
          DEFAULT: '#06b6d4',
          light: '#22d3ee'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(139, 92, 246, 0.4)',
        card: '0 10px 30px -5px rgba(0, 0, 0, 0.5)'
      }
    },
  },
  plugins: [],
}
