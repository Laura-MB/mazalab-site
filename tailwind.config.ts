/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#000000", // --token-aae92d1e
        accent: "#814ac8",     // --token-a888adc2
        pinkish: "#df7afe",    // --token-cd9ad879
        borderDark: "#222222", // --token-313dd4d6
        cardBg: "rgba(13, 13, 13, 0.8)", // --token-b2fb23d9
      },
      fontFamily: {
        figtree: ['Figtree', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        'framer-tight': '-0.06em',
        'framer-wide': '0.3em',
      }
    },
  },
  plugins: [],
}