import { NextResponse, type NextRequest } from "next/server";
import { buildSearchTerm, type Publication } from "@/lib/research/pubmed";
import {
  toEuropePmcQuery,
  parseEuropePmcSearch,
  mergePublications,
} from "@/lib/research/europepmc";
import {
  searchPublications,
  europePmcSearch,
  isFailure,
} from "@/lib/research/eutils";
import { parseSources } from "@/lib/research/sources";

const CACHE_CONTROL = "public, s-maxage=21600, stale-while-revalidate=86400";
const PAGE_SIZE = 20;

/**
 * The newest papers for a topic or a journal, optionally narrowed to one or
 * more demographic facets, from both literature databases.
 *
 * Every id is resolved through the curated layer, so an unknown id is a 400
 * here rather than a hand-written search string reaching an upstream.
 *
 * PubMed is the spine: if it fails the request fails. Europe PMC is additive,
 * so when it fails the response degrades to PubMed alone and says so in
 * `sources` rather than pretending the extra index was consulted.
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
    journalName: params.get("journalName") ?? undefined,
    meshTerm: params.get("mesh") ?? undefined,
    phrase: params.get("phrase") ?? undefined,
    demoIds,
  });

  if (!term) {
    return NextResponse.json(
      { error: "Unknown or missing topic, journal, or demographic" },
      { status: 400 },
    );
  }

  const wanted = parseSources(params.get("sources"));

  const europeQuery = wanted.includes("europepmc")
    ? toEuropePmcQuery(term)
    : null;

  const [pubmed, europe] = await Promise.all([
    searchPublications(term, { limit: PAGE_SIZE }),
    europeQuery ? europePmcSearch(europeQuery, { pageSize: PAGE_SIZE }) : null,
  ]);

  if (isFailure(pubmed)) return pubmed.error;

  let extra: Publication[] = [];
  let sources: Publication["source"][] = ["pubmed"];

  if (europe !== null && !isFailure(europe)) {
    try {
      extra = parseEuropePmcSearch(europe);
      sources = ["pubmed", "europepmc"];
    } catch {
      // A shape we don't recognize is the same as not having the source.
    }
  }

  return NextResponse.json(
    {
      total: pubmed.total,
      publications: mergePublications(pubmed.publications, extra),
      sources,
    },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
