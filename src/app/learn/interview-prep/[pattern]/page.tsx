import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildArticleMetadata } from "@/lib/site";
import { PATTERNS, patternById } from "@/lib/leetcode/patterns";
import { patternPath } from "@/lib/leetcode/urls";
import PatternContent from "./PatternContent";
import { patternPageProps } from "./patternPageProps";

/** The catalogue is static data, so every pattern page is built ahead of time and anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams(): { pattern: string }[] {
  return PATTERNS.map((p) => ({ pattern: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ pattern: string }> }): Promise<Metadata> {
  const { pattern: id } = await params;
  const pattern = patternById(id);
  if (!pattern) return {};
  return buildArticleMetadata({
    title: `${pattern.name} | Interview prep`,
    description: `${pattern.tagline} The wording that gives it away, a JavaScript template, and ${pattern.problems.length} LeetCode problems from easy to hard.`,
    path: patternPath(pattern.id),
  });
}

export default async function PatternPage({ params }: { params: Promise<{ pattern: string }> }) {
  const { pattern: id } = await params;
  if (!patternById(id)) notFound();
  return <PatternContent {...patternPageProps(id)} />;
}
