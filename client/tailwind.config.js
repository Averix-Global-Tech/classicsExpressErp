/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Brand — Navy & Orange ────────────────────────────────────────────────
        navy: { // Re-mapped to neutral gray for a pure dark mode
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        orange: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // ← primary CTA
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        sky: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // ← subtle accents
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // ── Semantic surface / foreground / border tokens ────────────────────
        // These reference CSS custom properties so they automatically switch
        // between light and dark mode. Page authors should use these instead
        // of hardcoded slate-* values in new code.
        surface: {
          DEFAULT: 'var(--surface)',
          card:    'var(--surface-card)',
          input:   'var(--surface-input)',
          hover:   'var(--surface-hover)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong:  'var(--border-strong)',
        },
        fg: {
          DEFAULT: 'var(--fg)',
          muted:   'var(--fg-muted)',
          subtle:  'var(--fg-subtle)',
        },
        sidebar: {
          bg:     '#0a0a0a',
          hover:  '#171717',
          active: '#f97316',
          border: '#171717',
          fg:     '#d4d4d4',
          'fg-active': '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:  '0.75rem',
        input: '0.5rem',
        modal: '1rem',
      },
      boxShadow: {
        card:     '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 6px -1px rgb(0 0 0 / 0.06)',
        cardHover:'0 4px 16px -2px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        elevated: '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.08)',
        modal:    '0 20px 60px -10px rgb(0 0 0 / 0.25)',
        glow:     '0 0 0 3px rgb(99 102 241 / 0.15)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: 0, transform: 'translateX(16px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(239 68 68 / 0.4)' },
          '50%':      { boxShadow: '0 0 0 6px rgb(239 68 68 / 0)' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.2s ease-out',
        'slide-in-right':'slide-in-right 0.2s ease-out',
        'scale-in':      'scale-in 0.15s ease-out',
        shimmer:         'shimmer 1.6s linear infinite',
        'pulse-ring':    'pulse-ring 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
