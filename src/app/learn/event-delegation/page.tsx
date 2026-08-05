import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const EventDelegationContent = dynamic(
  () => import("./EventDelegationContent"),
);

const TITLE = "Event Delegation";
const DESCRIPTION =
  "Attach one handler to the parent instead of one per child. Interactive bubbling visualizer, cost comparison, dynamic list demo, and capture vs bubble diagram.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/event-delegation",
  ogType: "website",
});

export default function EventDelegationPage() {
  return <EventDelegationContent />;
}
