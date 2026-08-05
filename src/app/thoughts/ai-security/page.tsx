import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import AiSecurityContent from "./AiSecurityContent";

const TITLE = "AI Security & Bare Repo Attacks | Thoughts";
const DESCRIPTION =
  "Bare repository attacks via CLAUDE.md prompt injection, hardening AI agent permissions with least-privilege configs, and running untrusted code in disposable sandboxes.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/ai-security",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function AiSecurityThoughtsPage() {
  return <AiSecurityContent />;
}
