/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3730a3', // Brand Indigo-800
          light: '#e0e7ff',
          dark: '#1e1b4b',
        },
        background: {
          light: '#f8fafc', // Slate-50
          dark: '#0f172a',  // Slate-900
        }
      }
    },
  },
  plugins: [],
}
