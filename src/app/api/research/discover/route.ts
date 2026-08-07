import { NextResponse } from "next/server";
import { classifyEvidence, recentTerm } from "@/lib/research/pubmed";
import { parseMeshCounts, deriveTopics } from "@/lib/research/europepmc";
import { countAll, europePmcSearch, isFailure } from "@/lib/research/eutils";

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";
const RECENT_WINDOW_YEARS = 5;

/**
 * The slice of the literature to sample.
 *
 * Free-text "vascular surgery" was the obvious query and the wrong one -- it
 * matches any paper that mentions the phrase, so the first run surfaced
 * colorectal neoplasms and graft rejection as vascular research themes. Scoping
 * by MeSH instead means the sample is papers the indexers filed as vascular,
 * not papers that said the words.
 */
const SAMPLE_QUERY =
  '(MESH:"Vascular Surgical Procedures" OR MESH:"Endovascular Procedures" ' +
  'OR MESH:"Peripheral Arterial Disease" OR MESH:"Aortic Aneurysm" ' +
  'OR MESH:"Carotid Stenosis" OR MESH:"Venous Insufficiency" ' +
  'OR MESH:"Arteriovenous Shunt, Surgical" OR MESH:"Varicose Veins") ' +
  'AND (SRC:"MED") AND (HAS_ABSTRACT:"Y")';

/**
 * How many recent papers get sampled. Only about half carry MeSH headings --
 * indexing lags publication -- so this is roughly double the effective sample.
 */
const SAMPLE_SIZE = 200;

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
  const sample = await europePmcSearch(SAMPLE_QUERY, {
    pageSize: SAMPLE_SIZE,
    core: true,
  });
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
