import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import dynamic from "next/dynamic";

const AgentPatternsContent = dynamic(() => import("./AgentPatternsContent"));

const TITLE = "AI Agent Patterns";
const DESCRIPTION =
  "SSE parsing, streaming text rendering, state machines, tool call displays, approval gates, auto-scroll, and the UI components that make agent features work.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/ai-agent-patterns`,
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

export default function AgentPatternsPage() {
  return <AgentPatternsContent />;
}
