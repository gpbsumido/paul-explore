import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { auth0 } from "@/lib/auth0";
import LandingContentV4 from "./v4/LandingContentV4";
import FeatureHubV4 from "./v4/FeatureHubV4";

// Force dynamic rendering so Next.js never caches this page at the edge.
// Without this, a logged-in user's FeatureHub HTML could be served to
// unauthenticated visitors (e.g. links opened in Facebook Messenger's webview).
export const dynamic = "force-dynamic";

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

/**
 * The landing page. Renders the current generation only. Every retired one, and
 * the ?version= switch between them, lives at /discover.
 */
export default async function Home() {
  const session = await auth0.getSession();

  if (!session) return <LandingContentV4 />;

  return (
    <FeatureHubV4
      initialMe={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      }}
    />
  );
}
