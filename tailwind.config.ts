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
          950: "#060809",
          900: "#0B0F12",
          800: "#11171B",
          700: "#192227",
        },
        accent: {
          DEFAULT: "#10B981",
          bright: "#34D399",
          muted: "rgba(16, 185, 129, 0.12)",
        },
      },
      letterSpacing: {
        display: "-0.04em",
        tightest: "-0.035em",
        tighter: "-0.025em",
        technical: "0.18em",
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
