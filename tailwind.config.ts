import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["variant", "&:is(.dark *):not(.light-popup, .light-popup *)"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gis: {
          bg: "#0B0F17",
          panel: "#111827",
          card: "#1F2937",
          border: "#374151",
          accent: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          critical: "#B91C1C",
          info: "#38BDF8",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
