import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const AgentPatternsContent = dynamic(() => import("./AgentPatternsContent"));

const TITLE = "AI Agent Patterns";
const DESCRIPTION =
  "SSE parsing, streaming text rendering, state machines, tool call displays, approval gates, auto-scroll, and the UI components that make agent features work.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/ai-agent-patterns",
  ogType: "website",
});

export default function AgentPatternsPage() {
  return <AgentPatternsContent />;
}
