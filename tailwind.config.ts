import type { Config } from "tailwindcss";

// Brand color/font tokens are defined once as CSS custom properties in
// app/globals.css (fetched from the real VNGGames ON Figma file,
// KprMCUGsAJYHAl5Dpd81ov — see the comment block at the top of globals.css
// for the exact node data). This config just exposes them as Tailwind
// utilities (bg-brand-primary, font-display, etc.) for the three app pages.
const config: Config = {
  theme: {
    extend: {
      colors: {
        "brand-bg": "var(--color-brand-bg)",
        "brand-nav": "var(--color-brand-nav)",
        "brand-border": "var(--color-brand-border)",
        "brand-primary": "var(--color-brand-primary)",
        "brand-primary-dark": "var(--color-brand-primary-dark)",
        "brand-gold": "var(--color-brand-gold)",
        "brand-orange": "var(--color-brand-orange)",
        "brand-pink": "var(--color-brand-pink)",
        "brand-neutral": "var(--color-brand-neutral)",
      },
      fontFamily: {
        display: ["var(--font-inter)", "sans-serif"],
        body: ["var(--font-barlow)", "sans-serif"],
      },
    },
  },
};

export default config;
