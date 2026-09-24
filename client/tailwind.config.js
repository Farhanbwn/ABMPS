/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#C92812',
          dark: '#A91F0D',
          hover: '#A91F0D',
          light: '#FBE9E6',
        },
        primary: {
          DEFAULT: '#C92812',
          hover: '#A91F0D',
          dark: '#A91F0D',
          light: '#FBE9E6',
        },
        success: {
          DEFAULT: '#16845B',
          hover: '#116847',
          light: '#E8F5EF',
        },
        warning: {
          DEFAULT: '#C77A00',
          hover: '#A66600',
          light: '#FFF4D6',
        },
        danger: {
          DEFAULT: '#C62828',
          hover: '#A72020',
          light: '#FDECEC',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F5F5',
        },
        background: '#FAF9F7',
        text: {
          primary: '#171717',
          secondary: '#555555',
          muted: '#777777',
        },
        dark: {
          DEFAULT: '#171717',
          secondary: '#555555',
          muted: '#777777',
        },
        light: {
          DEFAULT: '#FAF9F7',
          surface: '#FFFFFF',
          secondary: '#F5F5F5',
        },
        border: '#E3E3E3',
      },
      fontFamily: {
        sans: [
          '"Noto Sans Bengali"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        bengali: [
          '"Noto Sans Bengali"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
