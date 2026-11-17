import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import MindReaderContent from "./MindReaderContent";

const TITLE = "The Mind Reader";
const DESCRIPTION =
  "A two-player party game built in Svelte: one of you is dealt a secret role or relationship, drops hints in normal conversation, and the other has five minutes to work out what it is. Over 200 roles.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/mind-reader`,
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

// Static: the deck ships in the bundle and every round is client state.
export const revalidate = 86400;

export default function MindReaderPage() {
  return <MindReaderContent />;
}
