import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07080b",
          900: "#0c0e13",
          800: "#12141b",
          700: "#1a1d26"
        },
        bone: "#f6f3ec",
        brass: {
          200: "#f3e2b6",
          300: "#eacf8e",
          400: "#e0b96a",
          500: "#c99a45",
          600: "#a97a30",
          700: "#7c5a23"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "-apple-system", "sans-serif"]
      },
      boxShadow: {
        premium: "0 30px 80px -30px rgba(0,0,0,.65)",
        glow: "0 0 0 1px rgba(224,185,106,.18), 0 20px 60px -25px rgba(224,185,106,.35)"
      },
      backgroundImage: {
        "brass-gradient": "linear-gradient(135deg, #f3e2b6 0%, #e0b96a 45%, #a97a30 100%)"
      }
    }
  },
  plugins: []
};

export default config;
