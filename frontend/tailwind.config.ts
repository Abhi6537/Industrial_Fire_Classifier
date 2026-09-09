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
        background: "#f8fafc",
        surface: "#ffffff",
        surfaceBorder: "#e2e8f0",
        surfaceHover: "#f1f5f9",
        saas: {
          canvas: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
          borderHover: "#cbd5e1",
          brand: "#2563eb",
          brandHover: "#1d4ed8",
          critical: "#dc2626",
          warning: "#d97706",
          success: "#16a34a",
          flare: "#64748b",
          darkText: "#0f172a",
          mutedText: "#64748b",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        mono: ["'JetBrains Mono'", "Consolas", "Monaco", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
