/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#16181d",
          soft: "#3a3f4b",
          muted: "#6d7280",
        },
        paper: {
          DEFAULT: "#f4f1ea",
          card: "#fffcf8",
        },
        line: "#e4dfd4",
        teal: {
          DEFAULT: "#0f5f5b",
          dark: "#0b4744",
          soft: "#e6f3f1",
        },
        clay: "#9a3b24",
        gold: "#8a5a12",
      },
      fontFamily: {
        sans: ["Manrope", "Segoe UI", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(22,24,29,0.04), 0 16px 40px rgba(22,24,29,0.04)",
      },
    },
  },
  plugins: [],
}
