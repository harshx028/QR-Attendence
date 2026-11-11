/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        "primary-container": "#EEF2FF",
        surface: "#ffffff",
        "on-surface": "#0F172A",
        "on-surface-variant": "#64748B",
        outline: "#E2E8F0",
        error: "#EF4444",
        success: "#10B981",
      },
      borderRadius: {
        full: "9999px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
