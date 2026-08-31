import { NextResponse, type NextRequest } from "next/server";
import { TOPICS, DEMOGRAPHICS } from "@/lib/research/data";
import {
  buildSearchTerm,
  classifyEvidence,
  recentTerm,
} from "@/lib/research/pubmed";
import { countAll, isFailure } from "@/lib/research/eutils";

/** Publications this recent count toward whether a field is still moving. */
const RECENT_WINDOW_YEARS = 5;

/** A day at the CDN, a week of stale-while-revalidate. PubMed sees ~1 scan a day. */
const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

// Two counts per topic, paced under NCBI's rate limit, so the full scan needs room.
export const maxDuration = 60;

/**
 * The evidence scan behind the topic list: for every curated topic, how much
 * has ever been published and how much of it is recent, turned into a
 * none/sparse/active status.
 *
 * With `?demo=<facet>` the same scan runs scoped to one population, which is
 * what the Counts tab compares against the unscoped numbers. The facet is
 * resolved through the curated layer, so an unknown id is a 400 rather than a
 * hand-written clause reaching PubMed.
 *
 * The year window is computed per request rather than pinned, so "recent" keeps
 * meaning recent without anyone editing a constant.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const demoId = request.nextUrl.searchParams.get("demo");

  let scope = "";
  if (demoId) {
    const facet = DEMOGRAPHICS.find((d) => d.id === demoId);
    if (!facet) {
      return NextResponse.json(
        { error: "Unknown demographic" },
        { status: 400 },
      );
    }
    scope = ` AND (${facet.clause})`;
  }

  const fromYear = new Date().getFullYear() - RECENT_WINDOW_YEARS;

  // A custom topic -- a typed-in phrase or a MeSH descriptor -- is scored on
  // its own rather than joining the full scan: it is personal to one reader,
  // so it gets its own cacheable URL instead of invalidating the shared
  // all-topics entry.
  const phrase = request.nextUrl.searchParams.get("phrase");
  const mesh = request.nextUrl.searchParams.get("mesh");
  if (phrase !== null || mesh !== null) {
    const term = buildSearchTerm({
      phrase: phrase ?? undefined,
      meshTerm: mesh ?? undefined,
    });
    if (!term) {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }
    const scoped = `${term}${scope}`;
    const customCounts = await countAll([scoped], () => [
      scoped,
      recentTerm(scoped, fromYear),
    ]);
    if (isFailure(customCounts)) return customCounts.error;
    const [total, recent] = customCounts[0];
    return NextResponse.json(
      {
        topics: [
          { id: "custom", total, recent, status: classifyEvidence({ total, recent }) },
        ],
        window: { fromYear, toYear: new Date().getFullYear() },
      },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  }

  const counts = await countAll(TOPICS, (topic) => {
    const term = `(${topic.query})${scope}`;
    return [term, recentTerm(term, fromYear)];
  });

  if (isFailure(counts)) return counts.error;

  const topics = TOPICS.map((topic, i) => {
    const [total, recent] = counts[i];
    return {
      id: topic.id,
      total,
      recent,
      status: classifyEvidence({ total, recent }),
    };
  });

  return NextResponse.json(
    // The window is reported rather than left for the UI to infer, so "recent"
    // always names the actual years it counted.
    { topics, window: { fromYear, toYear: new Date().getFullYear() } },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
