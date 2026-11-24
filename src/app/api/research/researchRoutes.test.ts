import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server } from "@/test/server";
import { TOPICS, DEMOGRAPHICS, ALL_VASCULAR_QUERY } from "@/lib/research/data";
import { GET as topicsGET } from "./topics/route";
import { GET as publicationsGET } from "./publications/route";
import { GET as demographicsGET } from "./demographics/route";
import { GET as discoverGET } from "./discover/route";

const ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const ESUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
const EPMC = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

/** Europe PMC contributes a second, non-duplicate paper unless a test says otherwise. */
const epmcHandler = (
  body: Record<string, unknown> = {
    hitCount: 1,
    resultList: {
      result: [
        {
          id: "PPR1",
          source: "PPR",
          doi: "10.1000/preprint.1",
          title: "A vascular preprint.",
          authorString: "Ng K.",
          firstPublicationDate: "2026-03-02",
        },
      ],
    },
  },
) => http.get(EPMC, () => HttpResponse.json(body));

const esearchJson = (count: number, ids: string[] = []) => ({
  esearchresult: { count: String(count), idlist: ids },
});

/** esearch stub: the first topic reads as unresearched, everything else as active. */
const countHandler = () =>
  http.get(ESEARCH, ({ request }) => {
    const term = new URL(request.url).searchParams.get("term") ?? "";
    if (term.includes(TOPICS[0].query))
      return HttpResponse.json(esearchJson(0));
    if (term.includes("[dp]")) return HttpResponse.json(esearchJson(40));
    return HttpResponse.json(esearchJson(120));
  });

beforeEach(() => server.use(countHandler(), epmcHandler()));

/** The routes read the calendar year for their windows, so the clock is pinned rather than trusted. */
const TODAY = new Date("2026-11-19T12:00:00Z");
const pinClock = () => vi.useFakeTimers({ now: TODAY, toFake: ["Date"] });

afterEach(() => vi.useRealTimers());

describe("GET /api/research/topics", () => {
  it("returns an evidence status for every curated topic with a day-long cache", async () => {
    const res = await topicsGET(
      new NextRequest("http://localhost/api/research/topics"),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=86400, stale-while-revalidate=604800",
    );
    const body = await res.json();
    expect(body.topics).toHaveLength(TOPICS.length);
    const first = body.topics.find(
      (t: { id: string }) => t.id === TOPICS[0].id,
    );
    expect(first).toEqual({
      id: TOPICS[0].id,
      total: 0,
      recent: 0,
      status: "none",
    });
    const rest = body.topics.filter(
      (t: { id: string }) => t.id !== TOPICS[0].id,
    );
    rest.forEach((t: { status: string; total: number; recent: number }) => {
      // 40 recent sits below the 75 mark, so it reads as emerging rather than
      // active under the calibrated scale.
      expect(t).toMatchObject({ total: 120, recent: 40, status: "emerging" });
    });
  });

  it("fails loudly when PubMed is unreachable instead of faking empty topics", async () => {
    server.use(http.get(ESEARCH, () => HttpResponse.error()));
    const res = await topicsGET(
      new NextRequest("http://localhost/api/research/topics"),
    );
    expect(res.status).toBe(502);
  });
});

