/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '360px',
      'sm': '414px',
      'md': '768px',
      'tablet': '834px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FE0000',
          hover: '#E00000',
          active: '#C70000',
          subtle: '#FFF0F0',
          muted: '#FDE8E8',
        },
        neutral: {
          dark: '#151515',
          text: '#171717',
          secondary: '#666666',
          muted: '#8E8E8E',
          border: '#E5E5E5',
          light: '#F7F7F7',
          surface: '#FFFFFF',
        },
        feedback: {
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 24px -6px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 20px 30px -10px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'card': '12px',
      }
    },
  },
  plugins: [],
};
