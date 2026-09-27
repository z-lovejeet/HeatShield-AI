import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        obsidian: {
          950: "#171614",
          900: "#211F1C",
          800: "#2A2724",
          700: "#36322E",
        },
        emerald: {
          300: "#94C4AB",
          400: "#78B093",
          500: "#5E9A7B",
          600: "#4A7F64",
        },
        accent: {
          DEFAULT: "#5E9A7B",
          bright: "#78B093",
          muted: "rgba(94, 154, 123, 0.14)",
        },
      },
      letterSpacing: {
        display: "-0.025em",
        tightest: "-0.02em",
        tighter: "-0.015em",
        technical: "0.06em",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "spring-bezel": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
