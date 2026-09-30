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
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surfaceHover: "rgb(var(--surface-secondary) / <alpha-value>)",
        card: "rgb(var(--surface-raised) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        borderLight: "rgb(var(--border-strong) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover: "rgb(var(--primary-hover) / <alpha-value>)",
          dim: "rgba(7, 150, 105, 0.10)",
          glow: "rgba(7, 150, 105, 0.18)"
        },
        drop: {
          DEFAULT: "#C94051",
          dim: "rgba(201, 64, 81, 0.10)",
          glow: "rgba(201, 64, 81, 0.16)"
        },
        calmBlue: {
          DEFAULT: "#5583B1",
          dim: "rgba(85, 131, 177, 0.10)"
        },
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        error: "rgb(var(--error) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
        textPrimary: "rgb(var(--foreground) / <alpha-value>)",
        textSecondary: "rgb(var(--foreground-secondary) / <alpha-value>)",
        textMuted: "rgb(var(--muted) / <alpha-value>)",
        primaryForeground: "rgb(var(--primary-foreground) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      boxShadow: {
        glow: "0 0 20px -3px rgba(0, 229, 153, 0.15)",
        dropGlow: "0 0 20px -3px rgba(255, 69, 101, 0.2)",
        card: "0 3px 14px -3px rgba(20, 40, 30, 0.12)"
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
