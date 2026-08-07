import { NextResponse } from "next/server";
import { TOPICS } from "@/lib/research/data";
import { classifyEvidence, recentTerm } from "@/lib/research/pubmed";
import { countAll, isFailure } from "@/lib/research/eutils";

/** Publications this recent count toward whether a field is still moving. */
const RECENT_WINDOW_YEARS = 5;

/** A day at the CDN, a week of stale-while-revalidate. PubMed sees ~1 scan a day. */
const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

// Two counts per topic, batched three at a time, so the full scan needs room.
export const maxDuration = 60;

/**
 * The evidence scan behind the topic list: for every curated topic, how much
 * has ever been published and how much of it is recent, turned into a
 * none/sparse/active status.
 *
 * The year window is computed per request rather than pinned, so "recent"
 * keeps meaning recent without anyone editing a constant.
 */
export async function GET(): Promise<NextResponse> {
  const fromYear = new Date().getFullYear() - RECENT_WINDOW_YEARS;

  const counts = await countAll(TOPICS, (topic) => {
    const term = `(${topic.query})`;
    return [term, recentTerm(term, fromYear)];
  });

  if (isFailure(counts)) return counts.error;

  const topics = TOPICS.map((topic, i) => {
    const [total, recent] = counts[i];
    return { id: topic.id, total, recent, status: classifyEvidence({ total, recent }) };
  });

  return NextResponse.json(
    { topics },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