describe("GET /api/research/publications", () => {
  const summaryHandler = http.get(ESUMMARY, () =>
    HttpResponse.json({
      result: {
        uids: ["11"],
        "11": {
          uid: "11",
          title: "Limb salvage in dialysis patients.",
          fulljournalname: "Annals of Vascular Surgery",
          pubdate: "2026 Jan",
          authors: [{ name: "Doe A" }],
          articleids: [{ idtype: "doi", value: "10.1000/avs.11" }],
        },
      },
    }),
  );

  it("400s when neither a known topic nor a journal is given", async () => {
    const missing = await publicationsGET(
      new NextRequest("http://localhost/api/research/publications"),
    );
    expect(missing.status).toBe(400);
    const unknown = await publicationsGET(
      new NextRequest("http://localhost/api/research/publications?topic=nope"),
    );
    expect(unknown.status).toBe(400);
  });

  it("returns recent publications normalized with PubMed links", async () => {
    server.use(
      http.get(ESEARCH, () => HttpResponse.json(esearchJson(1, ["11"]))),
      summaryHandler,
    );
    const res = await publicationsGET(
      new NextRequest(
        `http://localhost/api/research/publications?topic=${TOPICS[0].id}`,
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=21600, stale-while-revalidate=86400",
    );
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.publications).toContainEqual({
      id: "11",
      title: "Limb salvage in dialysis patients.",
      journal: "Annals of Vascular Surgery",
      pubDate: "2026 Jan",
      authors: ["Doe A"],
      doi: "10.1000/avs.11",
      url: "https://pubmed.ncbi.nlm.nih.gov/11/",
      source: "pubmed",
    });
  });

  it("merges in Europe PMC results the PubMed index does not carry", async () => {
    server.use(
      http.get(ESEARCH, () => HttpResponse.json(esearchJson(1, ["11"]))),
      summaryHandler,
    );
    const res = await publicationsGET(
      new NextRequest(
        `http://localhost/api/research/publications?topic=${TOPICS[0].id}`,
      ),
    );
    const body = await res.json();
    // Ordering is by publication date across the union, not by source, so the
    // Europe PMC preprint (2026-03-02) legitimately precedes the PubMed record
    // (2026 Jan). Assert both are present rather than pinning the order here.
    expect(
      body.publications.map((p: { source: string }) => p.source).sort(),
    ).toEqual(["europepmc", "pubmed"]);
    expect(body.sources).toEqual(["pubmed", "europepmc"]);
  });

  it("drops the Europe PMC copy of a paper PubMed already returned", async () => {
    server.use(
      http.get(ESEARCH, () => HttpResponse.json(esearchJson(1, ["11"]))),
      summaryHandler,
      epmcHandler({
        hitCount: 1,
        resultList: {
          result: [
            {
              id: "MED11",
              source: "MED",
              doi: "10.1000/avs.11",
              title: "Limb salvage in dialysis patients.",
              firstPublicationDate: "2026-01-04",
            },
          ],
        },
      }),
    );
    const res = await publicationsGET(
      new NextRequest(
        `http://localhost/api/research/publications?topic=${TOPICS[0].id}`,
      ),
    );
    const body = await res.json();
    expect(body.publications).toHaveLength(1);
    expect(body.publications[0].source).toBe("pubmed");
  });

  it("leaves Europe PMC out when only PubMed is asked for", async () => {
    let europeCalls = 0;
    server.use(
      http.get(ESEARCH, () => HttpResponse.json(esearchJson(1, ["11"]))),
      summaryHandler,
      http.get(EPMC, () => {
        europeCalls += 1;
        return HttpResponse.json({ hitCount: 0, resultList: { result: [] } });
      }),
    );
    const res = await publicationsGET(
      new NextRequest(
        `http://localhost/api/research/publications?topic=${TOPICS[0].id}&sources=pubmed`,
      ),
    );
    const body = await res.json();
    expect(europeCalls).toBe(0);
    expect(body.sources).toEqual(["pubmed"]);
  });

  it("narrows the PubMed search to the demographic facets chosen", async () => {
    const terms: string[] = [];
    // a facet the topic's own query does not already mention, or the check proves nothing
    const facet = DEMOGRAPHICS.find((d) => !TOPICS[0].query.includes(d.clause))!;
    server.use(
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(0));
      }),
    );
    await publicationsGET(
      new NextRequest(
        `http://localhost/api/research/publications?topic=${TOPICS[0].id}&demo=${facet.id}`,
      ),
    );
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every((t) => t.includes(facet.clause))).toBe(true);
  });

  it("keeps PubMed results when Europe PMC answers with something unreadable", async () => {
    server.use(
      http.get(ESEARCH, () => HttpResponse.json(esearchJson(1, ["11"]))),
      summaryHandler,
      epmcHandler({ unexpected: "shape" }),
    );
    const res = await publicationsGET(
      new NextRequest(
        `http://localhost/api/research/publications?topic=${TOPICS[0].id}`,
      ),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.sources).toEqual(["pubmed"]);
    expect(body.publications).toHaveLength(1);
  });

  it("still serves PubMed results when Europe PMC is down", async () => {
    server.use(
      http.get(ESEARCH, () => HttpResponse.json(esearchJson(1, ["11"]))),
      summaryHandler,
      http.get(EPMC, () => HttpResponse.error()),
    );
    const res = await publicationsGET(
      new NextRequest(
        `http://localhost/api/research/publications?topic=${TOPICS[0].id}`,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.publications).toHaveLength(1);
    expect(body.sources).toEqual(["pubmed"]);
  });

  it("skips the summary call and still returns an empty list when nothing matches", async () => {
    server.use(
      http.get(ESEARCH, () => HttpResponse.json(esearchJson(0))),
      epmcHandler({ hitCount: 0, resultList: { result: [] } }),
    );
    const res = await publicationsGET(
      new NextRequest(
        `http://localhost/api/research/publications?topic=${TOPICS[0].id}`,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.publications).toEqual([]);
  });

  it("502s when PubMed is down instead of rendering an empty state", async () => {
    server.use(http.get(ESEARCH, () => HttpResponse.error()));
    const res = await publicationsGET(
      new NextRequest(
        `http://localhost/api/research/publications?topic=${TOPICS[0].id}`,
      ),
    );
    expect(res.status).toBe(502);
  });
});

