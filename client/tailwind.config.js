/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}" // Include Angular templates and components
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#F3C70D",
          hover: "#E0B600",
          muted: "#F39B0D",
        },
        surface: {
          950: "#0B0B0B",
          900: "#1B1B1B",
          800: "#2A2A2A",
          700: "#333333",
          600: "#525252",
        },
        danger: {
          DEFAULT: "#DC2626",
          hover: "#B91C1C",
        },
        success: {
          DEFAULT: "#10B981",
          hover: "#059669",
        },
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
