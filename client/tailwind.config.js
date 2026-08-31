/** @type {import('tailwindcss').Config} */

// Every colour resolves to a CSS custom property defined in src/styles.css.
// The <alpha-value> placeholder is what lets opacity modifiers keep working
// (bg-surface-800/80, ring-brand/45, ...).
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

// Radius is deliberately NOT redefined here. Tailwind's own scale already
// carries the three steps we want, so overriding the names would silently
// change every existing `rounded-*` in the app. The rule is a usage rule:
//   rounded-lg  =  8px  inputs, list rows, small buttons
//   rounded-xl  = 12px  buttons, cards, message bubbles
//   rounded-2xl = 16px  panels, modals, the floating regions
//   rounded-full        avatars, tab pills, icon buttons
// Nothing else. See /styleguide.

module.exports = {
  content: [
    "./src/**/*.{html,ts}" // Include Angular templates and components
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: token("brand"),
          hover: token("brand-hover"),
          deep: token("brand-deep"),
          // kept so existing `bg-brand-muted` markup keeps working during the
          // migration; prefer `brand-deep` in new code.
          muted: token("brand-deep"),
        },
        surface: {
          950: token("surface-950"),
          900: token("surface-900"),
          850: token("surface-850"),
          800: token("surface-800"),
          700: token("surface-700"),
          600: token("surface-600"),
          500: token("surface-500"),
        },
        ink: {
          DEFAULT: token("text-primary"),
          secondary: token("text-secondary"),
          muted: token("text-muted"),
          disabled: token("text-disabled"),
        },
        danger: {
          DEFAULT: token("danger"),
          hover: token("danger-hover"),
          text: token("danger-text"),
        },
        success: {
          DEFAULT: token("success"),
          hover: token("success-hover"),
        },
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
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
