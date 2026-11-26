/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#03050b',
        midnight: '#070d1f',
        abyss: '#0b1530',
        aurora: { green: '#34e3a4', cyan: '#3fd6f0', violet: '#9d7bff', blue: '#4f7dff' },
        status: {
          completed: '#34e3a4',
          preliminary: '#f5c451',
          progress: '#3fd6f0',
          planned: '#9aa6c4',
          validation: '#ff8a6b',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: { prose2: '72ch' },
    },
  },
  plugins: [],
};
