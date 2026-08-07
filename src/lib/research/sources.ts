import type { Publication } from "./pubmed";

/**
 * The literature databases behind the explorer, described in the app rather
 * than buried in a route handler.
 *
 * Which sources answer a query is a real editorial choice -- Europe PMC brings
 * preprints, which some people want and some consider noise -- so it's exposed
 * rather than assumed.
 */
export type SourceId = Publication["source"];

export type Source = {
  id: SourceId;
  name: string;
  description: string;
  href: string;
  /** Evidence levels are computed from this source alone. */
  scoresEvidence: boolean;
};

export const SOURCES: Source[] = [
  {
    id: "pubmed",
    name: "PubMed",
    description:
      "NCBI's index of the biomedical literature, via the E-utilities API. Every evidence level on the Topics tab is counted here, so it can't be turned off.",
    href: "https://pubmed.ncbi.nlm.nih.gov/",
    scoresEvidence: true,
  },
  {
    id: "europepmc",
    name: "Europe PMC",
    description:
      "A broader index that carries preprints and records PubMed doesn't. Adds papers to the lists; never changes an evidence level.",
    href: "https://europepmc.org/",
    scoresEvidence: false,
  },
];

/** Parses a comma-separated `sources` param into the sources actually to query. */
export function parseSources(raw: string | null): SourceId[] {
  if (!raw) return SOURCES.map((s) => s.id);
  const asked = raw.split(",").map((s) => s.trim());
  const known = SOURCES.filter((s) => asked.includes(s.id)).map((s) => s.id);
  // PubMed is the spine: it carries the counts and the fallback list, so a
  // request that names only unknown sources still gets it rather than nothing.
  return known.includes("pubmed") ? known : ["pubmed", ...known];
}
