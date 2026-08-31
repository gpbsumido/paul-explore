import type { Metadata } from "next";
import { auth0 } from "@/lib/auth0";
import { buildArticleMetadata } from "@/lib/site";
import DraftLabContent from "./DraftLabContent";

const TITLE = "Draft Lab | Thoughts";
const DESCRIPTION =
  "Draft Lab — a Firefox extension that rides along inside the ESPN fantasy draft room: pick sync, tier supply, keeper handling, and live recommendations under my league's exact scoring.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/draft-lab",
});

// Reading the session per-request makes this dynamic — the Elite-tier write-up
// is rendered server-side only for the owner, so it never reaches anyone else's
// payload. The public write-up is the same for everyone.
export const dynamic = "force-dynamic";

const OWNER_EMAIL = "psumido@gmail.com";

export default async function DraftLabThoughtsPage() {
  const session = await auth0.getSession();
  const isOwner = session?.user?.email === OWNER_EMAIL;
  return <DraftLabContent isOwner={isOwner} />;
}
