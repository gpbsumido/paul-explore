import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ParticlesContent from "./ParticlesContent";

const TITLE = "A Particle Field That Stays Cheap | Thoughts";
const DESCRIPTION =
  "The particle lab draws a few thousand points and the lines between them at sixty frames a second. Why it is two BufferGeometry point clouds rather than a mesh per particle, and what the neighbour-line pass costs.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/particles",
});

export const revalidate = 86400;

export default function ParticlesThoughtsPage() {
  return <ParticlesContent />;
}
