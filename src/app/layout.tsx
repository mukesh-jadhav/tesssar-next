import type { Metadata } from "next";
import { Roboto_Flex } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CommandMenu } from "@/components/shared/CommandMenu";
import { RouteProgress } from "@/components/shared/RouteProgress";

// Material 3 Expressive — single brand typeface. Roboto Flex is the official
// M3 Expressive variable typeface and is the ONLY web font we ship for UI.
const robotoFlex = Roboto_Flex({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-display",
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
      "Production-grade cloud architectures, designed by an AI principal architect. Powered by Gemini on Vertex AI.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Tessar — AI Cloud Architect" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={robotoFlex.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Material Symbols — official Google icon font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <RouteProgress />
        {children}
        <CommandMenu />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