describe("GET /api/research/demographics", () => {
  it("returns a literature count per demographic facet", async () => {
    server.use(http.get(ESEARCH, () => HttpResponse.json(esearchJson(7))));
    const res = await demographicsGET(
      new NextRequest(
        `http://localhost/api/research/demographics?topic=${TOPICS[0].id}`,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.facets).toHaveLength(DEMOGRAPHICS.length);
    body.facets.forEach((f: { id: string; count: number }) => {
      expect(DEMOGRAPHICS.some((d) => d.id === f.id)).toBe(true);
      expect(f.count).toBe(7);
    });
  });

  it("covers all of vascular surgery when no topic is given", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(3));
      }),
    );
    const res = await demographicsGET(
      new NextRequest("http://localhost/api/research/demographics"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.facets[0].count).toBe(3);
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every((t) => t.includes(ALL_VASCULAR_QUERY))).toBe(true);
  });

  it("400s on an unknown topic id", async () => {
    const res = await demographicsGET(
      new NextRequest("http://localhost/api/research/demographics?topic=nope"),
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/research/discover", () => {
  const meshPayload = {
    hitCount: 2,
    resultList: {
      result: [
        {
          id: "a",
          source: "MED",
          title: "One.",
          meshHeadingList: {
            meshHeading: [
              { descriptorName: "Humans" },
              { descriptorName: "Sarcopenia" },
            ],
          },
        },
        {
          id: "b",
          source: "MED",
          title: "Two.",
          meshHeadingList: {
            meshHeading: [
              { descriptorName: "Aged" },
              { descriptorName: "Sarcopenia" },
            ],
          },
        },
        {
          id: "c",
          source: "MED",
          title: "Three.",
          meshHeadingList: {
            meshHeading: [
              { descriptorName: "Humans" },
              { descriptorName: "Sarcopenia" },
            ],
          },
        },
      ],
    },
  };

  it("derives topics from recent MeSH headings and scores them against PubMed", async () => {
    server.use(
      epmcHandler(meshPayload),
      http.get(ESEARCH, ({ request }) => {
        const term = new URL(request.url).searchParams.get("term") ?? "";
        return HttpResponse.json(esearchJson(term.includes("[dp]") ? 4 : 12));
      }),
    );
    const res = await discoverGET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=86400, stale-while-revalidate=604800",
    );
    const body = await res.json();
    expect(body.topics.length).toBeGreaterThan(0);
    const sarcopenia = body.topics.find(
      (t: { name: string }) => t.name === "Sarcopenia",
    );
    expect(sarcopenia).toMatchObject({
      id: "mesh-sarcopenia",
      total: 12,
      recent: 4,
      status: "sparse",
    });
    expect(body.topics.some((t: { name: string }) => t.name === "Humans")).toBe(
      false,
    );
  });

  it("only offers a heading that recurs across the sample, not one that appears twice", async () => {
    const paperWith = (id: string, ...headings: string[]) => ({
      id,
      source: "MED",
      title: id,
      meshHeadingList: {
        meshHeading: headings.map((descriptorName) => ({ descriptorName })),
      },
    });
    server.use(
      epmcHandler({
        hitCount: 5,
        resultList: {
          result: [
            paperWith("p1", "Sarcopenia", "Hand Strength"),
            paperWith("p2", "Sarcopenia", "Hand Strength"),
            paperWith("p3", "Sarcopenia"),
          ],
        },
      }),
    );
    const res = await discoverGET();
    const names = (await res.json()).topics.map((t: { name: string }) => t.name);
    expect(names).toContain("Sarcopenia");
    expect(names).not.toContain("Hand Strength");
  });

  it("answers an empty list without counting anything when the sample has no headings", async () => {
    let esearchCalls = 0;
    server.use(
      epmcHandler({ hitCount: 0, resultList: { result: [] } }),
      http.get(ESEARCH, () => {
        esearchCalls += 1;
        return HttpResponse.json(esearchJson(1));
      }),
    );
    const res = await discoverGET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ topics: [] });
    expect(esearchCalls).toBe(0);
  });

  it("scores each derived topic over the last five years", async () => {
    pinClock();
    const terms: string[] = [];
    server.use(
      epmcHandler(meshPayload),
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(1));
      }),
    );
    await discoverGET();
    expect(terms.some((t) => t.includes("2021:3000[dp]"))).toBe(true);
  });

  it("samples recent MeSH-indexed vascular papers that have abstracts", async () => {
    let sampled = "";
    let pageSize = "";
    server.use(
      http.get(EPMC, ({ request }) => {
        sampled = new URL(request.url).searchParams.get("query") ?? "";
        pageSize = new URL(request.url).searchParams.get("pageSize") ?? "";
        return HttpResponse.json({ hitCount: 0, resultList: { result: [] } });
      }),
    );
    await discoverGET();
    expect(sampled).toContain('MESH:"Aortic Aneurysm"');
    expect(sampled).toContain('HAS_ABSTRACT:"Y"');
    expect(pageSize).toBe("200");
  });

  it("502s when Europe PMC cannot be reached for the discovery scan", async () => {
    server.use(http.get(EPMC, () => HttpResponse.error()));
    const res = await discoverGET();
    expect(res.status).toBe(502);
  });
});

