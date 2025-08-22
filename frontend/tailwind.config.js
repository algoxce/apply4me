/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7c3aed",
        light: "#ffffff",
        dark: "#0f0f0f",
      },
    },
  },
  plugins: [],
};
