import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ToDoContent from "./ToDoContent";

const TITLE = "The To-Do List | Thoughts";
const DESCRIPTION =
  "Making a list I keep rather than one I tick: soft delete so a mis-click survives, positions assigned server-side so two adds cannot claim the same slot, and an optimistic insert that rolls back the row it added rather than the last one.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/to-do",
});

export const revalidate = 86400;

export default function ToDoThoughtsPage() {
  return <ToDoContent />;
}
