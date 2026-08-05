import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const StacksQueuesContent = dynamic(() => import("./StacksQueuesContent"));

const TITLE = "Stacks & Queues";
const DESCRIPTION =
  "Last in first out, first in first out. Interactive demos for push/pop, enqueue/dequeue, and Valid Parentheses.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/stacks-queues",
  ogType: "website",
});

export default function StacksQueuesPage() {
  return <StacksQueuesContent />;
}
