/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'studio-dark': '#090d16',
        'studio-panel': '#0f172a',
        'studio-panel-border': '#1e293b',
        'studio-panel-header': '#131d35',
        'studio-accent': '#38bdf8',
        'studio-accent-hover': '#0ea5e9',
        'studio-text': '#f1f5f9',
      },
      width: {
        '84': '21rem',
      }
    },
  },
  plugins: [],
}
