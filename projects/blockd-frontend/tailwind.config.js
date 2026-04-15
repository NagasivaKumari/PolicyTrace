import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0A0914',
        'bg-surface': '#12102A',
        'bg-elevated': '#1C1A3A',
        'purple-400': '#A78BFA',
        'purple-500': '#8B5CF6',
        'purple-600': '#7C3AED',
        'green-400': '#34D399',
        'green-500': '#10B981',
        'red-400': '#F87171',
        'red-500': '#EF4444',
        'amber-400': '#FBBF24',
        'text-primary': '#F1F0FF',
        'text-secondary': '#A09DC0',
        'text-muted': '#6B6890',
        'border': 'rgba(139,92,246,0.15)',
        'border-hover': 'rgba(139,92,246,0.35)',
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        badge: '6px',
      },
      spacing: {
        base: '8px',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
