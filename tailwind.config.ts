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
        background: "rgb(15 23 42)", // slate-900
        foreground: "rgb(248 250 252)", // slate-50
        primary: {
          DEFAULT: "rgb(59 130 246)", // blue-500
          foreground: "rgb(248 250 252)"
        },
        secondary: {
          DEFAULT: "rgb(51 65 85)", // slate-600
          foreground: "rgb(248 250 252)"
        },
        accent: {
          DEFAULT: "rgb(59 130 246)",
          foreground: "rgb(248 250 252)"
        },
        destructive: {
          DEFAULT: "rgb(239 68 68)", // red-500
          foreground: "rgb(248 250 252)"
        },
        muted: {
          DEFAULT: "rgb(100 116 139)", // slate-500
          foreground: "rgb(148 163 184)" // slate-400
        },
        card: {
          DEFAULT: "rgb(30 41 59)", // slate-800
          foreground: "rgb(248 250 252)"
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgb(59 130 246 / 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(147 51 234 / 0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, rgb(16 185 129 / 0.3) 0px, transparent 50%)',
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
          '0%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(1deg)' },
          '66%': { transform: 'translateY(-10px) rotate(-1deg)' },
          '100%': { transform: 'translateY(0px) rotate(0deg)' }
        },
        'float-delayed': {
          '0%': { transform: 'translateY(-10px) rotate(1deg)' },
          '33%': { transform: 'translateY(5px) rotate(-1deg)' },
          '66%': { transform: 'translateY(-15px) rotate(0.5deg)' },
          '100%': { transform: 'translateY(-10px) rotate(1deg)' }
        },
        morphing: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' }
        },
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(147, 51, 234, 0.5), 0 0 80px rgba(147, 51, 234, 0.3), 0 0 120px rgba(147, 51, 234, 0.1)' 
          }
        },
        'data-flow': {
          '0%': { transform: 'translateX(-100%) translateY(0)' },
          '50%': { transform: 'translateX(50vw) translateY(-20px)' },
          '100%': { transform: 'translateX(100vw) translateY(0)' }
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
        floating: 'floating 6s ease-in-out infinite',
        'float-delayed': 'float-delayed 8s ease-in-out infinite',
        morphing: 'morphing 8s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'data-flow': 'data-flow 10s linear infinite',
        shimmer: 'shimmer 8s ease-in-out infinite',
        fadeInUp: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        scaleIn: 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        revealLeft: 'revealLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        revealRight: 'revealRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        pulse: 'pulse 2s ease-in-out infinite',
        bounce: 'bounce 2s ease-in-out infinite',
        wave: 'wave 2.5s ease-in-out infinite',
        breathe: 'breathe 4s ease-in-out infinite'
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'spring': 'cubic-bezier(0.43, 0.13, 0.23, 0.96)',
        'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      },
      backdropBlur: {
        'xs': '2px',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
