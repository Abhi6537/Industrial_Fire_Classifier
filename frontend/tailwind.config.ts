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
        // Direction 3: Tactical Field Operations / Defense GIS
        "tw-navy":    "#141714",
        "tw-surface": "#1c1f1b",
        "tw-raised":  "#262a24",
        "tw-border":  "#2f352e",
        "tw-border-hi": "#454e43",
        // Primary Tactical Accent (Burnt Rust Amber)
        "tw-orange":   "#c05621",
        "tw-orange-hi":"#dd6b20",
        // Secondary GIS Accent (Muted Tactical Olive)
        "tw-teal":     "#78866b",
        "tw-teal-hi":  "#94a388",
        // Text Typography (Warm Pale Sand & Field Grays)
        "tw-text":    "#e8e4d9",
        "tw-muted":   "#98a092",
        "tw-dim":     "#60675b",
        // Thermal classification
        "th-fire":    "#dc2626",
        "th-flare":   "#d97706",
        "th-persist": "#ca8a04",
        "th-agri":    "#65a30d",
        "th-nature":  "#16a34a",
        "th-unknown": "#71717a",
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
