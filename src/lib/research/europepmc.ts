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
    .object({
      meshHeading: z.array(
        z.object({
          descriptorName: z.string(),
          majorTopic_YN: z.string().optional(),
        }),
      ),
    })
    .optional(),
});

const searchSchema = z.object({
  hitCount: z.number(),
  resultList: z.object({ result: z.array(searchResultSchema) }),
});

export type EuropePmcRecord = z.infer<typeof searchResultSchema>;

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/**
 * A sortable number for the date shapes the two sources actually emit:
 * "2026-06-23" from Europe PMC, "2026 Feb" or a bare "2025" from PubMed.
 *
 * Returns 0 for anything unparseable, which sorts it last rather than throwing
 * away the record.
 */
export function pubDateOrder(pubDate: string): number {
  const iso = pubDate.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (iso) {
    return (
      Number(iso[1]) * 10000 + Number(iso[2]) * 100 + Number(iso[3] ?? "0")
    );
  }

  const named = pubDate.match(/^(\d{4})(?:\s+([A-Za-z]{3}))?(?:\s+(\d{1,2}))?/);
  if (named) {
    const month = named[2] ? (MONTHS[named[2].toLowerCase()] ?? 0) : 0;
    return Number(named[1]) * 10000 + month * 100 + Number(named[3] ?? "0");
  }

  return 0;
}

/**
 * Titles arrive with markup in them -- Europe PMC escapes it
 * ("&lt;i&gt;Escherichia coli&lt;/i&gt;") and PubMed sometimes sends it raw.
 * Either way it is formatting, not content, and it belongs nowhere near a
 * rendered title.
 */
function cleanTitle(title: string): string {
  return title
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parses a Europe PMC search response into the shared publication shape. */
export function parseEuropePmcSearch(json: unknown): Publication[] {
  const parsed = searchSchema.parse(json);
  return parsed.resultList.result.map((r) => ({
    id: `europepmc-${r.id}`,
    title: cleanTitle(r.title),
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
 * pasted straight into PubMed and audited -- but Europe PMC has its own fields,
 * and the first version of this simply stripped the tags. That was a mistake I
 * only saw against real data: an unfielded Europe PMC term matches the whole
 * document, so ANDing ordinary words like "screening" and "female" returned
 * papers that merely mention them somewhere. A search for AAA screening in
 * women came back with knee arthroplasty and hepatitis B.
 *
 * Each term is now scoped to title and abstract, which is the closest
 * equivalent of PubMed's [tiab] and what [mh] is really standing in for. On the
 * AAA query that took Europe PMC from 6,041 hits to 240, and the top results
 * from unrelated to exactly on topic.
 *
 * Journal keeps a real translation because Europe PMC has an exact equivalent,
 * and the date clause is dropped since results are already sorted newest-first.
 * Returns null when nothing survives, so the caller skips the source rather
 * than sending an empty query.
 */
export function toEuropePmcQuery(term: string): string | null {
  const withoutDates = term
    .replace(/\s*AND\s*\d{4}:\d{4}\[dp\]/gi, "")
    .replace(/\d{4}:\d{4}\[dp\]/gi, "")
    .trim();

  const groups = withoutDates
    .split(/\s+AND\s+/)
    .map((group) =>
      group
        .trim()
        .replace(/^\(+|\)+$/g, "")
        .trim(),
    )
    .filter(Boolean)
    .map((group) => {
      const clauses = group
        .split(/\s+OR\s+/)
        .map((clause) => clause.trim())
        .filter(Boolean)
        .map((clause) => {
          const journal = clause.match(/^"([^"]+)"\[ta\]$/i);
          if (journal) return `JOURNAL:"${journal[1]}"`;

          const bare = clause
            .replace(/\[[a-z]+\]/gi, "")
            .replace(/^"|"$/g, "")
            .trim();
          if (!bare) return null;
          return `TITLE:"${bare}" OR ABSTRACT:"${bare}"`;
        })
        .filter((c): c is string => c !== null);

      return clauses.length > 0 ? `(${clauses.join(" OR ")})` : null;
    })
    .filter((g): g is string => g !== null);

  return groups.length > 0 ? groups.join(" AND ") : null;
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

  // Appending Europe PMC after PubMed left a 2026 preprint sitting below a 2004
  // paper under a heading that said "newest first". Sort the union.
  return [...pubmed, ...extra].sort(
    (a, b) => pubDateOrder(b.pubDate) - pubDateOrder(a.pubDate),
  );
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
  "Reproducibility of Results",
  "Sensitivity and Specificity",
  "Predictive Value of Tests",
  "Severity of Illness Index",
  "Quality of Life",
  "Incidence",
  "Prevalence",
  "Randomized Controlled Trials as Topic",
  "Clinical Trials as Topic",
  "Practice Guidelines as Topic",
  "Systematic Reviews as Topic",
  // Organisms and preclinical models. A mouse study is real research and not
  // the kind of project this tool exists to suggest.
  "Animals",
  "Mice",
  "Rats",
  "Rabbits",
  "Swine",
  "Dogs",
  "Sheep",
  "Disease Models, Animal",
  "Mice, Inbred C57BL",
  "Cells, Cultured",
  // Geographies. A country is where the cohort lived, never what the paper is
  // about, and they rank high enough to crowd out real themes.
  "China",
  "United States",
  "Japan",
  "Germany",
  "Italy",
  "France",
  "United Kingdom",
  "Netherlands",
  "Sweden",
  "Canada",
  "Australia",
  "India",
  "Brazil",
  "Korea",
  "Republic of Korea",
  "Spain",
  "Denmark",
  "Europe",
  "Taiwan",
  "Turkey",
]);

/**
 * Tallies the MeSH headings across the sampled papers, counting only what each
 * paper is actually about.
 *
 * NLM marks a heading as a major topic when it's central to the paper rather
 * than incidental, and that flag does almost all the work here. Counting every
 * heading surfaced "Mice", "China", and "Acute Kidney Injury" as top vascular
 * research topics -- all true tags, none of them what those papers were about.
 * Animal studies are dropped whole, since a preclinical mouse model isn't a
 * project a resident picks up.
 */
export function parseMeshCounts(json: unknown): Map<string, number> {
  const counts = new Map<string, number>();

  for (const record of parseEuropePmcRecords(json)) {
    const headings = record.meshHeadingList?.meshHeading ?? [];
    const isAnimalStudy = headings.some(
      (h) => h.descriptorName === "Animals" || h.descriptorName === "Mice",
    );
    if (isAnimalStudy) continue;

    for (const heading of headings) {
      if (heading.majorTopic_YN === "N") continue;
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
