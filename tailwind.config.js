/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#25533F',
          light: '#AACC96',
          dark: '#1A3828',
        },
        secondary: {
          main: '#AFAB23',
          light: '#EFCE7B',
          dark: '#7A7800',
        },
        background: {
          default: '#F5F9F5',
          paper: '#FFFFFF',
        },
        text: {
          primary: '#1A1A1E',
          secondary: '#6B7280',
        },
        success: '#25533F',
        warning: '#AFAB23',
        error: '#EF4444',
      },
    },
  },
  plugins: [],
};
