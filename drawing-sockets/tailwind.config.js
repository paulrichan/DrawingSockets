/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'bg-[#f00]', 'bg-[#0f0]', 'bg-[#00f]', 'bg-[#ffe01c]', 'bg-black'
  ]
}

