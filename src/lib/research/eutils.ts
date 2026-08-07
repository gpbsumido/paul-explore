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
 * NCBI caps unauthenticated callers at three requests a second and answers
 * anything over it with an error rather than a queue, so a fan-out has to pace
 * itself. Three in flight, and a full second between waves.
 *
 * The first version of this counted topics rather than requests -- three topics
 * at a time, two requests each -- which was six concurrent and got the whole
 * scan rejected the moment it ran against the real API. The limit is on
 * requests, so the batching has to be too.
 *
 * Everything here sits behind a day-long CDN cache, so the wall-clock cost of
 * pacing is paid about once a day rather than per visitor.
 */
export const NCBI_MAX_CONCURRENT = 3;

/**
 * The wait is real time and there is nothing to wait for against a mocked
 * upstream, so tests run it at zero. The concurrency cap is the part that
 * carries the correctness, and that applies either way.
 */
const NCBI_WAVE_MS = process.env.NODE_ENV === "test" ? 0 : 1_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  { waveMs = NCBI_WAVE_MS }: { waveMs?: number } = {},
): Promise<number[][] | EutilsFailure> {
  const shape = items.map((item) => toTerms(item));
  const terms = shape.flat();
  const counted: (number | EutilsFailure)[] = [];

  for (let i = 0; i < terms.length; i += NCBI_MAX_CONCURRENT) {
    if (i > 0 && waveMs > 0) await wait(waveMs);
    const wave = terms.slice(i, i + NCBI_MAX_CONCURRENT);
    counted.push(...(await Promise.all(wave.map(countMatches))));
  }

  const failed = counted.find(isFailure);
  if (failed) return failed;

  let cursor = 0;
  return shape.map((group) =>
    group.map(() => counted[cursor++] as number),
  );
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
