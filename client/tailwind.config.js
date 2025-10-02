/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    fontFamily: {
      in: ["AlanSans", "sans-serif"],
      riope: ["Riope", "sans-serif"],
    },
    extend: {
      fontFamily: {
        'alan': ["AlanSans", "sans-serif"],
        'alan-sans': ["AlanSans", "sans-serif"],
        'riope': ["Riope", "sans-serif"],
      },
      backgroundImage: {
        'homebg': "url(./Assets/HomebgImage.png)",
        'homebgmb': "url(./Assets/HomebgImagemb.png)",
        'img1': "url(./Assets/img1.jpg)",
        'img2': "url(./Assets/img2.jpg)",
        'img3': "url(./Assets/img3.jpg)",
      },
      fontSize: {
        H: "clamp(33px, 6vw, 60px)",
        P: "clamp(8px, 3vw, 14px)",
        SH: "clamp(25px, 5vw, 35px)",
        Sl: "clamp(18px, 3vw, 35px)",
        40: '40px',
        35: '35px',
        24: '24px',
        18: '18px',
        16: '16px'
      },
      boxShadow: {
        '3xl': '0 4px 20px rgba(0, 0, 0, 0.5)'
      }
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".timeline-view": {
          "animation-timeline": "view-timeline",
        },
        ".timeline-range": {
          "animation-range": "entry 0% cover 40%",
        },
      });
    }),
  ],
}