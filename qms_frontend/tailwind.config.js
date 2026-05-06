/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0f9f9',
          100: '#d5f0f0',
          200: '#afdfdf',
          300: '#7bc8c8',
          400: '#4daaaa',
          500: '#328d8d',
          600: '#287272',
          700: '#245d5d',
          800: '#214b4b',
          900: '#1f4040',
          950: '#112525',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
