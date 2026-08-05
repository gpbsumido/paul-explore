import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import AgentPatternsContent from "./AgentPatternsContent";

const TITLE = "AI Agent Patterns | Thoughts";
const DESCRIPTION =
  "Building streaming AI agent UIs — SSE parsing, state machines, streaming markdown, tool call displays, approval gates, auto-scroll, error handling, and performance at 50 tokens/sec.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/ai-agent-patterns",
});

export const revalidate = 86400;

export default function AgentPatternsThoughtsPage() {
  return <AgentPatternsContent />;
}
