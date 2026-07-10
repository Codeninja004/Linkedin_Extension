/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './popup.html',
    './dashboard.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // LinkedIn blue. 600 is the canonical accent (#0A66C2); 400/200 are
        // the lighter tones used as the accent in dark mode (#70B5F9 / #A8D4FF).
        brand: {
          50: '#EAF3FC',
          100: '#D0E5F9',
          200: '#A8D4FF',
          300: '#8CC7FF',
          400: '#70B5F9',
          500: '#3B90E6',
          600: '#0A66C2',
          700: '#004182',
          800: '#00335F',
          900: '#002748',
        },
        // LinkedIn's warm neutrals. These steps are deliberately chosen so a
        // single token reads correctly in both roles it's used for across the
        // app (e.g. neutral-900 = primary text in light mode AND card surface
        // in dark mode; neutral-50 = page background in light AND near-white
        // primary text in dark). Backgrounds avoid pure #000/#FFF per spec.
        neutral: {
          50: '#F4F2EE', // light page background / dark primary text (near-white)
          100: '#E9E7E1', // light chips, subtle fills
          200: '#D6D9DC', // light borders
          300: '#C6CBD0',
          400: '#8F9296', // muted text (both themes)
          500: '#666666', // secondary text (light)
          600: '#4D5156',
          700: '#3A4149', // dark borders / secondary text
          800: '#2D3339', // dark secondary surface / borders
          900: '#262C32', // light primary text / dark card surface
          950: '#1D2226', // dark page background
        },
        success: { DEFAULT: '#057642', dark: '#3EC786' },
        warning: { DEFAULT: '#B26A00', dark: '#F8C76A' },
        error: { DEFAULT: '#CC1016', dark: '#FF6B6B' },
        info: { DEFAULT: '#0A66C2', dark: '#70B5F9' },
        // shadcn/ui sidebar tokens (see :root/.dark in tailwind.css).
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      boxShadow: {
        panel: '0 4px 24px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.08)',
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'slide-in': 'slideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
