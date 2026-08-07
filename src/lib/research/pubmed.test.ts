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

  it("labels thin or stale literature as sparse", () => {
    expect(classifyEvidence({ total: 24, recent: 24 })).toBe("sparse");
    expect(classifyEvidence({ total: 200, recent: 9 })).toBe("sparse");
  });

  it("labels well-covered topics as active", () => {
    expect(classifyEvidence({ total: 25, recent: 10 })).toBe("active");
    expect(classifyEvidence({ total: 500, recent: 120 })).toBe("active");
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
