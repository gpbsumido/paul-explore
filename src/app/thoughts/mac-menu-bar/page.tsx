import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import MacMenuBarContent from "./MacMenuBarContent";

const TITLE = "macOS Menu Bar | Thoughts";
const DESCRIPTION =
  "Turning a macOS desktop clone's static top-bar labels into a working, signal-driven menu system — a MenuBarService that derives every menu from window and dock state, real actions, and full keyboard a11y.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/mac-menu-bar",
});

export const revalidate = 86400;

export default function MacMenuBarThoughtsPage() {
  return <MacMenuBarContent />;
}
