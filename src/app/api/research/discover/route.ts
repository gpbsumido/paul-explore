import { NextResponse } from "next/server";
import { classifyEvidence, recentTerm } from "@/lib/research/pubmed";
import { parseMeshCounts, deriveTopics } from "@/lib/research/europepmc";
import { countAll, europePmcSearch, isFailure } from "@/lib/research/eutils";

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";
const RECENT_WINDOW_YEARS = 5;

/** How many recent papers get sampled for their MeSH headings. */
const SAMPLE_SIZE = 100;

/** A heading has to recur across the sample to count as an emerging theme. */
const MIN_RECURRENCE = 3;

export const maxDuration = 60;

/**
 * The auto-derived half of the topic list.
 *
 * Curated topics are the ones I decided were worth asking about. This route
 * asks the literature instead: it samples what vascular surgery has published
 * recently, tallies the MeSH headings, drops the boilerplate and anything a
 * curated topic already covers, and scores what's left through the same
 * evidence classifier. Whatever the field keeps tagging but hasn't
 * accumulated papers on is exactly the kind of gap worth a project.
 *
 * Europe PMC rather than PubMed because it returns MeSH as JSON; PubMed only
 * offers it as XML, which is a parser this feature doesn't need to own.
 */
export async function GET(): Promise<NextResponse> {
  const sample = await europePmcSearch(
    '(vascular surgery) AND (SRC:"MED") AND (HAS_ABSTRACT:"Y")',
    { pageSize: SAMPLE_SIZE, core: true },
  );
  if (isFailure(sample)) return sample.error;

  let derived;
  try {
    derived = deriveTopics(parseMeshCounts(sample), {
      minCount: MIN_RECURRENCE,
    });
  } catch {
    return NextResponse.json(
      { error: "Europe PMC returned an unexpected payload" },
      { status: 502 },
    );
  }

  if (derived.length === 0) {
    return NextResponse.json(
      { topics: [] },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  }

  const fromYear = new Date().getFullYear() - RECENT_WINDOW_YEARS;
  const counts = await countAll(derived, (topic) => [
    `(${topic.query})`,
    recentTerm(`(${topic.query})`, fromYear),
  ]);
  if (isFailure(counts)) return counts.error;

  const topics = derived.map((topic, i) => {
    const [total, recent] = counts[i];
    return {
      id: topic.id,
      name: topic.name,
      papers: topic.papers,
      total,
      recent,
      status: classifyEvidence({ total, recent }),
    };
  });

  return NextResponse.json(
    { topics },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
