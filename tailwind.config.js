/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cr: {
          bg: '#1a1a1a',
          surface: '#242424',
          card: '#292929',
          cardHover: '#333333',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(255, 255, 255, 0.16)',
          textMain: '#f3f4f6',
          textMuted: '#9ca3af',
          blue: '#0F7DFD',
          red: '#EF4444',
          green: '#22C55E',
          yellow: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['"Segoe UI"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
