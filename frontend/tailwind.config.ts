import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ThermoWatch base surfaces matching reference image
        "tw-navy":    "#0b101d",
        "tw-surface": "#111827",
        "tw-raised":  "#1f293d",
        "tw-border":  "#1e293b",
        "tw-border-hi": "#334155",
        // Accent (Flame Coral / Red CTA)
        "tw-orange":   "#f95738",
        "tw-orange-hi":"#ff6b4a",
        "tw-teal":     "#0d9488",
        "tw-teal-hi":  "#14b8a6",
        // Text
        "tw-text":    "#f8fafc",
        "tw-muted":   "#64748b",
        "tw-dim":     "#475569",
        // Thermal classification
        "th-fire":    "#ef4444",
        "th-flare":   "#f97316",
        "th-persist": "#eab308",
        "th-agri":    "#84cc16",
        "th-nature":  "#22c55e",
        "th-unknown": "#64748b",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        float:        "float 4s ease-in-out infinite",
        "pulse-ring": "pulseRing 2.5s ease-out infinite",
        "fade-up":    "fadeUp 0.6s ease-out both",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-8px)" },
        },
        pulseRing: {
          "0%":   { transform: "scale(1)",   opacity: "0.7" },
          "100%": { transform: "scale(2.8)", opacity: "0" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
