
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
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        revealLeft: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        revealRight: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        // New smoother animations
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        wave: {
          '0%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(20deg)' },
          '40%': { transform: 'rotate(0deg)' },
          '60%': { transform: 'rotate(-20deg)' },
          '80%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(0deg)' }
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.8s ease-out',
        slideUp: 'slideUp 0.8s ease-out forwards',
        gradientShift: 'gradientShift 15s ease infinite',
        floating: 'floating 3s ease-in-out infinite',
        shimmer: 'shimmer 8s ease-in-out infinite',
        fadeInUp: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        scaleIn: 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        revealLeft: 'revealLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        revealRight: 'revealRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        // New smoother animations
        pulse: 'pulse 2s ease-in-out infinite',
        bounce: 'bounce 2s ease-in-out infinite',
        wave: 'wave 2.5s ease-in-out infinite',
        breathe: 'breathe 4s ease-in-out infinite'
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'spring': 'cubic-bezier(0.43, 0.13, 0.23, 0.96)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
