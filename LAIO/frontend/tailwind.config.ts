import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          forest: "#173f34",
          "forest-dark": "#0f3028",
          "forest-deep": "#112f28",
          accent: "#f0513e",
          "accent-dark": "#d94736",
          "accent-deep": "#8a2f24",
          "accent-soft": "#dc6b5b",
          cream: "#f8df7d",
          "cream-soft": "#fff7cf",
          paper: "#fffdf7",
          sand: "#f4eedf",
          ink: "#173f34",
          muted: "#426157",
          subtle: "#597168",
          faint: "#759087",
          success: "#285c38",
          "success-border": "#65a36d",
          "success-bg": "#eef8e6",
          warn: "#654f0a",
          "warn-border": "#d7b83f",
          "warn-bg": "#fff7cf",
          "error-bg": "#fff0e9",
        },
      },
      keyframes: {
        // Fade animations
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        
        // Scale animations
        zoomIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        
        // Feedback animations
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        
        // Loading animations
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        
        // Button interactions
        ping: {
          "75%, 100%": { transform: "scale(1.2)", opacity: "0" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        fadeInUp: "fadeInUp 0.3s ease-out",
        zoomIn: "zoomIn 0.2s ease-out",
        shake: "shake 0.3s ease-in-out",
        spin: "spin 0.6s linear infinite",
        ping: "ping 0.3s cubic-bezier(0, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;