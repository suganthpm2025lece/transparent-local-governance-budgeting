/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#dae4f4',
          200: '#b8cbe9',
          300: '#89a9db',
          400: '#5580c7',
          500: '#315eb0',
          600: '#214893',
          700: '#1b3a77',
          800: '#163063',
          900: '#0f2347',
          950: '#09162e',
        },
        civic: {
          green: '#059669',
          greenLight: '#d1fae5',
          greenDark: '#047857',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
