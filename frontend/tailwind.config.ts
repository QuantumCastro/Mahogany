import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./styles/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        panel: "var(--panel)",
        border: "var(--border)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        brand: {
          DEFAULT: "var(--brand)",
          strong: "var(--brand-strong)",
        },
      },
      backgroundColor: {
        surface: "var(--surface)",
        panel: "var(--panel)",
      },
      textColor: {
        foreground: "var(--foreground)",
        muted: "var(--muted)",
      },
      borderColor: {
        border: "var(--border)",
      },
    },
  },
  plugins: [],
};

export default config;
