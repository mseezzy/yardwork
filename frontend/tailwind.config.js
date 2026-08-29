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
        lawn: {
          50: '#f2f9f4',
          100: '#e1f3e7',
          200: '#c4e6ce',
          300: '#97d2ab',
          400: '#64b683',
          500: '#3e9a62',
          600: '#2e7c4d',
          700: '#26633f',
          800: '#224f34',
          900: '#1d412c',
          950: '#0c2317',
        },
        mow: {
          good: '#10b981',
          fair: '#f59e0b',
          bad: '#ef4444',
          accent: '#16a34a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        }
      }
    },
  },
  plugins: [],
}
