import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { parseEsearch, parsePublications, type Publication } from "./pubmed";

/**
 * Server-only clients for the two literature databases: NCBI E-utilities and
 * Europe PMC. Kept out of modules that client components import, same rule as
 * the other route helpers in this repo.
 */

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const EUROPE_PMC = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

/**
 * NCBI asks unauthenticated callers to stay under three requests a second, so
 * fan-outs run three at a time rather than all at once. Everything here sits
 * behind a day-long CDN cache, so the wall-clock cost is paid roughly once.
 */
const BATCH_SIZE = 3;

/** A transport failure, kept as a value so callers stay flat and can 502/504. */
export type EutilsFailure = { error: NextResponse };

const isFailure = (v: unknown): v is EutilsFailure =>
  typeof v === "object" && v !== null && "error" in v;

async function getJson(url: string): Promise<unknown | EutilsFailure> {
  const result = await fetchUpstream(url, { timeoutMs: 10_000 });
  if (!result.ok) return { error: upstreamErrorResponse(result) };
  if (!result.response.ok) {
    return {
      error: NextResponse.json(
        { error: "PubMed rejected the search" },
        { status: 502 },
      ),
    };
  }
  try {
    return await result.response.json();
  } catch {
    return {
      error: NextResponse.json(
        { error: "PubMed returned an unreadable response" },
        { status: 502 },
      ),
    };
  }
}

/** How many PubMed records match a term. */
export async function countMatches(
  term: string,
): Promise<number | EutilsFailure> {
  const url = `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&rettype=count&retmax=0&term=${encodeURIComponent(term)}`;
  const json = await getJson(url);
  if (isFailure(json)) return json;
  try {
    return parseEsearch(json).count;
  } catch {
    return {
      error: NextResponse.json(
        { error: "PubMed returned an unexpected search payload" },
        { status: 502 },
      ),
    };
  }
}

/**
 * The newest publications matching a term, normalized. Searches for ids then
 * fetches their summaries, skipping the second call entirely when nothing
 * matched -- a topic with no literature is the point of the feature, not an
 * error, and it should cost one request.
 */
export async function searchPublications(
  term: string,
  { limit = 20 }: { limit?: number } = {},
): Promise<{ total: number; publications: Publication[] } | EutilsFailure> {
  const searchUrl = `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&sort=date&retmax=${limit}&term=${encodeURIComponent(term)}`;
  const searchJson = await getJson(searchUrl);
  if (isFailure(searchJson)) return searchJson;

  let search: { count: number; ids: string[] };
  try {
    search = parseEsearch(searchJson);
  } catch {
    return {
      error: NextResponse.json(
        { error: "PubMed returned an unexpected search payload" },
        { status: 502 },
      ),
    };
  }

  if (search.ids.length === 0) return { total: search.count, publications: [] };

  const summaryUrl = `${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id=${search.ids.join(",")}`;
  const summaryJson = await getJson(summaryUrl);
  if (isFailure(summaryJson)) return summaryJson;

  try {
    return { total: search.count, publications: parsePublications(summaryJson) };
  } catch {
    return {
      error: NextResponse.json(
        { error: "PubMed returned an unexpected summary payload" },
        { status: 502 },
      ),
    };
  }
}

/**
 * Runs count queries for many terms in small batches. One failure fails the
 * whole scan: a page that silently renders some topics as "no research" when
 * PubMed was merely unreachable would be worse than an error.
 */
export async function countAll<T>(
  items: T[],
  toTerms: (item: T) => string[],
): Promise<number[][] | EutilsFailure> {
  const results: number[][] = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const counted = await Promise.all(
      batch.map(async (item) => {
        const counts = await Promise.all(toTerms(item).map(countMatches));
        return counts;
      }),
    );
    for (const counts of counted) {
      const failed = counts.find(isFailure);
      if (failed) return failed;
      results.push(counts as number[]);
    }
  }

  return results;
}

/**
 * Europe PMC search. `resultType=core` is what carries the MeSH headings, and
 * it's the only reason topic discovery is possible without parsing PubMed XML.
 */
export async function europePmcSearch(
  query: string,
  { pageSize = 25, core = false }: { pageSize?: number; core?: boolean } = {},
): Promise<unknown | EutilsFailure> {
  const params = new URLSearchParams({
    query,
    format: "json",
    pageSize: String(pageSize),
    sort: "P_PDATE_D desc",
  });
  if (core) params.set("resultType", "core");
  return getJson(`${EUROPE_PMC}?${params.toString()}`);
}

export { isFailure };
