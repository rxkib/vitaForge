/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Adjust this if your entry HTML file is in a different location (for example, "./public/index.html")
    "./src/**/*.{js,jsx,ts,tsx}", // This scans all your React component files for class names
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")], // Integrate daisyUI
};
