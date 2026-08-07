import { NextResponse, type NextRequest } from "next/server";
import { DEMOGRAPHICS, TOPICS, ALL_VASCULAR_QUERY } from "@/lib/research/data";
import { countAll, isFailure } from "@/lib/research/eutils";

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

export const maxDuration = 60;

/**
 * How much of the literature on a topic actually studied each population.
 *
 * A facet with a count near zero is the finding: it means the papers exist but
 * nobody looked at those patients. With no topic the scope is vascular surgery
 * as a whole, which is the field-level version of the same question.
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

  const counts = await countAll(DEMOGRAPHICS, (facet) => [
    `(${scope}) AND (${facet.clause})`,
  ]);

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
