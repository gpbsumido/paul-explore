import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ProjectReviewContent from "./ProjectReviewContent";

const TITLE = "Project Review | Thoughts";
const DESCRIPTION =
  "An honest, evidence-backed review of the whole codebase: where the engineering is weak, where the system design doesn't hold up, where architecture was overfit to one feature, and where each feature could be a better experience.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/project-review",
});

export const revalidate = 86400;

export default function ProjectReviewThoughtsPage() {
  return <ProjectReviewContent />;
}
