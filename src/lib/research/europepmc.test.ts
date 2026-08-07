import { describe, it, expect } from "vitest";
import {
  parseEuropePmcSearch,
  parseMeshCounts,
  deriveTopics,
  mergePublications,
  GENERIC_MESH,
  toEuropePmcQuery,
  pubDateOrder,
} from "./europepmc";
import type { Publication } from "./pubmed";

const record = (over: Record<string, unknown> = {}) => ({
  id: "PMC123",
  source: "MED",
  pmid: "555",
  doi: "10.1000/x.1",
  title: "Endovascular repair in dialysis patients.",
  authorString: "Smith J, Lee A.",
  journalInfo: { journal: { title: "Annals of Vascular Surgery" } },
  firstPublicationDate: "2026-02-11",
  ...over,
});

describe("parseEuropePmcSearch", () => {
  it("normalizes records into the shared publication shape", () => {
    const publications = parseEuropePmcSearch({
      hitCount: 1,
      resultList: { result: [record()] },
    });
    expect(publications).toEqual([
      {
        id: "europepmc-PMC123",
        title: "Endovascular repair in dialysis patients.",
        journal: "Annals of Vascular Surgery",
        pubDate: "2026-02-11",
        authors: ["Smith J", "Lee A"],
        doi: "10.1000/x.1",
        url: "https://europepmc.org/article/MED/PMC123",
        source: "europepmc",
      },
    ]);
  });

  it("tolerates records missing journal, authors, and doi", () => {
    const [pub] = parseEuropePmcSearch({
      hitCount: 1,
      resultList: {
        result: [
          {
            id: "PPR9",
            source: "PPR",
            title: "A preprint.",
            pubYear: "2026",
          },
        ],
      },
    });
    expect(pub.journal).toBe("");
    expect(pub.authors).toEqual([]);
    expect(pub.doi).toBeNull();
    expect(pub.pubDate).toBe("2026");
  });

  it("rejects a payload that is not a Europe PMC search response", () => {
    expect(() => parseEuropePmcSearch({ nope: true })).toThrow();
  });
});

