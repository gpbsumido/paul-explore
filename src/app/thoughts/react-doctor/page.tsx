import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ReactDoctorContent from "./ReactDoctorContent";

const TITLE = "React Doctor | Thoughts";
const DESCRIPTION =
  "Working through a React Doctor pass: effect cleanup, side effects in state updaters, button types, and fetch status checks — plus the fix that fought back, the false positives, and what the tool got right and wrong.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/react-doctor",
});

export const revalidate = 86400;

export default function ReactDoctorThoughtsPage() {
  return <ReactDoctorContent />;
}
