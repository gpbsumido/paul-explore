import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  countAll,
  countMatches,
  europePmcSearch,
  isFailure,
  NCBI_MAX_CONCURRENT,
  searchPublications,
} from "./eutils";

const ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";

const inFlight = { now: 0, peak: 0 };

beforeEach(() => {
  inFlight.now = 0;
  inFlight.peak = 0;
  server.use(
    http.get(ESEARCH, async () => {
      inFlight.now += 1;
      inFlight.peak = Math.max(inFlight.peak, inFlight.now);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight.now -= 1;
      return HttpResponse.json({ esearchresult: { count: "3" } });
    }),
  );
});

describe("countAll", () => {
  const items = Array.from({ length: 12 }, (_, i) => `topic-${i}`);

  it("never exceeds the rate limit NCBI allows unauthenticated callers", async () => {
    const result = await countAll(items, (item) => [item, `${item} recent`], {
      waveMs: 0,
    });
    expect(isFailure(result)).toBe(false);
    // Paced at the cap, not just under it: a fan-out that went one at a time
    // would satisfy "never over" while taking three times as long.
    expect(inFlight.peak).toBe(NCBI_MAX_CONCURRENT);
  });

  it("returns one count per term, in the order the items were given", async () => {
    // Every term gets its own count, so a shuffled or mis-grouped result shows.
    server.use(
      http.get(ESEARCH, ({ request }) => {
        const term = new URL(request.url).searchParams.get("term") ?? "";
        const counts: Record<string, string> = { a: "1", "a 2": "2", b: "3", "b 2": "4", c: "5" };
        return HttpResponse.json({ esearchresult: { count: counts[term] ?? "-1" } });
      }),
    );

    const result = await countAll(["a", "b", "c"], (item) =>
      item === "c" ? [item] : [item, `${item} 2`], { waveMs: 0 });

    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("fails the whole scan when any single count fails", async () => {
    let calls = 0;
    server.use(
      http.get(ESEARCH, () => {
        calls += 1;
        return calls > 2
          ? HttpResponse.error()
          : HttpResponse.json({ esearchresult: { count: "1" } });
      }),
    );
    const result = await countAll(items, (item) => [item], { waveMs: 0 });
    expect(isFailure(result)).toBe(true);
    // A transport failure is a 502 for the route to hand back, not a count of 0.
    expect(isFailure(result) && result.error.status).toBe(502);
  });

  it("waits between waves when it is asked to", async () => {
    const waited = vi.spyOn(globalThis, "setTimeout");
    await countAll(items.slice(0, 7), (item) => [item], { waveMs: 1 });
    // Seven requests make three waves, so two pauses between them (the 5ms
    // handler delay uses setTimeout too, so count only the 1ms ones).
    expect(waited.mock.calls.filter(([, delay]) => delay === 1)).toHaveLength(2);
    waited.mockRestore();
  });
});

describe("countMatches", () => {
  it("reads the count out of an esearch response", async () => {
    expect(await countMatches("aneurysm")).toBe(3);
  });

  it("sends the term URL-encoded, asking for the count only", async () => {
    let seen: URL | undefined;
    server.use(
      http.get(ESEARCH, ({ request }) => {
        seen = new URL(request.url);
        return HttpResponse.json({ esearchresult: { count: "1" } });
      }),
    );
    await countMatches('"Aortic Aneurysm"[mh] AND x&y');
    expect(seen?.searchParams.get("term")).toBe('"Aortic Aneurysm"[mh] AND x&y');
    expect(seen?.searchParams.get("rettype")).toBe("count");
  });

  it.each([
    ["PubMed answers with an error status", () => new HttpResponse("no", { status: 500 }), /rejected the search/],
    ["PubMed answers with something that isn't JSON", () => new HttpResponse("<html>", { status: 200 }), /unreadable/],
    ["PubMed answers JSON that isn't a search result", () => HttpResponse.json({ nope: true }), /unexpected search payload/],
  ])("hands back a 502 when %s", async (_label, respond, message) => {
    server.use(http.get(ESEARCH, respond));

    const result = await countMatches("aneurysm");

    expect(isFailure(result) && result.error.status).toBe(502);
    expect(isFailure(result) && (await result.error.json()).error).toMatch(message);
  });

  it("hands back a 504 when PubMed doesn't answer in time", async () => {
    const expired = vi
      .spyOn(AbortSignal, "timeout")
      .mockImplementation(() => AbortSignal.abort(Object.assign(new Error("timed out"), { name: "TimeoutError" })));
    const result = await countMatches("aneurysm");
    expired.mockRestore();
    expect(isFailure(result) && result.error.status).toBe(504);
  });
});

describe("searchPublications", () => {
  const ESUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
  const summary = {
    result: { uids: ["101"], "101": { uid: "101", title: "Sex differences in AAA repair", pubdate: "2026" } },
  };

  it("searches for ids, then fetches their summaries", async () => {
    let summaryIds: string | null = null;
    server.use(
      http.get(ESEARCH, () => HttpResponse.json({ esearchresult: { count: "250", idlist: ["101"] } })),
      http.get(ESUMMARY, ({ request }) => {
        summaryIds = new URL(request.url).searchParams.get("id");
        return HttpResponse.json(summary);
      }),
    );

    const result = await searchPublications("aneurysm", { limit: 5 });

    expect(isFailure(result)).toBe(false);
    expect(!isFailure(result) && result).toMatchObject({ total: 250 });
    expect(!isFailure(result) && result.publications.map((p) => p.title)).toEqual(["Sex differences in AAA repair"]);
    expect(summaryIds).toBe("101");
  });

  it("costs one request, and reports the total, when nothing matched", async () => {
    let summaryCalls = 0;
    server.use(
      http.get(ESEARCH, () => HttpResponse.json({ esearchresult: { count: "0", idlist: [] } })),
      http.get(ESUMMARY, () => {
        summaryCalls += 1;
        return HttpResponse.json(summary);
      }),
    );

    expect(await searchPublications("nothing")).toEqual({ total: 0, publications: [] });
    expect(summaryCalls).toBe(0);
  });

  it("asks PubMed for the newest first, up to the limit", async () => {
    let seen: URL | undefined;
    server.use(
      http.get(ESEARCH, ({ request }) => {
        seen = new URL(request.url);
        return HttpResponse.json({ esearchresult: { count: "0", idlist: [] } });
      }),
    );
    await searchPublications("aneurysm", { limit: 7 });
    expect(seen?.searchParams.get("sort")).toBe("date");
    expect(seen?.searchParams.get("retmax")).toBe("7");
  });

  it("hands back a 502 when the summary call fails or is malformed", async () => {
    server.use(
      http.get(ESEARCH, () => HttpResponse.json({ esearchresult: { count: "1", idlist: ["101"] } })),
      http.get(ESUMMARY, () => new HttpResponse("no", { status: 503 })),
    );
    const failed = await searchPublications("aneurysm");
    expect(isFailure(failed) && failed.error.status).toBe(502);

    server.use(http.get(ESUMMARY, () => HttpResponse.json({ result: { uids: ["101"], "101": { nope: 1 } } })));
    const malformed = await searchPublications("aneurysm");
    expect(isFailure(malformed) && (await malformed.error.json()).error).toMatch(/unexpected summary payload/);
  });

  it("hands back a 502 when the search payload is malformed", async () => {
    server.use(http.get(ESEARCH, () => HttpResponse.json({ nope: true })));
    const result = await searchPublications("aneurysm");
    expect(isFailure(result) && (await result.error.json()).error).toMatch(/unexpected search payload/);
  });
});

describe("europePmcSearch", () => {
  const EUROPE_PMC = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

  async function requestFor(options?: { pageSize?: number; core?: boolean }) {
    let seen: URL | undefined;
    server.use(
      http.get(EUROPE_PMC, ({ request }) => {
        seen = new URL(request.url);
        return HttpResponse.json({ resultList: { result: [] } });
      }),
    );
    await europePmcSearch("aortic aneurysm", options);
    return seen;
  }

  it("asks for JSON, newest first, 25 to a page", async () => {
    const url = await requestFor();
    expect(url?.searchParams.get("query")).toBe("aortic aneurysm");
    expect(url?.searchParams.get("format")).toBe("json");
    expect(url?.searchParams.get("sort")).toBe("P_PDATE_D desc");
    expect(url?.searchParams.get("pageSize")).toBe("25");
  });

  it("asks for the core record only when MeSH headings are wanted", async () => {
    expect((await requestFor())?.searchParams.has("resultType")).toBe(false);
    expect((await requestFor({ core: true, pageSize: 100 }))?.searchParams.get("resultType")).toBe("core");
    expect((await requestFor({ pageSize: 100 }))?.searchParams.get("pageSize")).toBe("100");
  });

  it("passes the JSON through, or a failure when Europe PMC errors", async () => {
    server.use(http.get(EUROPE_PMC, () => HttpResponse.json({ hitCount: 4 })));
    expect(await europePmcSearch("x")).toEqual({ hitCount: 4 });

    server.use(http.get(EUROPE_PMC, () => new HttpResponse("no", { status: 500 })));
    const failed = await europePmcSearch("x");
    expect(isFailure(failed) && failed.error.status).toBe(502);
  });
});
