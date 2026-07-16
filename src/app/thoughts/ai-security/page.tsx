import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import AiSecurityContent from "./AiSecurityContent";

const TITLE = "AI Security & Bare Repo Attacks | Thoughts";
const DESCRIPTION =
  "Bare repository attacks via CLAUDE.md prompt injection, hardening AI agent permissions with least-privilege configs, and running untrusted code in disposable sandboxes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/ai-security`,
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

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function AiSecurityThoughtsPage() {
  return <AiSecurityContent />;
}
