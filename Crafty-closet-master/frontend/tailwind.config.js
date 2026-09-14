// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rose:  { 50:'#fff0f4', 100:'#fce4ec', 200:'#f9bdd1', 300:'#f4a7b9', 400:'#ed6e93', 500:'#e07a95', 600:'#d6547a', 700:'#b83b61', 800:'#972e50', 900:'#7c2845', 950:'#3d1a2e' },
        cream: '#fff8f5',
        sand:  '#f5ebe0',
        peach: '#ffddd2',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'rose-sm': '0 2px 8px rgba(214,84,122,0.10)',
        'rose-md': '0 6px 20px rgba(214,84,122,0.16)',
        'rose-lg': '0 16px 48px rgba(214,84,122,0.22)',
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease',
        'slide-up': 'slideUp 0.3s ease',
        'scale-in': 'scaleIn 0.2s ease',
      },
      keyframes: {
        fadeIn:  { from:{ opacity:0 },                          to:{ opacity:1 } },
        slideUp: { from:{ opacity:0, transform:'translateY(14px)' }, to:{ opacity:1, transform:'none' } },
        scaleIn: { from:{ opacity:0, transform:'scale(0.96)' },     to:{ opacity:1, transform:'none' } },
      },
    },
  },
  plugins: [],
};
