/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bet: {
          bg: "#0a0a12",
          card: "#11111d",
          border: "rgba(255,255,255,0.08)",
          violet: "#8b5cf6",
          magenta: "#d946ef",
          pink: "#ec4899",
          cyan: "#06b6d4"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: "0 0 40px rgba(139,92,246,0.15)",
        glow2: "0 0 60px rgba(217,70,239,0.15)"
      }
    },
  },
  plugins: [],
};
