/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}', // Make sure this path matches your project structure
    './public/index.html',
    // Add paths to any other files that use Tailwind classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}