import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ProjectReviewContent from "./ProjectReviewContent";

const TITLE = "Project Review | Thoughts";
const DESCRIPTION =
  "An honest, evidence-backed review of the whole codebase: where the engineering is weak, where the system design doesn't hold up, where architecture was overfit to one feature, and where each feature could be a better experience.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/project-review`,
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

export default function ProjectReviewThoughtsPage() {
  return <ProjectReviewContent />;
}
