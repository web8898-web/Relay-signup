/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        app: ["'Baloo 2'", "'Noto Sans TC'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
