/** @type {import('tailwindcss').Config} */
const em = px => `${px / 16}em`
const rem = px => ({ [px]: `${px / 16}rem` })
const px = num => ({ [num]: `${num}px` })


module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./app/**/*.html",
    "./app/**/*.ts",

  ],
  plugins: [
    require('@tailwindcss/forms'),
    // ...
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'san-serif']
      },
      colors: {
        'golden': {
          '50': '#fefee8',
          '100': '#fefec3',
          '200': '#fffb89',
          '300': '#fef246',
          '400': '#fbe214',
          '500': '#ebc907',
          '600': '#d3a303',
          '700': '#a27006',
          '800': '#86580d',
          '900': '#724811',
          '950': '#422606',
        },
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
        '6xl': '64px',
      },
      screens: {
        sm: em(640),
        md: em(768),
        lg: em(1024),
        xl: em(1280),
      },
      borderWidth: {
        ...px(2),
        ...px(3),
        ...px(5),
      },
      fontSize: {
        ...rem(12),
        ...rem(13),
      }
    
    },
  },
  plugins: [],
}

