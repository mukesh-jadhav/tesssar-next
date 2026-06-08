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
        // ============================================================
        // Material 3 Expressive color roles
        // ============================================================
        m3: {
          primary: "hsl(var(--md-sys-color-primary))",
          "on-primary": "hsl(var(--md-sys-color-on-primary))",
          "primary-container": "hsl(var(--md-sys-color-primary-container))",
          "on-primary-container": "hsl(var(--md-sys-color-on-primary-container))",
          secondary: "hsl(var(--md-sys-color-secondary))",
          "on-secondary": "hsl(var(--md-sys-color-on-secondary))",
          "secondary-container": "hsl(var(--md-sys-color-secondary-container))",
          "on-secondary-container": "hsl(var(--md-sys-color-on-secondary-container))",
          tertiary: "hsl(var(--md-sys-color-tertiary))",
          "on-tertiary": "hsl(var(--md-sys-color-on-tertiary))",
          "tertiary-container": "hsl(var(--md-sys-color-tertiary-container))",
          "on-tertiary-container": "hsl(var(--md-sys-color-on-tertiary-container))",
          error: "hsl(var(--md-sys-color-error))",
          "on-error": "hsl(var(--md-sys-color-on-error))",
          "error-container": "hsl(var(--md-sys-color-error-container))",
          "on-error-container": "hsl(var(--md-sys-color-on-error-container))",
          surface: "hsl(var(--md-sys-color-surface))",
          "surface-dim": "hsl(var(--md-sys-color-surface-dim))",
          "surface-bright": "hsl(var(--md-sys-color-surface-bright))",
          "surface-container-lowest": "hsl(var(--md-sys-color-surface-container-lowest))",
          "surface-container-low": "hsl(var(--md-sys-color-surface-container-low))",
          "surface-container": "hsl(var(--md-sys-color-surface-container))",
          "surface-container-high": "hsl(var(--md-sys-color-surface-container-high))",
          "surface-container-highest": "hsl(var(--md-sys-color-surface-container-highest))",
          "on-surface": "hsl(var(--md-sys-color-on-surface))",
          "on-surface-variant": "hsl(var(--md-sys-color-on-surface-variant))",
          outline: "hsl(var(--md-sys-color-outline))",
          "outline-variant": "hsl(var(--md-sys-color-outline-variant))",
          "inverse-surface": "hsl(var(--md-sys-color-inverse-surface))",
          "inverse-on-surface": "hsl(var(--md-sys-color-inverse-on-surface))",
          "inverse-primary": "hsl(var(--md-sys-color-inverse-primary))",
        },
      },
      borderRadius: {
        // M3 shape scale (Expressive)
        none: "var(--md-sys-shape-corner-none)",
        xs: "var(--md-sys-shape-corner-extra-small)",
        sm: "var(--md-sys-shape-corner-small)",
        md: "var(--md-sys-shape-corner-medium)",
        lg: "var(--md-sys-shape-corner-large)",
        "lg-inc": "var(--md-sys-shape-corner-large-increased)",
        xl: "var(--md-sys-shape-corner-extra-large)",
        "xl-inc": "var(--md-sys-shape-corner-extra-large-increased)",
        "2xl": "var(--md-sys-shape-corner-extra-large-increased)",
        "3xl": "var(--md-sys-shape-corner-extra-extra-large)",
        full: "var(--md-sys-shape-corner-full)",
      },
      fontFamily: {
        sans:    ["var(--font-ui)", "Manrope", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Bricolage Grotesque", "Manrope", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        serif:   ["var(--font-serif)", "Instrument Serif", "Georgia", "serif"],
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
        // ===== Material 3 Expressive motion physics =====
        "m3-fast-spatial": "cubic-bezier(0.42, 1.67, 0.21, 0.90)",
        "m3-default-spatial": "cubic-bezier(0.38, 1.21, 0.22, 1.00)",
        "m3-slow-spatial": "cubic-bezier(0.39, 1.29, 0.35, 0.98)",
        "m3-fast-effects": "cubic-bezier(0.31, 0.94, 0.34, 1.00)",
        "m3-default-effects": "cubic-bezier(0.34, 0.80, 0.34, 1.00)",
        "m3-slow-effects": "cubic-bezier(0.34, 0.88, 0.34, 1.00)",
        "m3-standard": "cubic-bezier(0.2, 0, 0, 1)",
        "m3-emphasized": "cubic-bezier(0.2, 0, 0, 1)",
        "m3-emphasized-accelerate": "cubic-bezier(0.3, 0, 0.8, 0.15)",
        "m3-emphasized-decelerate": "cubic-bezier(0.05, 0.7, 0.1, 1)",
        // legacy aliases — wired to expressive equivalents
        "out-quart": "cubic-bezier(0.34, 0.80, 0.34, 1.00)",
        "out-expo": "cubic-bezier(0.38, 1.21, 0.22, 1.00)",
        spring: "cubic-bezier(0.42, 1.67, 0.21, 0.90)",
      },
      transitionDuration: {
        "m3-fast-effects": "150ms",
        "m3-default-effects": "200ms",
        "m3-slow-effects": "300ms",
        "m3-fast-spatial": "350ms",
        "m3-default-spatial": "500ms",
        "m3-slow-spatial": "650ms",
        // Editorial motion scale (Phase 0). Use these for new work; M3 set above kept for legacy.
        instant: "80ms",
        fast: "180ms",
        base: "280ms",
        slow: "480ms",
        cinematic: "800ms",
      },
      transitionDelay: {
        stagger: "80ms",
        "stagger-sm": "40ms",
        "stagger-lg": "120ms",
      },
      boxShadow: {
        // M3 Expressive 3 — flat. All elevation collapses to none.
        // Hierarchy comes from surface tones + borders, never shadows.
        "hover-card": "none",
        ring: "0 0 0 1px hsl(var(--md-sys-color-outline-variant))",
        "m3-1": "none",
        "m3-2": "none",
        "m3-3": "none",
        "m3-4": "none",
        "m3-5": "none",
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
        "status-ping": {
          "0%":   { transform: "scale(1)",   opacity: "0.6" },
          "80%":  { transform: "scale(2.4)", opacity: "0" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
        "fade-in": "fade-in 0.4s ease-out",
        "status-ping": "status-ping 2.6s cubic-bezier(0.16, 1, 0.3, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
