/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#162033",
        muted: "#667083",
        brand: "#116a63",
        "brand-dark": "#0a3f3b",
        accent: "#c9842b",
        blue: "#214a73",
        surface: "#ffffff",
        soft: "#f5f7f4",
        line: "#d9e1dc",
        danger: "#9d2f2f",
      }
    },
  },
  plugins: [],
}
