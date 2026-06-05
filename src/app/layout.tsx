import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
