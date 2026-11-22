import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import CommandPaletteRoot from "@/components/CommandPalette/CommandPaletteRoot";
import AuthErrorToast from "@/components/AuthErrorToast";
import { Providers } from "./providers";
import WebVitalsReporter from "@/components/WebVitalsReporter";
import CookieConsent from "@/components/CookieConsent";
import { SITE_URL, OG_IMAGE, SITE_DESCRIPTION } from "@/lib/site";
import { buildPrePaintThemeScript } from "@/lib/themePreference";
import "./globals.css";

// preload:false on the body face too. Above the fold it only sets the role
// line and the tagline, which paint immediately in the system fallback under
// display:swap -- so preloading it bought no earlier paint and just put a
// second high-priority font <link> on the critical path, competing for the
// throttled connection with the display face that IS the LCP element. Geist
// still loads on its own once the connection is free.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// The code/mono face. preload:false because it never appears above the fold on
// any route (it's for code blocks), so preloading it just made its <link> compete
// with the LCP font for the connection during the critical window. It still
// loads on demand where code renders.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
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
  // Request the optical-size axis so large headings get Bricolage's
  // display-tuned letterforms (paired with font-optical-sizing:auto on h1).
  axes: ["opsz"],
});

// Fallback metadata for any page that doesn't define its own.
// Individual pages override title/description via their own metadata exports.
export const metadata: Metadata = {
  // Without this, Next resolves every relative metadata URL against localhost
  // and warns at build. It is also what makes each page's relative canonical
  // absolute. No canonical or og:url here: metadata merges shallowly, so every
  // page that didn't set its own would inherit "/" and point search engines,
  // and shared-link previews, at the homepage.
  metadataBase: new URL(SITE_URL),
  title: "Paul Sumido",
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "paul-explore",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
};

// Runs synchronously before CSS or React hydration. It records whether the
// navigation began in a visible tab for WebVitalsReporter, then applies the
// saved theme before paint. Must be self-contained, no imports allowed.
const ANTI_FOUC_SCRIPT = `(function(){window.__pageStartedVisible=document.visibilityState==='visible';})();${buildPrePaintThemeScript()}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables go on <html>, not <body>. next/font's className is
    // usually put on the body, but then the variables only exist from <body>
    // down -- and @theme composes --font-display from --font-display-face at
    // :root, where it would be empty. The utility silently resolves to nothing
    // and the heading quietly stays on the body font, which is exactly what it
    // did until the rendered page was checked rather than the markup.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FOUC_SCRIPT }} />
      </head>
      <body>
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
        <CookieConsent />
      </body>
    </html>
  );
}
