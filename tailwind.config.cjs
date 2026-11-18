/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme")
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,mjs}"],
  darkMode: "class", // allows toggling dark mode manually
  theme: {
    extend: {
      fontFamily: {
        // 补中日韩回退：Roboto 不含汉字，缺失时会落到系统字体并造成字重/字面跳动
        sans: [
          "Roboto",
          "-apple-system",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
          ...defaultTheme.fontFamily.sans,
        ],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
