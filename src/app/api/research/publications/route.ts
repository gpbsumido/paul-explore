import { NextResponse, type NextRequest } from "next/server";
import { buildSearchTerm } from "@/lib/research/pubmed";
import { searchPublications, isFailure } from "@/lib/research/eutils";

const CACHE_CONTROL = "public, s-maxage=21600, stale-while-revalidate=86400";
const PAGE_SIZE = 20;

/**
 * The newest papers for a topic or a journal, optionally narrowed to one or
 * more demographic facets.
 *
 * Every id is resolved through the curated layer, so an unknown id is a 400
 * here rather than a hand-written search string reaching PubMed.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const demoIds = (params.get("demo") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const term = buildSearchTerm({
    topicId: params.get("topic") ?? undefined,
    journalId: params.get("journal") ?? undefined,
    demoIds,
  });

  if (!term) {
    return NextResponse.json(
      { error: "Unknown or missing topic, journal, or demographic" },
      { status: 400 },
    );
  }

  const result = await searchPublications(term, { limit: PAGE_SIZE });
  if (isFailure(result)) return result.error;

  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
