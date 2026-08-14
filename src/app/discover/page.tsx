import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { auth0 } from "@/lib/auth0";
import VersionBanner from "../v2/VersionBanner";
import { archiveLabel, isArchived, type ArchivedVersion } from "./archive";

// ---------------------------------------------------------------------------
// Version registry
// ---------------------------------------------------------------------------
// Each version maps to a Landing (guest) and Hub (authenticated) component.
// Every one of them is history now: v5 owns / , so nothing here is the current
// landing and all four carry the archive banner. v4 is the default when no
// ?version= param is present, since it is the one that just retired.
// Use next/dynamic throughout to keep four generations of deps out of the
// default bundle.

type MeData = { name: string | null; email: string | null };

const DEFAULT_VERSION = "v4";

const VERSIONS = {
  v1: {
    Landing: nextDynamic(() => import("../LandingContent")),
    Hub: nextDynamic(() => import("../FeatureHub")),
  },
  v2: {
    Landing: nextDynamic(() => import("../v2/LandingContentV2")),
    Hub: nextDynamic(() => import("../v2/FeatureHubV2")),
  },
  v3: {
    Landing: nextDynamic(() => import("../v3/LandingContentV3")),
    Hub: nextDynamic(() => import("../v3/FeatureHubV3")),
  },
  v4: {
    Landing: nextDynamic(() => import("../v4/LandingContentV4")),
    Hub: nextDynamic(() => import("../v4/FeatureHubV4")),
  },
} satisfies Record<
  string,
  {
    Landing: React.ComponentType;
    Hub: React.ComponentType<{ initialMe?: MeData }>;
  }
>;

/** Reads the ?version= param, falling back to the newest retired one for anything unknown. */
function resolveVersion(param: string | string[] | undefined): ArchivedVersion {
  return typeof param === "string" && isArchived(param)
    ? param
    : DEFAULT_VERSION;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// Force dynamic rendering so Next.js never caches this page at the edge.
// Without this, a logged-in user's FeatureHub HTML could be served to
// unauthenticated visitors (e.g. links opened in Facebook Messenger's webview).
export const dynamic = "force-dynamic";

const TITLE = "Discover";
const DESCRIPTION =
  "Spin the slot machine for anything on this site, then rewind through every landing page this domain has had. The current one lives at the root.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/discover" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/discover`,
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

/**
 * The landing page museum. Renders whichever generation ?version= asks for,
 * defaulting to the current one, in its guest or signed-in form.
 */
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const version = resolveVersion(params.version);
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

  // Every generation here is history, v4 included, so all of them get the
  // banner. It reads as a caption on a museum label rather than a warning that
  // you took a wrong turn.
  return (
    <>
      <VersionBanner version={version} label={archiveLabel(version)} />
      <div className="pt-8">{content}</div>
    </>
  );
}
