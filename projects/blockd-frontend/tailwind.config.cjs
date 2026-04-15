/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0914',
          surface: '#12102A',
          elevated: '#1C1A3A',
        },
        purple: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        green: {
          400: '#34D399',
          500: '#10B981',
        },
        red: {
          400: '#F87171',
          500: '#EF4444',
        },
        amber: {
          400: '#FBBF24',
        },
        text: {
          primary: '#F1F0FF',
          secondary: '#A09DC0',
          muted: '#6B6890',
        },
        border: 'rgba(139, 92, 246, 0.15)',
        'border-hover': 'rgba(139, 92, 246, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