describe("GET /api/research/topics?demo=", () => {
  it("scopes every topic count to the demographic asked for", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        const term = new URL(request.url).searchParams.get("term") ?? "";
        terms.push(term);
        return HttpResponse.json(esearchJson(5));
      }),
    );
    const res = await topicsGET(
      new NextRequest("http://localhost/api/research/topics?demo=female"),
    );
    expect(res.status).toBe(200);
    const facet = DEMOGRAPHICS.find((d) => d.id === "female");
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every((t) => t.includes(facet!.clause))).toBe(true);
    const body = await res.json();
    expect(body.topics).toHaveLength(TOPICS.length);
  });

  it("400s on a demographic the curated layer doesn't define", async () => {
    const res = await topicsGET(
      new NextRequest("http://localhost/api/research/topics?demo=nope"),
    );
    expect(res.status).toBe(400);
  });

  it("leaves the unfiltered scan alone when no demographic is given", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(5));
      }),
    );
    await topicsGET(new NextRequest("http://localhost/api/research/topics"));
    // Several curated queries legitimately contain "female"[mh] themselves, so
    // substring-matching the clause proves nothing. The real contract is that
    // nothing is appended: the all-time term is exactly the topic's own query.
    expect(terms).toContain(`(${TOPICS[0].query})`);
  });
});

describe("GET /api/research/demographics?window=", () => {
  it("bounds every facet count to the window asked for", async () => {
    pinClock();
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(2));
      }),
    );
    const res = await demographicsGET(
      new NextRequest(
        `http://localhost/api/research/demographics?topic=${TOPICS[0].id}&window=5`,
      ),
    );
    expect(res.status).toBe(200);
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every((t) => /\d{4}:3000\[dp\]/.test(t))).toBe(true);
  });

  it.each(["0", "-3", "abc", "Infinity"])(
    "400s on a window of %s instead of counting with it",
    async (window) => {
      const res = await demographicsGET(
        new NextRequest(
          `http://localhost/api/research/demographics?topic=${TOPICS[0].id}&window=${window}`,
        ),
      );
      expect(res.status).toBe(400);
    },
  );

  it("counts all of time when no window is given", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(2));
      }),
    );
    await demographicsGET(
      new NextRequest(
        `http://localhost/api/research/demographics?topic=${TOPICS[0].id}`,
      ),
    );
    expect(terms.some((t) => /\[dp\]/.test(t))).toBe(false);
  });
});

