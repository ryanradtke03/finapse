/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        sans: ['"DM Sans"', "sans-serif"],
      },
      colors: {
        brand: {
          bg: "#111210", // main background
          surface: "#1a1b18", // card/panel surface
          border: "rgba(255,255,255,0.08)", // subtle borders
          green: "#86b358", // primary accent (buttons, italic, focus)
          "green-hover": "#94c462",
          text: "#e8e5de", // primary text
          muted: "rgba(232,229,222,0.4)", // secondary text
          hint: "rgba(232,229,222,0.2)", // footer / placeholder
        },
      },
    },
  },
  plugins: [],
};
