/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090D14",
        surface: "#101622",
        surfaceHover: "#161E2E",
        card: "#121A28",
        border: "#1E293B",
        borderLight: "#334155",
        accent: {
          DEFAULT: "#00E599",
          hover: "#00C985",
          dim: "rgba(0, 229, 153, 0.12)",
          glow: "rgba(0, 229, 153, 0.25)"
        },
        drop: {
          DEFAULT: "#FF4565",
          dim: "rgba(255, 69, 101, 0.12)",
          glow: "rgba(255, 69, 101, 0.25)"
        },
        calmBlue: {
          DEFAULT: "#38BDF8",
          dim: "rgba(56, 189, 248, 0.12)"
        },
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
        textMuted: "#64748B"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      boxShadow: {
        glow: "0 0 20px -3px rgba(0, 229, 153, 0.15)",
        dropGlow: "0 0 20px -3px rgba(255, 69, 101, 0.2)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)"
      },
      animation: {
        pulseSlow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ringGlow: "ringGlow 2s ease-in-out infinite alternate"
      },
      keyframes: {
        ringGlow: {
          "0%": { filter: "drop-shadow(0 0 2px rgba(0, 229, 153, 0.4))" },
          "100%": { filter: "drop-shadow(0 0 8px rgba(0, 229, 153, 0.8))" }
        }
      }
    },
  },
  plugins: [],
};
