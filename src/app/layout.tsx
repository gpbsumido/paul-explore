import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import WebVitalsReporter from "@/components/WebVitalsReporter";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fallback metadata for any page that doesn't define its own.
// Individual pages override title/description via their own metadata exports.
export const metadata: Metadata = {
  title: "Paul Sumido",
  description:
    "Personal playground and portfolio — NBA stats, fantasy league history, Pokémon TCG browser, and write-ups on how it was built.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "paul-explore",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
        <SpeedInsights />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
