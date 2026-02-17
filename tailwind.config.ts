import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "var(--black)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        surface3: "var(--surface3)",
        green: "var(--green)",
        "green-dim": "var(--green-dim)",
        "green-glow": "var(--green-glow)",
        white: "var(--white)",
        muted: "var(--muted)",
        muted2: "var(--muted2)",
        border: "var(--border)",
        border2: "var(--border2)",
        gold: "var(--gold)",
        red: "var(--red)",
      },
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      borderRadius: {
        card: "8px",
        btn: "3px",
        pill: "20px",
        badge: "3px",
        section: "6px",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(22px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        ticker: "ticker 32s linear infinite",
        "fade-up": "fade-up 0.8s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
