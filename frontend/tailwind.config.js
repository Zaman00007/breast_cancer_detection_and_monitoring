/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#D89AFC',
        secondary: '#B07CFA',
        bg: '#F9FAFB',
        text: '#1E1E1E',
        muted: '#6B7280'
      }
    },
  },
  plugins: [],
}
