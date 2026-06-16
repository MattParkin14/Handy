/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // VoxBox Racing brand palette
        brand: {
          DEFAULT: "#FF6B1A", // pit-lane orange (primary)
          light: "#FF8A47", // soft orange (highlights)
          dark: "#F25A0C", // deep orange (shadow / on-light)
        },
        board: "#FFD23F", // board yellow (transcribing accent)
        asphalt: "#15181F", // primary dark surface
        ink: "#10131A", // deepest surface
        chalk: "#FFF8F2", // text / bars
      },
    },
  },
  plugins: [],
};
