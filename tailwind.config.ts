import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Roboto", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Roboto Mono", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "Roboto Flex", "Roboto", "sans-serif"],
      },
      // Material 3 type scale tokens (px → rem) — Major Second
      fontSize: {
        "display-l": ["3.5625rem", { lineHeight: "4rem", letterSpacing: "-0.015625rem", fontWeight: "400" }],
        "display-m": ["2.8125rem", { lineHeight: "3.25rem", letterSpacing: "0", fontWeight: "400" }],
        "display-s": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "0", fontWeight: "400" }],
        "headline-l": ["2rem", { lineHeight: "2.5rem", letterSpacing: "0", fontWeight: "400" }],
        "headline-m": ["1.75rem", { lineHeight: "2.25rem", letterSpacing: "0", fontWeight: "400" }],
        "headline-s": ["1.5rem", { lineHeight: "2rem", letterSpacing: "0", fontWeight: "400" }],
        "title-l": ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "0", fontWeight: "500" }],
        "title-m": ["1rem", { lineHeight: "1.5rem", letterSpacing: "0.009375rem", fontWeight: "500" }],
        "title-s": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.00625rem", fontWeight: "500" }],
        "body-l": ["1rem", { lineHeight: "1.5rem", letterSpacing: "0.03125rem", fontWeight: "400" }],
        "body-m": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.015625rem", fontWeight: "400" }],
        "body-s": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.025rem", fontWeight: "400" }],
        "label-l": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.00625rem", fontWeight: "500" }],
        "label-m": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.03125rem", fontWeight: "500" }],
        "label-s": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.03125rem", fontWeight: "500" }],
      },
      transitionTimingFunction: {
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      boxShadow: {
        "hover-card":
          "0 1px 0 hsl(var(--border)), 0 12px 24px -8px hsl(240 12% 6% / 0.08), 0 4px 8px -4px hsl(240 12% 6% / 0.04)",
        ring: "0 0 0 1px hsl(var(--foreground) / 0.08)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
        "fade-in": "fade-in 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
