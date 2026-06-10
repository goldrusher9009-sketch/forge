import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#04040A',
        paper: '#F5F4F0',
        'ink-dim': '#1A1A24',
        'ink-mid': '#2C2C3A',
        'ink-muted': '#6B6B80',
        v: '#7C3AED',
        'ring-sleep': '#7C3AED',
        'ring-nutrition': '#0891B2',
        'ring-activity': '#059669',
        'ring-social': '#D97706',
        'ring-wealth': '#E11D48',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      fontSize: {
        '10xl': ['10rem', { lineHeight: '0.9' }],
        '9xl': ['8rem', { lineHeight: '0.9' }],
        '8xl': ['6rem', { lineHeight: '0.9' }],
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.03em',
        editorial: '0.2em',
      },
      animation: {
        'ring-fill': 'ringFill 1.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        ringFill: {
          '0%': { strokeDashoffset: '1' },
          '100%': { strokeDashoffset: 'var(--target)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
