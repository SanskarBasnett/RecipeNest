/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   '#F28C00',
        'primary-dark': '#d47a00',
        accent:    '#FF6B2B',
        'accent-dark':  '#e05520',
        success:   '#2A9D8F',
        dark:      '#3D1F00',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      borderRadius: {
        sm:   '8px',
        md:   '12px',
        lg:   '20px',
        full: '9999px',
      },
      boxShadow: {
        sm:  '0 1px 3px rgba(242,140,0,0.08)',
        md:  '0 4px 16px rgba(242,140,0,0.12)',
        lg:  '0 8px 32px rgba(242,140,0,0.16)',
      },
      maxWidth: {
        container: '1200px',
      },
    },
  },
  plugins: [],
};
