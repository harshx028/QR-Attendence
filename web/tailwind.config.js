/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans Variable"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        "primary-container": "#EEF2FF",
        canvas: "#F4F6FB",
        surface: "#ffffff",
        "on-surface": "#0F172A",
        "on-surface-variant": "#64748B",
        outline: "#E2E8F0",
        error: "#EF4444",
        success: "#10B981",
      },
      borderRadius: {
        full: "9999px",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 4px 16px -4px rgba(15,23,42,0.08)",
        lift: "0 10px 30px -10px rgba(79,70,229,0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        scanline: {
          "0%, 100%": { top: "6%" },
          "50%": { top: "90%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        pop: "pop 0.45s cubic-bezier(.2,.9,.3,1.2) both",
        scanline: "scanline 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
