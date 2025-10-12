/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/web/public/**/*.{html,js}",
    "./src/web/public/js/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#a8c0ff',
          400: '#7a9fff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4554bb',
          800: '#3543a3',
          900: '#25338b',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f5ebff',
          200: '#ead6ff',
          300: '#d5b3ff',
          400: '#c090ff',
          500: '#ab6dff',
          600: '#9654e8',
          700: '#764ba2',
          800: '#5c3a7d',
          900: '#422a58',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