describe("mergePublications", () => {
  const pubmed: Publication = {
    id: "555",
    title: "Endovascular repair in dialysis patients.",
    journal: "Ann Vasc Surg",
    pubDate: "2026 Feb",
    authors: ["Smith J"],
    doi: "10.1000/x.1",
    url: "https://pubmed.ncbi.nlm.nih.gov/555/",
    source: "pubmed",
  };

  it("drops a Europe PMC duplicate that shares a DOI, keeping the PubMed record", () => {
    const merged = mergePublications(
      [pubmed],
      parseEuropePmcSearch({ hitCount: 1, resultList: { result: [record()] } }),
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe("pubmed");
  });

  it("dedupes on title when neither record carries a DOI", () => {
    const merged = mergePublications(
      [{ ...pubmed, doi: null }],
      parseEuropePmcSearch({
        hitCount: 1,
        resultList: {
          result: [
            record({
              doi: undefined,
              title: "  ENDOVASCULAR repair in dialysis patients.  ",
            }),
          ],
        },
      }),
    );
    expect(merged).toHaveLength(1);
  });

  it("keeps genuinely different papers from both sources", () => {
    const merged = mergePublications(
      [pubmed],
      parseEuropePmcSearch({
        hitCount: 1,
        resultList: {
          result: [record({ doi: "10.1000/other", title: "Another paper." })],
        },
      }),
    );
    // Order is by date now, not by source, so assert on membership.
    expect(merged).toHaveLength(2);
    expect(merged.map((p) => p.source).sort()).toEqual([
      "europepmc",
      "pubmed",
    ]);
  });
});

describe("topic discovery from MeSH headings", () => {
  const payload = {
    hitCount: 3,
    resultList: {
      result: [
        {
          ...record({ id: "a" }),
          meshHeadingList: {
            meshHeading: [
              { descriptorName: "Humans" },
              { descriptorName: "Sarcopenia" },
              { descriptorName: "Endoleak" },
            ],
          },
        },
        {
          ...record({ id: "b" }),
          meshHeadingList: {
            meshHeading: [
              { descriptorName: "Male" },
              { descriptorName: "Sarcopenia" },
            ],
          },
        },
        {
          ...record({ id: "c" }),
          meshHeadingList: {
            meshHeading: [{ descriptorName: "Aged" }],
          },
        },
      ],
    },
  };

  it("tallies MeSH headings across recent papers", () => {
    const counts = parseMeshCounts(payload);
    expect(counts.get("Sarcopenia")).toBe(2);
    expect(counts.get("Endoleak")).toBe(1);
    expect(counts.get("Humans")).toBe(1);
  });

  it("treats the boilerplate headings as generic", () => {
    ["Humans", "Male", "Female", "Aged", "Retrospective Studies"].forEach((t) =>
      expect(GENERIC_MESH.has(t)).toBe(true),
    );
  });

  it("derives topics from the recurring, non-generic headings", () => {
    const topics = deriveTopics(parseMeshCounts(payload), { minCount: 1 });
    const names = topics.map((t) => t.name);
    expect(names).toContain("Sarcopenia");
    expect(names).toContain("Endoleak");
    expect(names).not.toContain("Humans");
    expect(names).not.toContain("Aged");
  });

  it("ranks the most-recurring headings first and builds a scoped query", () => {
    const [first] = deriveTopics(parseMeshCounts(payload), { minCount: 1 });
    expect(first.name).toBe("Sarcopenia");
    expect(first.id).toBe("mesh-sarcopenia");
    expect(first.query).toContain('"Sarcopenia"[mh]');
    expect(first.query).toContain("vascular");
  });

  it("honors a minimum recurrence so one-off headings stay out", () => {
    const topics = deriveTopics(parseMeshCounts(payload), { minCount: 2 });
    expect(topics.map((t) => t.name)).toEqual(["Sarcopenia"]);
  });

  it("skips headings a curated topic already covers", () => {
    const counts = new Map([["Frailty", 5]]);
    expect(deriveTopics(counts, { minCount: 1 })).toEqual([]);
  });
});

describe("toEuropePmcQuery", () => {
  it("searches title and abstract rather than whole documents", () => {
    // Bare terms hit Europe PMC's full text, so ANDing common words like
    // "screening" and "female" matched anything that mentions them anywhere --
    // knee arthroplasty and hepatitis papers turned up under AAA screening.
    expect(toEuropePmcQuery('("frailty"[mh] OR frail[tiab])')).toBe(
      '(TITLE:"frailty" OR ABSTRACT:"frailty" OR TITLE:"frail" OR ABSTRACT:"frail")',
    );
  });

  it("translates a journal tag into a Europe PMC journal clause", () => {
    expect(toEuropePmcQuery('("J Vasc Surg"[ta])')).toBe(
      '(JOURNAL:"J Vasc Surg")',
    );
  });

  it("leaves a date clause out rather than sending PubMed syntax", () => {
    expect(toEuropePmcQuery("(aaa[tiab]) AND 2021:3000[dp]")).toBe(
      '(TITLE:"aaa" OR ABSTRACT:"aaa")',
    );
  });

  it("keeps the AND structure between groups", () => {
    expect(toEuropePmcQuery('("aortic aneurysm"[mh]) AND ("female"[mh])')).toBe(
      '(TITLE:"aortic aneurysm" OR ABSTRACT:"aortic aneurysm") AND (TITLE:"female" OR ABSTRACT:"female")',
    );
  });

  it("returns null when nothing survives translation", () => {
    expect(toEuropePmcQuery("2021:3000[dp]")).toBeNull();
  });
});

describe("discovery quality", () => {
  const mesh = (entries: { name: string; major?: boolean }[]) => ({
    meshHeadingList: {
      meshHeading: entries.map((e) => ({
        descriptorName: e.name,
        majorTopic_YN: e.major === false ? "N" : "Y",
      })),
    },
  });

  it("counts only what a paper is actually about, not its incidental tags", () => {
    const counts = parseMeshCounts({
      hitCount: 1,
      resultList: {
        result: [
          {
            id: "a",
            source: "MED",
            title: "One.",
            ...mesh([
              { name: "China", major: false },
              { name: "Endoleak", major: true },
            ]),
          },
        ],
      },
    });
    expect(counts.get("Endoleak")).toBe(1);
    expect(counts.has("China")).toBe(false);
  });

  it("drops animal studies, which are not projects a resident takes on", () => {
    const counts = parseMeshCounts({
      hitCount: 1,
      resultList: {
        result: [
          {
            id: "a",
            source: "MED",
            title: "Mouse model.",
            ...mesh([{ name: "Animals" }, { name: "Neointima" }]),
          },
          {
            id: "b",
            source: "MED",
            title: "Human study.",
            ...mesh([{ name: "Neointima" }]),
          },
        ],
      },
    });
    expect(counts.get("Neointima")).toBe(1);
  });

  it("treats geography and lab organisms as generic, never as research topics", () => {
    [
      "China",
      "United States",
      "Japan",
      "Mice",
      "Rats",
      "Animals",
      "Randomized Controlled Trials as Topic",
    ].forEach((t) => expect(GENERIC_MESH.has(t)).toBe(true));
  });
});

describe("merged lists read the way they claim to", () => {
  const pub = (over: Partial<Publication>): Publication => ({
    id: "x",
    title: "A paper.",
    journal: "J",
    pubDate: "2020 Jan",
    authors: [],
    doi: null,
    url: "u",
    source: "pubmed",
    ...over,
  });

  it("orders the merged list newest first across both sources", () => {
    const merged = mergePublications(
      [
        pub({ id: "a", doi: "1", title: "Paper A.", pubDate: "2024 Dec" }),
        pub({ id: "b", doi: "2", title: "Paper B.", pubDate: "2004 Nov" }),
      ],
      [
        pub({
          id: "c",
          doi: "3",
          title: "Paper C.",
          pubDate: "2026-06-23",
          source: "europepmc",
        }),
        pub({
          id: "d",
          doi: "4",
          title: "Paper D.",
          pubDate: "2016 Mar",
          source: "europepmc",
        }),
      ],
    );
    expect(merged.map((p) => p.id)).toEqual(["c", "a", "d", "b"]);
  });

  it("understands the date shapes the two sources actually emit", () => {
    expect(pubDateOrder("2026-06-23")).toBeGreaterThan(
      pubDateOrder("2026 Feb"),
    );
    expect(pubDateOrder("2026 Feb")).toBeGreaterThan(pubDateOrder("2025"));
    expect(pubDateOrder("2004 Nov")).toBeGreaterThan(pubDateOrder("1998 Jan"));
    expect(pubDateOrder("")).toBe(0);
  });

  it("strips the markup Europe PMC leaves in titles", () => {
    const [p] = parseEuropePmcSearch({
      hitCount: 1,
      resultList: {
        result: [
          {
            id: "1",
            source: "MED",
            title:
              "Gut dysbiosis via &lt;i&gt;Escherichia coli&lt;/i&gt;-driven neutrophils.",
          },
        ],
      },
    });
    expect(p.title).toBe(
      "Gut dysbiosis via Escherichia coli-driven neutrophils.",
    );
  });

  it("strips real tags too, not just escaped ones", () => {
    const [p] = parseEuropePmcSearch({
      hitCount: 1,
      resultList: {
        result: [
          { id: "1", source: "MED", title: "A <i>Klebsiella</i> study." },
        ],
      },
    });
    expect(p.title).toBe("A Klebsiella study.");
  });
});
