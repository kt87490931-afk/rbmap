import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        insta: {
          pink: "#E1306C",
          purple: "#833AB4",
          orange: "#F77737",
          yellow: "#FCAF45",
        },
      },
      fontFamily: {
        pretendard: ["Pretendard", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;