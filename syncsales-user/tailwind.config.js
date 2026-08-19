/** @type {import('tailwindcss').Config} */

const rgb = (channel) => `rgb(var(${channel}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: rgb("--background"),
        surface: {
          DEFAULT: rgb("--surface"),
          elevated: rgb("--surface-elevated"),
        },
        border: rgb("--border"),
        brand: rgb("--brand"),
        primary: {
          DEFAULT: rgb("--primary"),
          hover: rgb("--primary-hover"),
          foreground: rgb("--primary-foreground"),
          soft: "rgb(var(--primary) / 0.1)",
        },
        foreground: {
          DEFAULT: rgb("--foreground"),
          muted: rgb("--foreground-muted"),
          disabled: rgb("--foreground-disabled"),
        },
        success: rgb("--success"),
        warning: rgb("--warning"),
        error: rgb("--error"),
        info: rgb("--info"),
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-md": "var(--shadow-card-md)",
        "card-lg": "var(--shadow-card-lg)",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "slide-right": "slideRight 0.25s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
