import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server } from "@/test/server";
import { TOPICS, DEMOGRAPHICS } from "@/lib/research/data";
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
    if (term.includes(TOPICS[0].query)) return HttpResponse.json(esearchJson(0));
    if (term.includes("[dp]")) return HttpResponse.json(esearchJson(40));
    return HttpResponse.json(esearchJson(120));
  });

beforeEach(() => server.use(countHandler(), epmcHandler()));

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
    expect(first).toEqual({ id: TOPICS[0].id, total: 0, recent: 0, status: "none" });
    const rest = body.topics.filter((t: { id: string }) => t.id !== TOPICS[0].id);
    rest.forEach((t: { status: string; total: number; recent: number }) => {
      expect(t).toMatchObject({ total: 120, recent: 40, status: "active" });
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
    expect(body.publications.map((p: { source: string }) => p.source)).toEqual([
      "pubmed",
      "europepmc",
    ]);
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
    server.use(http.get(ESEARCH, () => HttpResponse.json(esearchJson(3))));
    const res = await demographicsGET(
      new NextRequest("http://localhost/api/research/demographics"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.facets[0].count).toBe(3);
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
    expect(
      body.topics.some((t: { name: string }) => t.name === "Humans"),
    ).toBe(false);
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
    const femaleClause = DEMOGRAPHICS.find((d) => d.id === "female")!.clause;
    expect(terms.some((t) => t.includes(femaleClause))).toBe(false);
  });
});

describe("GET /api/research/demographics?window=", () => {
  it("bounds every facet count to the window asked for", async () => {
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
    expect(terms.every((t) => /\d{4}:3000\[dp\]/.test(t))).toBe(true);
  });

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
