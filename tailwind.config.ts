import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Cores místicas do Arcanum.AI
        mystical: {
          gold: {
            DEFAULT: "#FFD700",
            light: "#FFA500",
            dark: "#FF8C00",
          },
          lilac: {
            DEFAULT: "#9D4EDD",
            light: "#C77DFF",
            dark: "#7B2CBF",
          },
          cosmic: {
            DEFAULT: "#4A90E2",
            light: "#6BB6FF",
            dark: "#2E5C8A",
          },
          deep: {
            DEFAULT: "#0A0A0A",
            light: "#1A1A1A",
            dark: "#000000",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "cosmic-pulse": {
          "0%, 100%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "0.8",
            transform: "scale(1.05)",
          },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 40px hsl(270 70% 60% / 0.5)",
          },
          "50%": {
            boxShadow: "0 0 60px hsl(270 70% 60% / 0.8), 0 0 100px hsl(45 90% 60% / 0.5)",
          },
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-20px)",
          },
        },
        "rune-glow": {
          "0%, 100%": {
            opacity: "0.6",
            filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))",
          },
          "50%": {
            opacity: "1",
            filter: "drop-shadow(0 0 16px rgba(255, 215, 0, 0.8))",
          },
        },
        "particle-float": {
          "0%": {
            transform: "translateY(0) translateX(0) rotate(0deg)",
            opacity: "0",
          },
          "10%": {
            opacity: "1",
          },
          "90%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateY(-100vh) translateX(50px) rotate(360deg)",
            opacity: "0",
          },
        },
        "portal-open": {
          "0%": {
            transform: "scale(0.8)",
            opacity: "0",
          },
          "50%": {
            transform: "scale(1.05)",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "crystal-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
            filter: "brightness(1)",
          },
          "50%": {
            transform: "scale(1.1)",
            filter: "brightness(1.3)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "cosmic-pulse": "cosmic-pulse 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "rune-glow": "rune-glow 2s ease-in-out infinite",
        "particle-float": "particle-float 8s linear infinite",
        "portal-open": "portal-open 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "crystal-pulse": "crystal-pulse 2s ease-in-out infinite",
      },
      boxShadow: {
        "mystical-gold": "0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 165, 0, 0.3)",
        "mystical-lilac": "0 0 20px rgba(157, 78, 221, 0.5), 0 0 40px rgba(199, 125, 255, 0.3)",
        "mystical-cosmic": "0 0 20px rgba(74, 144, 226, 0.5), 0 0 40px rgba(107, 182, 255, 0.3)",
        "mystical-glow": "0 0 30px rgba(255, 215, 0, 0.6), inset 0 0 20px rgba(157, 78, 221, 0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
