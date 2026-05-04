/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        medical: {
          navy: "var(--bg-color)",
          card: "var(--card-bg)",
          red: "#e63946",
          teal: "#06b6d4",
        },
        slate: {
          950: "rgb(var(--color-slate-950) / <alpha-value>)",
          900: "rgb(var(--color-slate-900) / <alpha-value>)",
          800: "rgb(var(--color-slate-800) / <alpha-value>)",
          400: "rgb(var(--color-slate-400) / <alpha-value>)",
          300: "rgb(var(--color-slate-300) / <alpha-value>)",
          200: "rgb(var(--color-slate-200) / <alpha-value>)",
          100: "rgb(var(--color-slate-100) / <alpha-value>)",
        },
        white: "rgb(var(--color-white) / <alpha-value>)",
      },
      boxShadow: {
        glow: "0 0 35px rgba(6, 182, 212, 0.18)",
        redglow: "0 0 35px rgba(230, 57, 70, 0.22)",
      },
      animation: {
        ecg: "ecg 5s linear infinite",
        pulseSoft: "pulseSoft 2.5s ease-in-out infinite",
      },
      keyframes: {
        ecg: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
