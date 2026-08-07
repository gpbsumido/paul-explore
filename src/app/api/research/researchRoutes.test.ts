import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server } from "@/test/server";
import { TOPICS, DEMOGRAPHICS } from "@/lib/research/data";
import { GET as topicsGET } from "./topics/route";
import { GET as publicationsGET } from "./publications/route";
import { GET as demographicsGET } from "./demographics/route";

const ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const ESUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

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

beforeEach(() => server.use(countHandler()));

describe("GET /api/research/topics", () => {
  it("returns an evidence status for every curated topic with a day-long cache", async () => {
    const res = await topicsGET();
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
    const res = await topicsGET();
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
    expect(body.publications).toEqual([
      {
        id: "11",
        title: "Limb salvage in dialysis patients.",
        journal: "Annals of Vascular Surgery",
        pubDate: "2026 Jan",
        authors: ["Doe A"],
        doi: "10.1000/avs.11",
        url: "https://pubmed.ncbi.nlm.nih.gov/11/",
        source: "pubmed",
      },
    ]);
  });

  it("skips the summary call and returns an empty list when nothing matches", async () => {
    server.use(http.get(ESEARCH, () => HttpResponse.json(esearchJson(0))));
    const res = await publicationsGET(
      new NextRequest(
        `http://localhost/api/research/publications?topic=${TOPICS[0].id}`,
      ),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: 0, publications: [] });
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
