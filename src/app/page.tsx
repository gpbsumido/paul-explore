import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { auth0 } from "@/lib/auth0";
import VersionBanner from "./v2/VersionBanner";

// ---------------------------------------------------------------------------
// Version registry
// ---------------------------------------------------------------------------
// Each version maps to a Landing (guest) and Hub (authenticated) component.
// The current version is the default when no ?version= param is present.
// Older versions get a banner prompting users to switch to current.
// Use next/dynamic for retired versions to keep their deps out of the
// default bundle.

import LandingContentV3 from "./v3/LandingContentV3";
import FeatureHubV3 from "./v3/FeatureHubV3";

type MeData = { name: string | null; email: string | null };

const CURRENT_VERSION = "v3";

const VERSIONS = {
  v1: {
    Landing: nextDynamic(() => import("./LandingContent")),
    Hub: nextDynamic(() => import("./FeatureHub")),
  },
  v2: {
    Landing: nextDynamic(() => import("./v2/LandingContentV2")),
    Hub: nextDynamic(() => import("./v2/FeatureHubV2")),
  },
  v3: {
    Landing: LandingContentV3,
    Hub: FeatureHubV3,
  },
} satisfies Record<
  string,
  {
    Landing: React.ComponentType;
    Hub: React.ComponentType<{ initialMe?: MeData }>;
  }
>;

type Version = keyof typeof VERSIONS;

function resolveVersion(param: string | string[] | undefined): Version {
  return typeof param === "string" && param in VERSIONS
    ? (param as Version)
    : CURRENT_VERSION;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const version = resolveVersion(params.version);
  const isOldVersion = version !== CURRENT_VERSION;
  const { Landing, Hub } = VERSIONS[version];

  const session = await auth0.getSession();

  const content = session ? (
    <Hub
      initialMe={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      }}
    />
  ) : (
    <Landing />
  );

  if (isOldVersion) {
    return (
      <>
        <VersionBanner version={version} />
        <div className="pt-8">{content}</div>
      </>
    );
  }

  return content;
}
