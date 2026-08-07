import { NextResponse, type NextRequest } from "next/server";
import { DEMOGRAPHICS, TOPICS, ALL_VASCULAR_QUERY } from "@/lib/research/data";
import { recentTerm } from "@/lib/research/pubmed";
import { countAll, isFailure } from "@/lib/research/eutils";

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

export const maxDuration = 60;

/**
 * How much of the literature on a topic actually studied each population.
 *
 * A facet with a count near zero is the finding: it means the papers exist but
 * nobody looked at those patients. With no topic the scope is vascular surgery
 * as a whole, which is the field-level version of the same question.
 *
 * `?window=<years>` bounds the counts to recent publications. The Counts tab
 * passes 5 so a topic's split is measured over the same window as the 5-year
 * column it expands from -- an all-time split next to a 5-year total would be
 * two different questions sharing a row.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const topicId = request.nextUrl.searchParams.get("topic");

  let scope = ALL_VASCULAR_QUERY;
  if (topicId) {
    const topic = TOPICS.find((t) => t.id === topicId);
    if (!topic) {
      return NextResponse.json({ error: "Unknown topic" }, { status: 400 });
    }
    scope = topic.query;
  }

  const windowRaw = request.nextUrl.searchParams.get("window");
  const windowYears = windowRaw === null ? null : Number(windowRaw);
  if (windowYears !== null && (!Number.isFinite(windowYears) || windowYears <= 0)) {
    return NextResponse.json({ error: "Invalid window" }, { status: 400 });
  }
  const fromYear =
    windowYears === null ? null : new Date().getFullYear() - windowYears;

  const counts = await countAll(DEMOGRAPHICS, (facet) => {
    const term = `(${scope}) AND (${facet.clause})`;
    return [fromYear === null ? term : recentTerm(term, fromYear)];
  });

  if (isFailure(counts)) return counts.error;

  const facets = DEMOGRAPHICS.map((facet, i) => ({
    id: facet.id,
    count: counts[i][0],
  }));

  return NextResponse.json(
    { facets },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
