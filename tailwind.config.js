/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        // 갤럭시 Z Fold 펼침(내부 화면, ~700px 이상)에서 확장 레이아웃 적용.
        // 접힘(커버, ~360px)에서는 미적용.
        fold: '700px',
      },
      colors: {
        surface: {
          DEFAULT: '#0f0f0f',
          1: '#1a1a1a',
          2: '#242424',
          3: '#2e2e2e',
        },
        accent: {
          blue: '#3b82f6',
          green: '#22c55e',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
