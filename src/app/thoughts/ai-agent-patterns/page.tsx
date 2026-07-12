import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import AgentPatternsContent from "./AgentPatternsContent";

const TITLE = "AI Agent Patterns | Thoughts";
const DESCRIPTION =
  "Building streaming AI agent UIs — SSE parsing, state machines, streaming markdown, tool call displays, approval gates, auto-scroll, error handling, and performance at 50 tokens/sec.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/ai-agent-patterns`,
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

export default function AgentPatternsThoughtsPage() {
  return <AgentPatternsContent />;
}
