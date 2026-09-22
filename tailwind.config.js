/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Matches the webfonts loaded in src/client/index.css.
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      // Ported from the FlyWise.html prototype's :root custom properties, so
      // the React UI can match that theme exactly instead of approximating it
      // with stock Tailwind slate/blue shades.
      colors: {
        bg: '#0B1B2B',
        surface: '#122540',
        'surface-raised': '#17304F',
        line: '#24405F',
        ink: '#EAF0F6',
        'ink-dim': '#94A7BD',
        amber: '#FFB020',
        good: '#4CAF7D',
        bad: '#E5595F',
      },
    },
  },
  plugins: [],
};
