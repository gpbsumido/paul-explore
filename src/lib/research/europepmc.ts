import { z } from "zod";
import { TOPICS, ALL_VASCULAR_QUERY } from "./data";
import type { Publication } from "./pubmed";

/**
 * Europe PMC as the second source. It covers preprints and some records PubMed
 * doesn't index, and unlike PubMed it returns MeSH headings as JSON rather than
 * XML, which is what makes auto-derived topics practical at all.
 */

const searchResultSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  doi: z.string().optional(),
  authorString: z.string().optional(),
  journalInfo: z
    .object({ journal: z.object({ title: z.string() }).optional() })
    .optional(),
  firstPublicationDate: z.string().optional(),
  pubYear: z.string().optional(),
  meshHeadingList: z
    .object({ meshHeading: z.array(z.object({ descriptorName: z.string() })) })
    .optional(),
});

const searchSchema = z.object({
  hitCount: z.number(),
  resultList: z.object({ result: z.array(searchResultSchema) }),
});

export type EuropePmcRecord = z.infer<typeof searchResultSchema>;

/** Parses a Europe PMC search response into the shared publication shape. */
export function parseEuropePmcSearch(json: unknown): Publication[] {
  const parsed = searchSchema.parse(json);
  return parsed.resultList.result.map((r) => ({
    id: `europepmc-${r.id}`,
    title: r.title,
    journal: r.journalInfo?.journal?.title ?? "",
    pubDate: r.firstPublicationDate ?? r.pubYear ?? "",
    authors: (r.authorString ?? "")
      .replace(/\.$/, "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
    doi: r.doi ?? null,
    url: `https://europepmc.org/article/${r.source}/${r.id}`,
    source: "europepmc" as const,
  }));
}

/** Parses only the raw records, for callers that want MeSH rather than publications. */
export function parseEuropePmcRecords(json: unknown): EuropePmcRecord[] {
  return searchSchema.parse(json).resultList.result;
}

/**
 * Rewrites a PubMed search expression into something Europe PMC understands.
 *
 * The curated queries are written in PubMed syntax on purpose -- they can be
 * pasted straight into PubMed and audited. Europe PMC has its own field tags,
 * so rather than maintaining two hand-written queries per topic, the PubMed
 * tags are stripped: an untagged term searches everything, which is broader but
 * never wrong. Journal gets a real translation because Europe PMC has an exact
 * equivalent, and the date clause is dropped since results are already sorted
 * newest-first.
 */
export function toEuropePmcQuery(term: string): string {
  return term
    .replace(/"([^"]+)"\[ta\]/gi, 'JOURNAL:"$1"')
    .replace(/\s*AND\s*\d{4}:\d{4}\[dp\]/gi, "")
    .replace(/\[[a-z]+\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

const normalizeTitle = (title: string): string =>
  title.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.]+$/, "");

/**
 * Merges the two sources into one list, PubMed first.
 *
 * A paper indexed in both places is one paper, so Europe PMC records are
 * dropped when they share a DOI with a PubMed record, or failing that a
 * normalized title. PubMed wins the tie because its metadata is the one the
 * evidence counts are computed from, and a link people already recognize.
 */
export function mergePublications(
  pubmed: Publication[],
  europepmc: Publication[],
): Publication[] {
  const seenDois = new Set(
    pubmed.map((p) => p.doi?.toLowerCase()).filter(Boolean),
  );
  const seenTitles = new Set(pubmed.map((p) => normalizeTitle(p.title)));

  const extra = europepmc.filter((p) => {
    const doi = p.doi?.toLowerCase();
    if (doi && seenDois.has(doi)) return false;
    return !seenTitles.has(normalizeTitle(p.title));
  });

  return [...pubmed, ...extra];
}

/**
 * MeSH headings that appear on nearly every clinical paper. They are true and
 * useless as topic candidates, so discovery drops them outright.
 */
export const GENERIC_MESH = new Set([
  "Humans",
  "Male",
  "Female",
  "Aged",
  "Aged, 80 and over",
  "Middle Aged",
  "Adult",
  "Young Adult",
  "Adolescent",
  "Child",
  "Animals",
  "Retrospective Studies",
  "Prospective Studies",
  "Treatment Outcome",
  "Risk Factors",
  "Time Factors",
  "Follow-Up Studies",
  "Cohort Studies",
  "Postoperative Complications",
  "Registries",
  "Databases, Factual",
  "Vascular Surgical Procedures",
  "Endovascular Procedures",
  "Blood Vessel Prosthesis Implantation",
  "Risk Assessment",
]);

/** Tallies how many of the given records carry each MeSH heading. */
export function parseMeshCounts(json: unknown): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of parseEuropePmcRecords(json)) {
    for (const heading of record.meshHeadingList?.meshHeading ?? []) {
      const name = heading.descriptorName;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return counts;
}

export type DerivedTopic = {
  id: string;
  name: string;
  /** How many of the sampled recent papers carried this heading. */
  papers: number;
  query: string;
};

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** A heading a curated topic already covers isn't a discovery. */
const alreadyCurated = (name: string): boolean => {
  const needle = name.toLowerCase();
  return TOPICS.some(
    (t) =>
      t.name.toLowerCase().includes(needle) ||
      t.query.toLowerCase().includes(needle),
  );
};

/**
 * Turns the MeSH tally into ranked topic candidates.
 *
 * This is the auto-derived half of the topic list: whatever recent vascular
 * literature keeps tagging that isn't boilerplate and isn't already a curated
 * topic. Each candidate gets the same kind of scoped query a curated topic has,
 * so it flows through the same evidence classifier and the numbers mean the
 * same thing.
 */
export function deriveTopics(
  counts: Map<string, number>,
  { minCount = 2, limit = 12 }: { minCount?: number; limit?: number } = {},
): DerivedTopic[] {
  return [...counts.entries()]
    .filter(([name, count]) => count >= minCount && !GENERIC_MESH.has(name))
    .filter(([name]) => !alreadyCurated(name))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({
      id: `mesh-${slugify(name)}`,
      name,
      papers: count,
      query: `"${name}"[mh] AND (${ALL_VASCULAR_QUERY})`,
    }));
}
