/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './web/**/*.{js,jsx,ts,tsx,html}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#24A1DE',
        'primary-dark': '#1A81B0',
        success: '#34C759',
        error: '#FF3B30',
        warning: '#FF9500',
        'ink': {
          light: '#222222',
          dark: '#FFFFFF',
        },
      },
      fontFamily: {
        arabic: ['NotoKufiArabic'],
      },
    },
  },
  plugins: [],
};