describe("data coverage is reported, not implied", () => {
  it("topics says which years the recent count covers", async () => {
    pinClock();
    const res = await topicsGET(
      new NextRequest("http://localhost/api/research/topics"),
    );
    const body = await res.json();
    expect(body.window).toEqual({ fromYear: 2021, toYear: 2026 });
  });

  it("demographics reports the window it actually applied", async () => {
    pinClock();
    const res = await demographicsGET(
      new NextRequest(
        `http://localhost/api/research/demographics?topic=${TOPICS[0].id}&window=5`,
      ),
    );
    const body = await res.json();
    expect(body.window).toEqual({ fromYear: 2021, toYear: 2026 });
  });

  it("demographics reports no window when counting all of time", async () => {
    const res = await demographicsGET(
      new NextRequest(
        `http://localhost/api/research/demographics?topic=${TOPICS[0].id}`,
      ),
    );
    const body = await res.json();
    expect(body.window).toBeNull();
  });
});

describe("GET /api/research/demographics with facets already chosen", () => {
  it("counts each facet on top of the ones already selected", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(1));
      }),
    );
    const female = DEMOGRAPHICS.find((d) => d.id === "female")!;
    const res = await demographicsGET(
      new NextRequest(
        `http://localhost/api/research/demographics?topic=${TOPICS[0].id}&demo=female`,
      ),
    );
    expect(res.status).toBe(200);
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every((t) => t.includes(female.clause))).toBe(true);
  });

  it("stacks several chosen facets, all of which must hold", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(1));
      }),
    );
    const [first, second] = DEMOGRAPHICS;
    const res = await demographicsGET(
      new NextRequest(
        `http://localhost/api/research/demographics?topic=${TOPICS[0].id}&demo=${first.id}, ${second.id}`,
      ),
    );
    expect(res.status).toBe(200);
    expect(terms.length).toBeGreaterThan(0);
    expect(
      terms.every((t) => t.includes(first.clause) && t.includes(second.clause)),
    ).toBe(true);
  });

  it("caches the facet counts for a day", async () => {
    server.use(http.get(ESEARCH, () => HttpResponse.json(esearchJson(1))));
    const res = await demographicsGET(
      new NextRequest(
        `http://localhost/api/research/demographics?topic=${TOPICS[0].id}`,
      ),
    );
    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=86400, stale-while-revalidate=604800",
    );
  });

  it("fails loudly when PubMed is unreachable instead of reporting zero counts", async () => {
    server.use(http.get(ESEARCH, () => HttpResponse.error()));
    const res = await demographicsGET(
      new NextRequest(
        `http://localhost/api/research/demographics?topic=${TOPICS[0].id}`,
      ),
    );
    expect(res.status).toBe(502);
  });

  it("400s when an already-selected facet is unknown", async () => {
    const res = await demographicsGET(
      new NextRequest(
        `http://localhost/api/research/demographics?topic=${TOPICS[0].id}&demo=nope`,
      ),
    );
    expect(res.status).toBe(400);
  });

  it("counts a discovered MeSH topic's populations too", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(1));
      }),
    );
    const res = await demographicsGET(
      new NextRequest(
        "http://localhost/api/research/demographics?mesh=Sarcopenia",
      ),
    );
    expect(res.status).toBe(200);
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every((t) => t.includes('"Sarcopenia"[mh]'))).toBe(true);
  });

  it("400s on a mesh term that isn't descriptor-shaped", async () => {
    const res = await demographicsGET(
      new NextRequest(
        'http://localhost/api/research/demographics?mesh=x"[mh] OR 1=1',
      ),
    );
    expect(res.status).toBe(400);
  });
});

