import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CommandMenu } from "@/components/shared/CommandMenu";
import { RouteProgress } from "@/components/shared/RouteProgress";
import { AppHeader } from "@/components/shared/AppHeader";
import { GlobalShortcuts } from "@/components/shared/GlobalShortcuts";
import { HelpOverlay } from "@/components/shared/HelpOverlay";
import { CursorAccent } from "@/components/shared/CursorAccent";
import { ThemeScript } from "@/components/shared/ThemeScript";

// Display — modern editorial sans with SOFT axis (rounded corners) and
// variable width. The personality typeface of the whole product.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

// UI — rounded geometric workhorse (Manrope). Used for body, controls, labels.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

// Mono — for eyebrows, tags, counters, code.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// Editorial italic — used sparingly for pull quotes & magazine flourishes.
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tessar.dev"),
  title: {
    default: "Tessar — AI Cloud Architect",
    template: "%s · Tessar",
  },
  description:
    "Brief in. A 14-section, schema-validated cloud architecture out — components, diagrams, monthly cost in INR, scored risks, applied patterns, roadmap. Sized to your scale. Cloud-agnostic: GCP, AWS, or Azure.",
  openGraph: {
    title: "Tessar — AI Cloud Architect",
    description:
      "Senior cloud architect, on tap. Brief in, board-ready report out. First design free for new accounts.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Tessar — AI Cloud Architect" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${manrope.variable} ${jetbrains.variable} ${instrument.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <RouteProgress />
        <AppHeader />
        <div className="flex-1 min-h-0 flex flex-col">
          {children}
        </div>
        <GlobalShortcuts />
        <CommandMenu />
        <HelpOverlay />
        <CursorAccent />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
