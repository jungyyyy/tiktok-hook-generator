/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        card: "#1a1a1a",
        accent: "#fe2c55"
      }
    }
  },
  plugins: []
};
