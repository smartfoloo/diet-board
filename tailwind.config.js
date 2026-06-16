/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Warm "trackpolicy" canvas + surfaces
        canvas: '#f4efe4',
        'canvas-deep': '#ece5d5',
        surface: '#fbfaf6',
        'surface-2': '#f7f3ea',
        line: '#e4ddcc',
        'line-strong': '#d6ccb6',
        // Warm slate text
        ink: '#2c2925',
        'ink-soft': '#6b6457',
        'ink-faint': '#9a9182',
        // Interactive / data accent (blue)
        accent: '#2f6fb0',
        'accent-soft': '#dce8f3',
        'accent-deep': '#234f80',
        // Amber callout
        amber: '#e7c483',
        'amber-soft': '#f5e9cf',
        'amber-ink': '#8a6a32',
        // Heat tints (cards sitting too long)
        'heat-warm': '#f6e7cf',
        'heat-hot': '#f3d6c4'
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
        card: '0 1px 2px rgba(44,41,37,0.04), 0 4px 16px rgba(44,41,37,0.06)',
        'card-hover': '0 2px 4px rgba(44,41,37,0.06), 0 8px 28px rgba(44,41,37,0.12)',
        drawer: '-8px 0 40px rgba(44,41,37,0.18)'
      }
    }
  },
  plugins: []
};
