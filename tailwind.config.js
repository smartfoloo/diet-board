/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte}'],
  theme: {
    extend: {
      colors: {
        // Clean white canvas + surfaces (Untitled UI gray scale)
        canvas: '#ffffff',
        'canvas-deep': '#f9fafb',
        surface: '#ffffff',
        'surface-2': '#f9fafb',
        line: '#eaecf0',
        'line-strong': '#d0d5dd',
        // Neutral slate text (gray-900 / gray-600 / gray-500)
        ink: '#101828',
        'ink-soft': '#475467',
        'ink-faint': '#667085',
        // Interactive / brand accent (Untitled UI violet)
        accent: '#7f56d9',
        'accent-soft': '#f4ebff',
        'accent-deep': '#6941c6',
        // Amber callout
        amber: '#e7c483',
        'amber-soft': '#fbf2dd',
        'amber-ink': '#8a6a32',
        // Success green (成立) — Untitled UI green
        success: '#17b26a',
        'success-soft': '#dcfae6',
        'success-ink': '#067647',
        // Heat tints (cards sitting too long)
        'heat-warm': '#fbf1e3',
        'heat-hot': '#fbe4d8'
      },
      fontFamily: {
        sans: [
          'Inter',
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ]
      },
      borderRadius: {
        card: '12px',
        pill: '999px'
      },
      boxShadow: {
        // Untitled UI "shadow-xs / shadow-sm" — subtle, paired with a hairline border
        card: '0 1px 2px 0 rgba(16,24,40,0.06), 0 1px 3px 0 rgba(16,24,40,0.10)',
        'card-hover': '0 2px 4px -2px rgba(16,24,40,0.06), 0 12px 16px -4px rgba(16,24,40,0.08)',
        drawer: '0 8px 8px -4px rgba(16,24,40,0.04), 0 20px 24px -4px rgba(16,24,40,0.10)'
      }
    }
  },
  plugins: []
};
