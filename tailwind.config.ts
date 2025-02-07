
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
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#00C853',
          foreground: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#141414',
          foreground: '#F8F8F8'
        },
        accent: {
          DEFAULT: '#2D2D2D',
          foreground: '#FFFFFF'
        },
        destructive: {
          DEFAULT: '#FF3B30',
          foreground: '#FFFFFF'
        },
        muted: {
          DEFAULT: '#2D2D2D',
          foreground: '#A1A1A1'
        },
        card: {
          DEFAULT: '#1C1C1C',
          foreground: '#FFFFFF'
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
        slideUp: 'slideUp 0.3s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
