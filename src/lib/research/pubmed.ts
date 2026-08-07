import { z } from "zod";
import { TOPICS, JOURNALS, DEMOGRAPHICS, ALL_VASCULAR_QUERY } from "./data";

/**
 * What a real MeSH descriptor looks like: words, digits, and the comma/hyphen
 * punctuation NLM uses ("Aortic Aneurysm, Abdominal").
 *
 * Discovered topics are the one path where a search fragment originates
 * upstream rather than from the curated file, so it gets validated against this
 * before it can become part of a query. Anything else is rejected outright
 * rather than escaped, because a descriptor never needs quotes or brackets.
 */
const MESH_DESCRIPTOR = /^[A-Za-z0-9][A-Za-z0-9 ,'()\-.]{1,80}$/;

/**
 * A PubMed journal title abbreviation ("J Vasc Surg"). Custom journals are
 * typed in by hand, so they get the same treatment as a discovered MeSH term:
 * validated into a known shape rather than escaped.
 */
const JOURNAL_ABBREV = /^[A-Za-z0-9][A-Za-z0-9 .\-()]{1,60}$/;

/**
 * Pure PubMed logic: term building, payload parsing, and evidence
 * classification. No fetching here, so both the BFF routes and the client
 * (for response schemas) can import it safely.
 */

export type EvidenceStatus = "none" | "sparse" | "emerging" | "active";

/**
 * Turns raw publication counts into the label a topic card shows.
 *
 * These thresholds are calibrated against what the curated topics actually
 * return, not guessed. The first version was guessed -- zero, under 25 total,
 * everything else -- and against real data it put 20 of 25 topics in one bucket
 * while the "no research yet" badge never appeared at all. Both were wrong.
 * A recognised research area always has some literature, so a topic-level zero
 * is essentially unreachable; the real zeros live in topic-and-population
 * intersections, which the Counts tab surfaces as "0 of N". And collapsing a
 * 15-to-502 range into the single word "active" told the reader nothing.
 *
 * The observed spread of recent (five-year) counts is 4 to 502, median 74,
 * lower quartile about 20. So the bands follow the data: the bottom quartile is
 * sparse, everything below the median is emerging, the busier half is active.
 *
 * Recency leads because that is the question being asked -- is this being
 * worked on now. A topic with 824 papers all-time and six in five years is a
 * field that has moved on, and calling it crowded would be the wrong steer.
 * Zero stays its own label: an absence must never be rendered as a small
 * number.
 */
const SPARSE_RECENT_MAX = 20;
const EMERGING_RECENT_MAX = 75;

export function classifyEvidence({
  total,
  recent,
}: {
  total: number;
  recent: number;
}): EvidenceStatus {
  if (total === 0) return "none";
  if (recent < SPARSE_RECENT_MAX) return "sparse";
  if (recent < EMERGING_RECENT_MAX) return "emerging";
  return "active";
}

/**
 * Composes a PubMed search expression from curated ids. Returns null when any
 * id is unknown or nothing was asked for, so routes can 400 instead of
 * querying PubMed with a term the curated layer never defined.
 */
export function buildSearchTerm({
  topicId,
  journalId,
  journalName,
  meshTerm,
  demoIds,
}: {
  topicId?: string;
  journalId?: string;
  journalName?: string;
  meshTerm?: string;
  demoIds?: string[];
}): string | null {
  const parts: string[] = [];

  if (meshTerm !== undefined) {
    if (!MESH_DESCRIPTOR.test(meshTerm)) return null;
    parts.push(`("${meshTerm}"[mh] AND (${ALL_VASCULAR_QUERY}))`);
  }

  if (topicId) {
    const topic = TOPICS.find((t) => t.id === topicId);
    if (!topic) return null;
    parts.push(`(${topic.query})`);
  }

  if (journalId) {
    const journal = JOURNALS.find((j) => j.id === journalId);
    if (!journal) return null;
    parts.push(`("${journal.pubmedName}"[ta])`);
  }

  if (journalName !== undefined) {
    if (!JOURNAL_ABBREV.test(journalName)) return null;
    parts.push(`("${journalName}"[ta])`);
  }

  for (const id of demoIds ?? []) {
    const facet = DEMOGRAPHICS.find((d) => d.id === id);
    if (!facet) return null;
    parts.push(`(${facet.clause})`);
  }

  if (parts.length === 0) return null;

  // A population on its own would search all of PubMed for "female"[mh], which
  // is millions of papers and nothing to do with this tool. When nothing else
  // narrows the search, the field itself does.
  const narrowed = Boolean(topicId || journalId || journalName || meshTerm);
  if (!narrowed) return `(${ALL_VASCULAR_QUERY}) AND ${parts.join(" AND ")}`;

  return parts.join(" AND ");
}

/** Bounds a term to publications dated fromYear or later. */
export function recentTerm(term: string, fromYear: number): string {
  return `${term} AND ${fromYear}:3000[dp]`;
}

const esearchSchema = z.object({
  esearchresult: z.object({
    count: z.coerce.number(),
    // A rettype=count search returns the count alone, with no idlist at all.
    idlist: z.array(z.string()).default([]),
  }),
});

/** Reads the total hit count and the returned PMIDs out of an esearch response. */
export function parseEsearch(json: unknown): { count: number; ids: string[] } {
  const parsed = esearchSchema.parse(json);
  return {
    count: parsed.esearchresult.count,
    ids: parsed.esearchresult.idlist,
  };
}

const summaryItemSchema = z.object({
  uid: z.string(),
  title: z.string(),
  fulljournalname: z.string().optional(),
  pubdate: z.string().optional(),
  authors: z.array(z.object({ name: z.string() })).optional(),
  articleids: z
    .array(z.object({ idtype: z.string(), value: z.string() }))
    .optional(),
});

const esummarySchema = z.object({
  result: z.object({ uids: z.array(z.string()) }).catchall(z.unknown()),
});

export const publicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  journal: z.string(),
  pubDate: z.string(),
  authors: z.array(z.string()),
  doi: z.string().nullable(),
  url: z.string(),
  source: z.enum(["pubmed", "europepmc"]),
});

