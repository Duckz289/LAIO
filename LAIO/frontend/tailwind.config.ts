import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", // <-- QUAN TRỌNG: Phải có dòng này để ăn vào app router
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;