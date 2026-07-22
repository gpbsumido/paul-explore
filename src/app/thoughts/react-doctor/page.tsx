import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ReactDoctorContent from "./ReactDoctorContent";

const TITLE = "React Doctor | Thoughts";
const DESCRIPTION =
  "Working through a React Doctor pass: effect cleanup, side effects in state updaters, button types, and fetch status checks — plus the fix that fought back, the false positives, and what the tool got right and wrong.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/react-doctor`,
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

export const revalidate = 86400;

export default function ReactDoctorThoughtsPage() {
  return <ReactDoctorContent />;
}