describe("custom phrase topics", () => {
  it("scores a single phrase in the standard topics shape", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        const term = new URL(request.url).searchParams.get("term") ?? "";
        terms.push(term);
        return HttpResponse.json(esearchJson(term.includes("[dp]") ? 25 : 58));
      }),
    );
    const res = await topicsGET(
      new NextRequest(
        "http://localhost/api/research/topics?phrase=mesenteric+ischemia+thrombolysis",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topics).toEqual([
      { id: "custom", total: 58, recent: 25, status: "emerging" },
    ]);
    // The phrase becomes word-by-word title/abstract clauses, always scoped to
    // the field, so a custom topic can never scan all of PubMed.
    expect(terms.length).toBeGreaterThan(0);
    terms.forEach((t) => {
      expect(t).toContain(
        "mesenteric[tiab] AND ischemia[tiab] AND thrombolysis[tiab]",
      );
      expect(t).toContain("vascular");
    });
  });

  it("400s a phrase carrying query syntax instead of forwarding it", async () => {
    const topics = await topicsGET(
      new NextRequest(
        'http://localhost/api/research/topics?phrase=x"[mh] OR 1=1',
      ),
    );
    expect(topics.status).toBe(400);
    const publications = await publicationsGET(
      new NextRequest(
        "http://localhost/api/research/publications?phrase=(clti)+AND+dialysis",
      ),
    );
    expect(publications.status).toBe(400);
    const demographics = await demographicsGET(
      new NextRequest(
        "http://localhost/api/research/demographics?phrase=one+two+three+four+five+six+seven+eight+nine",
      ),
    );
    expect(demographics.status).toBe(400);
  });

  it("serves publications for a phrase topic like any curated one", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(1, ["11"]));
      }),
      http.get(ESUMMARY, () =>
        HttpResponse.json({
          result: {
            uids: ["11"],
            "11": {
              uid: "11",
              title: "Thrombolysis outcomes.",
              pubdate: "2026 Feb",
            },
          },
        }),
      ),
    );
    const res = await publicationsGET(
      new NextRequest(
        "http://localhost/api/research/publications?phrase=mesenteric+ischemia",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // Ordering is by date across the merged sources, so assert presence.
    expect(body.publications.map((p: { title: string }) => p.title)).toContain(
      "Thrombolysis outcomes.",
    );
    expect(terms.length).toBeGreaterThan(0);
    expect(
      terms.every((t) => t.includes("mesenteric[tiab] AND ischemia[tiab]")),
    ).toBe(true);
  });

  it("counts a phrase topic's populations too", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        terms.push(new URL(request.url).searchParams.get("term") ?? "");
        return HttpResponse.json(esearchJson(1));
      }),
    );
    const res = await demographicsGET(
      new NextRequest(
        "http://localhost/api/research/demographics?phrase=popliteal+aneurysm",
      ),
    );
    expect(res.status).toBe(200);
    expect(terms.length).toBeGreaterThan(0);
    expect(
      terms.every((t) => t.includes("popliteal[tiab] AND aneurysm[tiab]")),
    ).toBe(true);
  });
});

describe("custom MeSH topics", () => {
  it("scores a single MeSH descriptor in the standard topics shape", async () => {
    const terms: string[] = [];
    server.use(
      http.get(ESEARCH, ({ request }) => {
        const term = new URL(request.url).searchParams.get("term") ?? "";
        terms.push(term);
        return HttpResponse.json(esearchJson(term.includes("[dp]") ? 5 : 14));
      }),
    );
    const res = await topicsGET(
      new NextRequest("http://localhost/api/research/topics?mesh=Sarcopenia"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topics).toEqual([
      { id: "custom", total: 14, recent: 5, status: "sparse" },
    ]);
    expect(terms.length).toBeGreaterThan(0);
    terms.forEach((t) => {
      expect(t).toContain('"Sarcopenia"[mh]');
      expect(t).toContain("vascular");
    });
  });

  it("400s a mesh term that isn't descriptor-shaped", async () => {
    const res = await topicsGET(
      new NextRequest(
        'http://localhost/api/research/topics?mesh=x"[mh] OR 1=1',
      ),
    );
    expect(res.status).toBe(400);
  });
});
