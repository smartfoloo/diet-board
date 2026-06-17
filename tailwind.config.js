/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte}'],
  theme: {
    extend: {
      colors: {
        // Clean white canvas + surfaces (neutral grays)
        canvas: '#ffffff',
        'canvas-deep': '#f1f3f5',
        surface: '#ffffff',
        'surface-2': '#f7f8fa',
        line: '#e7e9ec',
        'line-strong': '#d3d7dd',
        // Neutral slate text
        ink: '#1f2328',
        'ink-soft': '#5c636e',
        'ink-faint': '#98a0ab',
        // Interactive / data accent (blue)
        accent: '#2f6fb0',
        'accent-soft': '#e6f0f9',
        'accent-deep': '#234f80',
        // Amber callout
        amber: '#e7c483',
        'amber-soft': '#fbf2dd',
        'amber-ink': '#8a6a32',
        // Success green (成立)
        success: '#4e9e6e',
        'success-soft': '#dcefe2',
        'success-ink': '#2f6a48',
        // Heat tints (cards sitting too long)
        'heat-warm': '#fbf1e3',
        'heat-hot': '#fbe4d8'
      },
      fontFamily: {
        sans: [
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ]
      },
      borderRadius: {
        card: '14px',
        pill: '999px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)',
        'card-hover': '0 2px 4px rgba(15,23,42,0.06), 0 8px 28px rgba(15,23,42,0.10)',
        drawer: '-8px 0 40px rgba(15,23,42,0.16)'
      }
    }
  },
  plugins: []
};
