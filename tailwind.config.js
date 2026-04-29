/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx,js,jsx}',
    './services/**/*.{ts,tsx,js,jsx}',
  ],
  darkMode: ['class', '.theme-dark'],
  theme: {
    extend: {
      // Tokens are wired to CSS variables defined in index.css.
      // The same utility (e.g. `bg-cream`) resolves to different colors
      // depending on whether `.theme-dark` is on <html>.
      colors: {
        cream: 'var(--cream)',
        'cream-2': 'var(--cream-2)',
        'cream-3': 'var(--cream-3)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        'ink-4': 'var(--ink-4)',
        rule: 'var(--rule)',
        'rule-soft': 'var(--rule-soft)',
        oxford: 'var(--oxford)',
        'oxford-2': 'var(--oxford-2)',
        'editorial-red': 'var(--editorial-red)',
        evergreen: 'var(--evergreen)',
        'stance-for': 'var(--stance-for)',
        'stance-against': 'var(--stance-against)',
        'stance-neutral': 'var(--stance-neutral)',
        rating: {
          'true-bg': 'var(--r-true-bg)',
          'true-fg': 'var(--r-true-fg)',
          'true-bd': 'var(--r-true-bd)',
          'stt-bg': 'var(--r-stt-bg)',
          'stt-fg': 'var(--r-stt-fg)',
          'stt-bd': 'var(--r-stt-bd)',
          'unv-bg': 'var(--r-unv-bg)',
          'unv-fg': 'var(--r-unv-fg)',
          'unv-bd': 'var(--r-unv-bd)',
          'mis-bg': 'var(--r-mis-bg)',
          'mis-fg': 'var(--r-mis-fg)',
          'mis-bd': 'var(--r-mis-bd)',
          'fls-bg': 'var(--r-fls-bg)',
          'fls-fg': 'var(--r-fls-fg)',
          'fls-bd': 'var(--r-fls-bd)',
          'unr-bg': 'var(--r-unr-bg)',
          'unr-fg': 'var(--r-unr-fg)',
          'unr-bd': 'var(--r-unr-bd)',
        },
        verify: {
          bg: 'var(--verify-bg)',
          fg: 'var(--verify-fg)',
          bd: 'var(--verify-bd)',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      // Stage 1 spacing scale (4/8/12/16/24/32/48/64) is identical to
      // Tailwind's default scale (p-1/p-2/p-3/p-4/p-6/p-8/p-12/p-16),
      // so no override is needed and existing utilities keep working.
      // Stage 1 radius scale (4/8/12/16/full): map default xl=12px,
      // 2xl=16px etc. work out of the box. We add explicit numeric
      // aliases so chunk #2 primitives can express intent clearly
      // (`rounded-12` for cards, `rounded-16` for modals).
      borderRadius: {
        4: '4px',
        8: '8px',
        12: '12px',
        16: '16px',
      },
    },
  },
  plugins: [],
};
