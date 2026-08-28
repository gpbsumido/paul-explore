import { describe, it, expect } from "vitest";
import { TOPICS, JOURNALS, DEMOGRAPHICS, TOPIC_CATEGORIES } from "./data";
import {
  classifyEvidence,
  buildSearchTerm,
  recentTerm,
  parseEsearch,
  parsePublications,
} from "./pubmed";

describe("curated data", () => {
  it("gives every topic a unique id and a non-empty PubMed query", () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    TOPICS.forEach((t) => {
      expect(t.query.trim().length).toBeGreaterThan(0);
      expect(TOPIC_CATEGORIES).toContain(t.category);
    });
  });

  it("curates a vascular trauma category whose topics are trauma-scoped", () => {
    // Typed as string so this compiles while the category doesn't exist yet.
    const traumaCategory: string = "Vascular trauma";
    expect(TOPIC_CATEGORIES).toContain(traumaCategory);
    const traumaTopics = TOPICS.filter((t) => t.category === traumaCategory);
    expect(traumaTopics.length).toBeGreaterThanOrEqual(4);
    traumaTopics.forEach((t) => {
      // Every query has to measure trauma literature, not the elective cousin.
      expect(t.query).toMatch(/trauma|injur|hemorrhage/i);
    });
  });

  it("keeps every demographic facet in one of the four lenses", () => {
    const groups = new Set(DEMOGRAPHICS.map((d) => d.group));
    expect([...groups].sort()).toEqual(
      ["Age", "Health populations", "Race & ethnicity", "Sex"].sort(),
    );
  });

  it("names real journals with their PubMed title abbreviations", () => {
    expect(JOURNALS.length).toBeGreaterThanOrEqual(6);
    JOURNALS.forEach((j) =>
      expect(j.pubmedName.trim().length).toBeGreaterThan(0),
    );
  });
});

describe("classifyEvidence", () => {
  it("labels zero publications as none", () => {
    expect(classifyEvidence({ total: 0, recent: 0 })).toBe("none");
  });

  it("labels the bottom of the field sparse", () => {
    // Calibrated against the real spread of the curated topics: recent counts
    // run 4 to 502 with a median of 74, so the lower quartile is ~20.
    expect(classifyEvidence({ total: 8, recent: 4 })).toBe("sparse");
    expect(classifyEvidence({ total: 29, recent: 19 })).toBe("sparse");
  });

  it("labels the middle emerging rather than lumping it with the busiest", () => {
    expect(classifyEvidence({ total: 38, recent: 20 })).toBe("emerging");
    expect(classifyEvidence({ total: 128, recent: 74 })).toBe("emerging");
  });

  it("reserves active for the genuinely crowded half", () => {
    expect(classifyEvidence({ total: 143, recent: 75 })).toBe("active");
    expect(classifyEvidence({ total: 786, recent: 502 })).toBe("active");
  });

  it("does not let a large all-time count hide a quiet recent five years", () => {
    // 824 papers ever but only a handful lately is not a crowded field now.
    expect(classifyEvidence({ total: 824, recent: 6 })).toBe("sparse");
  });

  it("spreads the real curated topics across every band", () => {
    // The bug this replaces: 20 of 25 topics landed in one bucket, and the
    // "none" badge was unreachable because every curated area has literature.
    const real = [
      { total: 8, recent: 4 },
      { total: 21, recent: 6 },
      { total: 22, recent: 15 },
      { total: 38, recent: 25 },
      { total: 128, recent: 81 },
      { total: 786, recent: 502 },
    ];
    const labels = new Set(real.map(classifyEvidence));
    expect(labels).toEqual(new Set(["sparse", "emerging", "active"]));
  });
});

describe("buildSearchTerm", () => {
  const topic = TOPICS[0];
  const facet = DEMOGRAPHICS[0];
  const journal = JOURNALS[0];

  it("wraps a topic query on its own", () => {
    expect(buildSearchTerm({ topicId: topic.id })).toBe(`(${topic.query})`);
  });

  it("ANDs demographic clauses onto the topic", () => {
    expect(buildSearchTerm({ topicId: topic.id, demoIds: [facet.id] })).toBe(
      `(${topic.query}) AND (${facet.clause})`,
    );
  });

  it("scopes to a curated journal by its PubMed title abbreviation", () => {
    expect(buildSearchTerm({ journalId: journal.id })).toBe(
      `("${journal.pubmedName}"[ta])`,
    );
  });

  it("returns null for ids it does not know", () => {
    expect(buildSearchTerm({ topicId: "not-a-topic" })).toBeNull();
    expect(
      buildSearchTerm({ topicId: topic.id, demoIds: ["not-a-facet"] }),
    ).toBeNull();
    expect(buildSearchTerm({})).toBeNull();
  });

  it("bounds a term to recent years for the recency count", () => {
    expect(recentTerm("(aaa)", 2021)).toBe("(aaa) AND 2021:3000[dp]");
  });
});

