/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        shopee: {
          DEFAULT: "#EE4D2D",
          dark: "#d83f22",
          soft: "#fff4f1"
        }
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 23, 42, 0.08)",
        float: "0 20px 50px rgba(238, 77, 45, 0.15)"
      },
      backgroundImage: {
        "hero-grad":
          "linear-gradient(135deg, rgba(238,77,45,1) 0%, rgba(255,120,69,1) 55%, rgba(255,177,66,1) 100%)"
      }
    }
  },
  plugins: []
};

module.exports = config;
