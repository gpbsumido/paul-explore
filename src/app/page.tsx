import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { auth0 } from "@/lib/auth0";
import LandingContent from "./LandingContent";
import FeatureHub from "./FeatureHub";

// Force dynamic rendering so Next.js never caches this page at the edge.
// Without this, a logged-in user's FeatureHub HTML could be served to
// unauthenticated visitors (e.g. links opened in Facebook Messenger's webview).
export const dynamic = "force-dynamic";

// This page is now a server component rather than a static export. It calls
// auth0.getSession() to check whether a session cookie is present and renders
// either the landing page or the authenticated hub. auth0.getSession() is a
// local cookie decrypt with no network call, so the dynamic render cost is
// negligible compared to the benefit of clean URLs — no redirect to /protected
// for logged-in users.
const TITLE = "Paul Sumido";
const DESCRIPTION =
  "Personal playground and portfolio — NBA stats, fantasy league history, Pokémon TCG browser, and write-ups on how it was built.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default async function Home() {
  const session = await auth0.getSession();
  if (session) {
    // Pass user info from the session so FeatureHub's header renders immediately
    // without a client-side /api/me round-trip on first paint.
    const initialMe = {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
    };
    return <FeatureHub initialMe={initialMe} />;
  }
  return <LandingContent />;
}