describe("PubMed payload parsing", () => {
  it("reads count and ids out of an esearch response", () => {
    const parsed = parseEsearch({
      esearchresult: { count: "42", idlist: ["101", "202"] },
    });
    expect(parsed).toEqual({ count: 42, ids: ["101", "202"] });
  });

  it("reads a count-only response, which is what rettype=count actually returns", () => {
    expect(parseEsearch({ esearchresult: { count: "87068" } })).toEqual({
      count: 87068,
      ids: [],
    });
  });

  it("rejects a payload that is not an esearch response", () => {
    expect(() => parseEsearch({ nope: true })).toThrow();
  });

  it("normalizes an esummary response into uniform publications", () => {
    const publications = parsePublications({
      result: {
        uids: ["101"],
        "101": {
          uid: "101",
          title: "Sex differences in AAA repair outcomes.",
          fulljournalname: "Journal of Vascular Surgery",
          pubdate: "2026 Mar",
          authors: [{ name: "Smith J" }, { name: "Lee A" }],
          articleids: [{ idtype: "doi", value: "10.1000/jvs.101" }],
        },
      },
    });
    expect(publications).toEqual([
      {
        id: "101",
        title: "Sex differences in AAA repair outcomes.",
        journal: "Journal of Vascular Surgery",
        pubDate: "2026 Mar",
        authors: ["Smith J", "Lee A"],
        doi: "10.1000/jvs.101",
        url: "https://pubmed.ncbi.nlm.nih.gov/101/",
        source: "pubmed",
      },
    ]);
  });

  it("tolerates missing optional esummary fields", () => {
    const publications = parsePublications({
      result: {
        uids: ["7"],
        "7": { uid: "7", title: "Untagged report.", pubdate: "2025" },
      },
    });
    expect(publications[0].journal).toBe("");
    expect(publications[0].authors).toEqual([]);
    expect(publications[0].doi).toBeNull();
  });
});

describe("buildSearchTerm for discovered MeSH topics", () => {
  it("scopes a MeSH descriptor to vascular surgery", () => {
    const term = buildSearchTerm({ meshTerm: "Sarcopenia" });
    expect(term).toContain('"Sarcopenia"[mh]');
    expect(term).toContain("vascular");
  });

  it("accepts the punctuation real MeSH descriptors use", () => {
    expect(
      buildSearchTerm({ meshTerm: "Aortic Aneurysm, Abdominal" }),
    ).toContain('"Aortic Aneurysm, Abdominal"[mh]');
  });

  it("refuses anything that isn't descriptor-shaped, so no raw query reaches PubMed", () => {
    expect(buildSearchTerm({ meshTerm: 'x"[mh] OR 1=1 OR "' })).toBeNull();
    expect(buildSearchTerm({ meshTerm: "" })).toBeNull();
  });

  it("still ANDs demographic facets onto a discovered topic", () => {
    const term = buildSearchTerm({
      meshTerm: "Sarcopenia",
      demoIds: [DEMOGRAPHICS[0].id],
    });
    expect(term).toContain(DEMOGRAPHICS[0].clause);
  });
});

describe("buildSearchTerm for a population on its own", () => {
  it("scopes a demographic-only search to vascular surgery", () => {
    const term = buildSearchTerm({ demoIds: [DEMOGRAPHICS[0].id] });
    expect(term).toContain(DEMOGRAPHICS[0].clause);
    expect(term).toContain("vascular");
  });

  it("does not add the field scope when a topic already narrows it", () => {
    const term = buildSearchTerm({
      topicId: TOPICS[0].id,
      demoIds: [DEMOGRAPHICS[0].id],
    });
    expect(term).toBe(`(${TOPICS[0].query}) AND (${DEMOGRAPHICS[0].clause})`);
  });
});

describe("the badge scale matches what the curated topics really return", () => {
  it("does not promise a state the curated topics cannot reach", () => {
    // Observed live counts, lowest first. Not one is zero, because every
    // curated topic is a recognised area of vascular surgery. The guide used
    // to say "scan for the green No research yet badges", which never appear.
    const observed = [4, 6, 7, 15, 15, 15, 25, 29, 34, 44, 49, 58, 74, 81, 99];
    const statuses = observed.map((recent) =>
      classifyEvidence({ total: recent * 3, recent }),
    );
    expect(statuses).not.toContain("none");
  });

  it("does not put most topics in one bucket", () => {
    const observed = [
      4, 6, 7, 15, 15, 15, 25, 29, 34, 44, 49, 58, 74, 81, 99, 112, 120, 132,
      143, 178, 221, 221, 276, 395, 502,
    ];
    const counts = observed
      .map((recent) => classifyEvidence({ total: recent * 3, recent }))
      .reduce<Record<string, number>>(
        (acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }),
        {},
      );
    const biggest = Math.max(...Object.values(counts));
    // The old scale put 20 of 25 in "active". No band should own most of them.
    expect(biggest).toBeLessThan(observed.length * 0.6);
    expect(Object.keys(counts).length).toBeGreaterThanOrEqual(3);
  });
});
