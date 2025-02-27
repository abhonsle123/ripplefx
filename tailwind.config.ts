
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
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
        background: "#0A0B0D",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF"
        },
        secondary: {
          DEFAULT: "#1A1D1F",
          foreground: "#FFFFFF"
        },
        accent: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF"
        },
        destructive: {
          DEFAULT: "#FF3B30",
          foreground: "#FFFFFF"
        },
        muted: {
          DEFAULT: "#64748B",
          foreground: "#94A3B8"
        },
        card: {
          DEFAULT: "#111317",
          foreground: "#FFFFFF"
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        floating: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.8s ease-out',
        slideUp: 'slideUp 0.8s ease-out forwards',
        gradientShift: 'gradientShift 15s ease infinite',
        floating: 'floating 3s ease-in-out infinite',
        shimmer: 'shimmer 8s ease-in-out infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
