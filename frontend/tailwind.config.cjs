/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/app.tsx",         // 👈 Explicitly point to your lowercase file
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b',
          950: '#020617',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        }
      },
    },
  },
  plugins: [],
}