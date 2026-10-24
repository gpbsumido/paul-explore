import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import WelcomeContent from "./WelcomeContent";

const TITLE = "Welcome to EVAR Sizing";
const DESCRIPTION =
  "Practise sizing an endovascular aneurysm repair on real and synthetic CT: a short video of how a case works, an optional study of how the skill grows over training, and what the project is for.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/evar/welcome`,
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

// Who's signed in is asked in the browser, so the page itself never changes.
export const revalidate = 86400;

export default function EvarWelcomePage() {
  return <WelcomeContent />;
}
