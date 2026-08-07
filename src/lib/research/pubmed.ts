import { z } from "zod";
import { TOPICS, JOURNALS, DEMOGRAPHICS } from "./data";

/**
 * Pure PubMed logic: term building, payload parsing, and evidence
 * classification. No fetching here, so both the BFF routes and the client
 * (for response schemas) can import it safely.
 */

export type EvidenceStatus = "none" | "sparse" | "active";

/**
 * Turns raw publication counts into the label a topic card shows.
 *
 * The thresholds are the measurable contract of the whole feature: zero papers
 * is an honest "no research yet", under 25 ever or under 10 in the recent
 * window reads as a sparse literature worth adding to, anything bigger is an
 * active field where the angle matters more than the topic.
 */
export function classifyEvidence({
  total,
  recent,
}: {
  total: number;
  recent: number;
}): EvidenceStatus {
  if (total === 0) return "none";
  if (total < 25 || recent < 10) return "sparse";
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
  demoIds,
}: {
  topicId?: string;
  journalId?: string;
  demoIds?: string[];
}): string | null {
  const parts: string[] = [];

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

  for (const id of demoIds ?? []) {
    const facet = DEMOGRAPHICS.find((d) => d.id === id);
    if (!facet) return null;
    parts.push(`(${facet.clause})`);
  }

  if (parts.length === 0) return null;
  return parts.join(" AND ");
}

/** Bounds a term to publications dated fromYear or later. */
export function recentTerm(term: string, fromYear: number): string {
  return `${term} AND ${fromYear}:3000[dp]`;
}

const esearchSchema = z.object({
  esearchresult: z.object({
    count: z.coerce.number(),
    idlist: z.array(z.string()),
  }),
});

/** Reads the total hit count and the returned PMIDs out of an esearch response. */
export function parseEsearch(json: unknown): { count: number; ids: string[] } {
  const parsed = esearchSchema.parse(json);
  return { count: parsed.esearchresult.count, ids: parsed.esearchresult.idlist };
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
  result: z
    .object({ uids: z.array(z.string()) })
    .catchall(z.unknown()),
});

export const publicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  journal: z.string(),
  pubDate: z.string(),
  authors: z.array(z.string()),
  doi: z.string().nullable(),
  url: z.string(),
  source: z.literal("pubmed"),
});

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
    const doi =
      item.articleids?.find((a) => a.idtype === "doi")?.value ?? null;
    return {
      id: item.uid,
      title: item.title,
      journal: item.fulljournalname ?? "",
      pubDate: item.pubdate ?? "",
      authors: (item.authors ?? []).map((a) => a.name),
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
      source: "pubmed",
    };
  });
}

/** Response shapes of the /api/research routes, parsed on the client at the trust boundary. */
export const topicsResponseSchema = z.object({
  topics: z.array(
    z.object({
      id: z.string(),
      total: z.number(),
      recent: z.number(),
      status: z.enum(["none", "sparse", "active"]),
    }),
  ),
});

export type TopicEvidence = z.infer<
  typeof topicsResponseSchema
>["topics"][number];

export const publicationsResponseSchema = z.object({
  total: z.number(),
  publications: z.array(publicationSchema),
});

export const demographicsResponseSchema = z.object({
  facets: z.array(z.object({ id: z.string(), count: z.number() })),
});
