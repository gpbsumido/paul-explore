import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { auth0 } from "@/lib/auth0";

// v1 -- dynamic so Three.js / R3F / ShaderGradient bundle only loads when ?version=v1
const LandingContentV1 = nextDynamic(() => import("./LandingContent"));
const FeatureHubV1 = nextDynamic(() => import("./FeatureHub"));

// v2 -- static import, lightweight (no 3D deps)
import LandingContentV2 from "./v2/LandingContentV2";
import FeatureHubV2 from "./v2/FeatureHubV2";

// Force dynamic rendering so Next.js never caches this page at the edge.
// Without this, a logged-in user's FeatureHub HTML could be served to
// unauthenticated visitors (e.g. links opened in Facebook Messenger's webview).
export const dynamic = "force-dynamic";

// This page is now a server component rather than a static export. It calls
// auth0.getSession() to check whether a session cookie is present and renders
// either the landing page or the authenticated hub. auth0.getSession() is a
// local cookie decrypt with no network call, so the dynamic render cost is
// negligible compared to the benefit of clean URLs -- no redirect to /protected
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

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const version = params.version;
  const isV1 = version === "v1";

  const session = await auth0.getSession();
  if (session) {
    const initialMe = {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
    };
    return isV1 ? (
      <FeatureHubV1 initialMe={initialMe} />
    ) : (
      <FeatureHubV2 initialMe={initialMe} />
    );
  }
  return isV1 ? <LandingContentV1 /> : <LandingContentV2 />;
}