/** Which databases a publication list was actually assembled from. */
export const SOURCE_LABELS: Record<Publication["source"], string> = {
  pubmed: "PubMed",
  europepmc: "Europe PMC",
};

export type Publication = z.infer<typeof publicationSchema>;

/**
 * Normalizes an esummary response into the one publication shape the app
 * uses everywhere, regardless of upstream quirks. Optional fields degrade to
 * empty values rather than failing the whole list.
 */
export function parsePublications(json: unknown): Publication[] {
  const { result } = esummarySchema.parse(json);
  return result.uids.map((uid) => {
    const item = summaryItemSchema.parse(result[uid]);
    const doi = item.articleids?.find((a) => a.idtype === "doi")?.value ?? null;
    return {
      id: item.uid,
      title: item.title
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      journal: item.fulljournalname ?? "",
      pubDate: item.pubdate ?? "",
      authors: (item.authors ?? []).map((a) => a.name),
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
      source: "pubmed",
    };
  });
}

/** The years a count actually covers, so the UI never has to guess. */
export const windowSchema = z.object({
  fromYear: z.number(),
  toYear: z.number(),
});

/** Response shapes of the /api/research routes, parsed on the client at the trust boundary. */
export const topicsResponseSchema = z.object({
  window: windowSchema.nullable().default(null),
  topics: z.array(
    z.object({
      id: z.string(),
      total: z.number(),
      recent: z.number(),
      status: z.enum(["none", "sparse", "emerging", "active"]),
    }),
  ),
});

export type TopicEvidence = z.infer<
  typeof topicsResponseSchema
>["topics"][number];

export const publicationsResponseSchema = z.object({
  total: z.number(),
  publications: z.array(publicationSchema),
  sources: z.array(z.enum(["pubmed", "europepmc"])).default(["pubmed"]),
});

export const discoverResponseSchema = z.object({
  topics: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      papers: z.number(),
      total: z.number(),
      recent: z.number(),
      status: z.enum(["none", "sparse", "emerging", "active"]),
    }),
  ),
});

export const journalClubResponseSchema = z.object({
  window: windowSchema.nullable().default(null),
  papers: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      journal: z.string(),
      pubDate: z.string(),
      authors: z.array(z.string()),
      doi: z.string().nullable(),
      url: z.string(),
      design: z.object({
        label: z.string(),
        caveat: z.string(),
        canSupportCausality: z.boolean(),
      }),
      innovation: z
        .object({ score: z.number(), signals: z.array(z.string()) })
        .default({ score: 0, signals: [] }),
      points: z.array(z.string()),
      questions: z.array(z.string()),
    }),
  ),
});

export const demographicsResponseSchema = z.object({
  window: windowSchema.nullable().default(null),
  facets: z.array(z.object({ id: z.string(), count: z.number() })),
});
