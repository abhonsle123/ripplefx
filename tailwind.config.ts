
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
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: '#0A192F',
        foreground: '#FFFFFF',
        primary: {
          DEFAULT: '#64FFDA',
          foreground: '#0A192F'
        },
        secondary: {
          DEFAULT: '#112240',
          foreground: '#FFFFFF'
        },
        accent: {
          DEFAULT: '#233554',
          foreground: '#FFFFFF'
        },
        destructive: {
          DEFAULT: '#FF3B30',
          foreground: '#FFFFFF'
        },
        muted: {
          DEFAULT: '#8892B0',
          foreground: '#A1A1A1'
        },
        card: {
          DEFAULT: '#112240',
          foreground: '#FFFFFF'
        }
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0A192F 0%, #112240 50%, #64FFDA 100%)',
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
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.8s ease-out',
        slideUp: 'slideUp 0.8s ease-out',
        gradientShift: 'gradientShift 15s ease infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
