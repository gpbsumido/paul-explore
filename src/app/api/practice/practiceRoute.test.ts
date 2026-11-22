import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";
import { GET, PUT, POST } from "./[[...path]]/route";
import { forgiveUnexpectedOutput } from "@/test/unexpectedOutput";
import { importPracticeReviews, type ReviewStatesByKind } from "@/lib/leetcode/practiceApi";
import { PATTERNS } from "@/lib/leetcode/patterns";

const params = (...path: string[]) => ({ params: Promise.resolve({ path }) });

/**
 * The heaviest real visitor: every playbook problem re-solved many times and
 * drilled many times, so every number in the review is at its widest.
 */
const everyProblemReviewedInBothModes = (): ReviewStatesByKind => {
  const reviewed = Object.fromEntries(
    PATTERNS.flatMap((pattern) => pattern.problems).map((problem) => [
      problem.slug,
      { step: 5, due: Date.parse("2027-01-21T13:45:12.345Z"), lastReviewed: Date.parse("2026-11-22T13:45:12.345Z"), reviews: 120 },
    ]),
  );
  return { problem: reviewed, drill: reviewed };
};

/**
 * Captures the exact body the browser's importer would POST, so the size
 * check runs against the real shape rather than a guess at it.
 */
const importBodyFor = async (local: ReviewStatesByKind): Promise<string> => {
  const browserFetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify({ reviews: [] }), { status: 200 }));
  await importPracticeReviews(local);
  const body = browserFetch.mock.calls[0][1]?.body;
  browserFetch.mockRestore();
  if (typeof body !== "string") throw new Error("the importer sent no string body");
  return body;
};

const upstreamReturns = (body: unknown) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(JSON.stringify(body), { status: 200 }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "t",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

describe("practice proxy", () => {
  it("reads the caller's reviews from the backend", async () => {
    upstreamReturns({ reviews: [] });

    const res = await GET(new NextRequest("http://localhost/api/practice/reviews"), params("reviews"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reviews: [] });
    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toMatch(/\/api\/practice\/reviews$/);
  });

  it("forwards a saved review with its body", async () => {
    upstreamReturns({ review: { kind: "problem", itemId: "two-sum" } });
    const body = JSON.stringify({ step: 0, dueAt: "2026-11-05T00:00:00.000Z", lastReviewedAt: "2026-11-04T00:00:00.000Z", reviews: 1 });

    const res = await PUT(
      new NextRequest("http://localhost/x", { method: "PUT", body }),
      params("reviews", "problem", "two-sum"),
    );

    expect(res.status).toBe(200);
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toMatch(/\/api\/practice\/reviews\/problem\/two-sum$/);
    expect(init).toMatchObject({ method: "PUT", body });
  });

  it("forwards an import with its body", async () => {
    upstreamReturns({ reviews: [] });
    const body = JSON.stringify({ reviews: [] });

    await POST(new NextRequest("http://localhost/x", { method: "POST", body }), params("reviews", "import"));

    expect(vi.mocked(fetchUpstream).mock.calls[0][1]).toMatchObject({ method: "POST", body });
  });

  it("rejects a path segment that isn't a slug and never calls the backend", async () => {
    const res = await GET(new NextRequest("http://localhost/x"), params("reviews", ".."));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("answers 401 when nobody is signed in, so the page keeps its local progress", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));

    const res = await GET(new NextRequest("http://localhost/x"), params("reviews"));

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
    expect(forgiveUnexpectedOutput()).toEqual(["[practice GET] auth failed: Error: no session"]);
  });

  it("sends the caller's token, and a JSON content type only when there is a body", async () => {
    upstreamReturns({ reviews: [] });

    await GET(new NextRequest("http://localhost/x"), params("reviews"));
    await PUT(
      new NextRequest("http://localhost/x", { method: "PUT", body: "{}" }),
      params("reviews", "problem", "two-sum"),
    );

    const [, getInit] = vi.mocked(fetchUpstream).mock.calls[0];
    const [, putInit] = vi.mocked(fetchUpstream).mock.calls[1];
    expect(getInit?.headers).toEqual({ Authorization: "Bearer t" });
    expect(getInit?.body).toBeUndefined();
    expect(putInit?.headers).toEqual({
      Authorization: "Bearer t",
      "Content-Type": "application/json",
    });
  });

  it("reaches the practice root when no path is given", async () => {
    upstreamReturns({});

    await GET(new NextRequest("http://localhost/x"), { params: Promise.resolve({}) });

    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toMatch(/\/api\/practice$/);
  });

  it.each(["a/b", "two sum", "two_sum", "%2e%2e", "a.b"])(
    "rejects the segment %j without calling the backend",
    async (segment) => {
      const res = await GET(new NextRequest("http://localhost/x"), params("reviews", segment));

      expect(res.status).toBe(400);
      expect(fetchUpstream).not.toHaveBeenCalled();
    },
  );

  it("passes a backend error through with its status and body", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
    });

    const res = await GET(new NextRequest("http://localhost/x"), params("reviews", "problem", "nope"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });

  it("answers with an empty object when the backend sends no JSON", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(null, { status: 200 }),
    });

    const res = await GET(new NextRequest("http://localhost/x"), params("reviews"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it("keeps the query string, like the budget proxy does", async () => {
    upstreamReturns({ reviews: [] });

    await GET(new NextRequest("http://localhost/api/practice/reviews?due=today"), params("reviews"));

    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toMatch(/\/api\/practice\/reviews\?due=today$/);
  });

  it("passes a 204 from the backend through as a 204", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(null, { status: 204 }),
    });

    const res = await PUT(
      new NextRequest("http://localhost/x", { method: "PUT", body: "{}" }),
      params("reviews", "problem", "two-sum"),
    );

    expect(res.status).toBe(204);
  });

  it("refuses a body over 64 KB with 413 and never calls the backend", async () => {
    const body = JSON.stringify({ reviews: "x".repeat(70_000) });

    const res = await POST(
      new NextRequest("http://localhost/x", { method: "POST", body }),
      params("reviews", "import"),
    );

    expect(res.status).toBe(413);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("forwards an import of every problem reviewed in both modes, which is over 64 KB", async () => {
    upstreamReturns({ reviews: [] });
    const body = await importBodyFor(everyProblemReviewedInBothModes());

    const res = await POST(
      new NextRequest("http://localhost/x", { method: "POST", body }),
      params("reviews", "import"),
    );

    expect(JSON.parse(body).reviews).toHaveLength(446);
    expect(new TextEncoder().encode(body).length).toBeGreaterThan(65_536);
    expect(res.status).toBe(200);
    expect(vi.mocked(fetchUpstream).mock.calls[0][1]).toMatchObject({ method: "POST", body });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: false,
      cause: "unreachable",
      message: "ECONNREFUSED",
    });

    const res = await GET(new NextRequest("http://localhost/x"), params("reviews"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });
});
