import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { countAll, isFailure, NCBI_MAX_CONCURRENT } from "./eutils";

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
    expect(inFlight.peak).toBeLessThanOrEqual(NCBI_MAX_CONCURRENT);
  });

  it("returns one count per term, in the order the items were given", async () => {
    const result = await countAll(["a", "b"], (item) => [item, `${item} 2`], {
      waveMs: 0,
    });
    expect(result).toEqual([
      [3, 3],
      [3, 3],
    ]);
  });

  it("fails the whole scan when any single count fails", async () => {
    let calls = 0;
    server.use(
      http.get(ESEARCH, () => {
        calls += 1;
        return calls > 2 ? HttpResponse.error() : HttpResponse.json({ esearchresult: { count: "1" } });
      }),
    );
    const result = await countAll(items, (item) => [item], { waveMs: 0 });
    expect(isFailure(result)).toBe(true);
  });
});
