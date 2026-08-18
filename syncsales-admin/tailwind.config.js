/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: "#0f1419",
          surface: "#1a2332",
          border: "#2d3a4f",
          accent: "#3b82f6",
          muted: "#8b9cb3",
        },
      },
    },
  },
  plugins: [],
};
