import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import CommandPaletteRoot from "@/components/CommandPalette/CommandPaletteRoot";
import AuthErrorToast from "@/components/AuthErrorToast";
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

// The display face, for page-level headings only. Geist is a good interface
// font and a slightly anonymous headline one, which is most of why every page
// here read as generated. Bricolage has real character in the counters and the
// tighter widths, and being variable means the whole optical-size and weight
// range costs one file. Body and UI stay Geist; nothing else changes.
// The CSS variable is --font-display-face, not --font-display: @theme defines
// --font-display to build the `font-display` utility, and a next/font variable
// of the same name would be a circular reference.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display-face",
  subsets: ["latin"],
  display: "swap",
});

// Fallback metadata for any page that doesn't define its own.
// Individual pages override title/description via their own metadata exports.
export const metadata: Metadata = {
  // Without this, Next resolves every relative metadata URL against localhost
  // and warns at build. It is also what makes the canonical below absolute.
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FOUC_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable}`}
      >
        {/* Skip link — visually hidden until focused. Keyboard users Tab to it
            and activate it to jump past repeated navigation to the page content. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-primary-600 focus:outline-none"
        >
          Skip to content
        </a>
        <Providers>
          <ThemeProvider>
            {/* id="main-content" is the skip link target. tabIndex={-1} allows
                programmatic focus from the skip link without making the div
                keyboard-reachable through normal Tab order. */}
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
            <CommandPaletteRoot />
            {/* Reads ?authError from the URL, so it needs a Suspense boundary. */}
            <Suspense fallback={null}>
              <AuthErrorToast />
            </Suspense>
          </ThemeProvider>
        </Providers>
        <SpeedInsights />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
