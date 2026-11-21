import { describe, it, expect } from "vitest";
import type { Interview } from "./types";
import { searchInterviewTopics } from "./search";

const interviews: Interview[] = [
  {
    id: "acme",
    title: "Acme onsite",
    summary: "Frontend systems round.",
    topics: [
      {
        id: "perf",
        title: "Performance",
        summary: "Making the dashboard fast.",
        entries: [
          {
            question: "How do you profile a slow page?",
            points: ["Measure before optimising, with the profiler."],
            details: ["INP is usually the hardest to fix in a dashboard."],
          },
        ],
        related: [],
      },
      {
        id: "testing",
        title: "Testing",
        summary: "How I decide what to cover.",
        entries: [
          {
            question: "What do you test first?",
            points: ["Pure logic at the boundaries."],
          },
        ],
        related: [],
      },
    ],
  },
  {
    id: "globex",
    title: "Globex screen",
    summary: "Talking through past work.",
    topics: [
      {
        id: "refactor",
        title: "The refactor",
        summary: "A query-layer rewrite.",
        entries: [
          {
            question: "How did you de-risk it?",
            points: ["Sliced it, and watched the performance numbers per slice."],
          },
        ],
        related: [],
      },
    ],
  },
];

describe("searchInterviewTopics", () => {
  it("returns nothing for an empty or whitespace query", () => {
    expect(searchInterviewTopics(interviews, "")).toEqual([]);
    expect(searchInterviewTopics(interviews, "   ")).toEqual([]);
  });

  it("matches a topic by its title", () => {
    const hits = searchInterviewTopics(interviews, "performance");
    expect(hits.map((h) => h.topic.id)).toContain("perf");
  });

  it("matches text buried inside a point or detail, across interviews", () => {
    // 'performance' appears in acme/perf (title) and in globex/refactor (a point).
    const ids = searchInterviewTopics(interviews, "performance").map(
      (h) => `${h.interviewId}/${h.topic.id}`,
    );
    expect(ids).toContain("acme/perf");
    expect(ids).toContain("globex/refactor");
  });

  it("is case-insensitive", () => {
    expect(searchInterviewTopics(interviews, "INP").map((h) => h.topic.id)).toContain(
      "perf",
    );
  });

  it("requires every whitespace-separated term to match (AND)", () => {
    // 'profile' is in acme/perf; 'refactor' is not — so together they match nothing.
    expect(searchInterviewTopics(interviews, "profile refactor")).toEqual([]);
    // both terms live in acme/perf's text
    expect(
      searchInterviewTopics(interviews, "profile INP").map((h) => h.topic.id),
    ).toEqual(["perf"]);
  });

  it("carries the interview a hit belongs to, for labelling and links", () => {
    const [hit] = searchInterviewTopics(interviews, "query-layer");
    expect(hit.interviewId).toBe("globex");
    expect(hit.interviewTitle).toBe("Globex screen");
    expect(hit.topic.id).toBe("refactor");
  });

  it("returns no matches for a term that appears nowhere", () => {
    expect(searchInterviewTopics(interviews, "kubernetes")).toEqual([]);
  });

  it("ranks a title match above a match that only lives in a deep detail", () => {
    // 'performance': acme/perf matches on its TITLE ("Performance"); globex/refactor
    // matches only inside a point. The title hit should come first.
    const hits = searchInterviewTopics(interviews, "performance");
    expect(hits.map((h) => `${h.interviewId}/${h.topic.id}`)).toEqual([
      "acme/perf",
      "globex/refactor",
    ]);
    expect(hits[0].rank).toBeLessThan(hits[1].rank);
  });

  it("gives a title-only match rank 0", () => {
    const [hit] = searchInterviewTopics(interviews, "testing");
    expect(hit.topic.id).toBe("testing");
    expect(hit.rank).toBe(0);
  });

  it.each([
    { query: "dashboard fast", rank: 1, why: "the topic summary" },
    { query: "frontend systems", rank: 1, why: "the interview's own summary" },
    { query: "acme onsite", rank: 1, why: "the interview title" },
    { query: "slow page", rank: 2, why: "the question text" },
    { query: "measure before", rank: 3, why: "an answer point" },
    { query: "hardest", rank: 3, why: "an expandable detail" },
  ])("ranks a match found in $why at tier $rank", ({ query, rank }) => {
    const [hit] = searchInterviewTopics(interviews, query);
    expect(hit.topic.id).toBe("perf");
    expect(hit.rank).toBe(rank);
  });

  it("puts a shallower match ahead of a deeper one even when the deeper topic comes first in the deck", () => {
    const deckOrder: Interview[] = [
      {
        id: "first",
        title: "First",
        summary: "One.",
        topics: [
          {
            id: "buried",
            title: "Caching",
            summary: "Keys.",
            entries: [{ question: "Why?", points: ["Because the cdn is cold."] }],
            related: [],
          },
          {
            id: "headline",
            title: "CDN strategy",
            summary: "Edge.",
            entries: [{ question: "How?", points: ["Origin shield."] }],
            related: [],
          },
        ],
      },
    ];

    const hits = searchInterviewTopics(deckOrder, "cdn");

    expect(hits.map((h) => h.topic.id)).toEqual(["headline", "buried"]);
  });

  it("keeps deck order for topics that match at the same depth", () => {
    const hits = searchInterviewTopics(interviews, "frontend");
    expect(hits.map((h) => `${h.interviewId}/${h.topic.id}`)).toEqual([
      "acme/perf",
      "acme/testing",
    ]);
  });

  it("splits the query on any whitespace, not just single spaces", () => {
    expect(
      searchInterviewTopics(interviews, "profile\t INP").map((h) => h.topic.id),
    ).toEqual(["perf"]);
  });
});
