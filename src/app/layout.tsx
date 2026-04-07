import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Providers } from "./providers";
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

// Runs synchronously before any CSS or React hydration so dark-mode users
// never see a light flash. Must be a self-contained IIFE — no imports allowed.
const ANTI_FOUC_SCRIPT = `(function(){try{var p=localStorage.getItem('theme-preference')||'system';var t=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FOUC_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <ThemeProvider>{children}</ThemeProvider>
        </Providers>
        <SpeedInsights />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
