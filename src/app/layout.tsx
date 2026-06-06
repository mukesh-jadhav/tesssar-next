import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CommandMenu } from "@/components/shared/CommandMenu";
import { RouteProgress } from "@/components/shared/RouteProgress";
import { AppHeader } from "@/components/shared/AppHeader";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tessar.app"),
  title: {
    default: "Tessar — AI Cloud Architect",
    template: "%s · Tessar",
  },
  description:
    "Describe your system in plain English. Get a production-grade cloud architecture in minutes — diagrams, scale tiers, cost estimates, risks, and patterns. Built on Google Cloud.",
  openGraph: {
    title: "Tessar — AI Cloud Architect",
    description:
      "Production-grade cloud architectures, designed by an AI principal architect in minutes. First design free for new accounts.",
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
        <CommandMenu />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
