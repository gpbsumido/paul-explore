import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createReferral,
  getReferralStats,
  recordReferralClick,
} from "./referrals";

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("referrals client", () => {
  it("posts to the referrals endpoint and parses the created link", async () => {
    const created = {
      slug: "abc123",
      targetPath: "/work-portfolio",
      label: null,
      url: "https://paulsumido.com/r/abc123",
      clicks: 0,
      createdAt: "2026-07-20T00:00:00.000Z",
    };
    const fetchMock = mockFetch(201, created);

    const result = await createReferral({ targetPath: "/work-portfolio" });

    expect(result).toEqual(created);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/referrals$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ targetPath: "/work-portfolio" });
  });

  it("surfaces a taken slug (409) as a friendly error", async () => {
    mockFetch(409, { error: "ConflictError" });
    await expect(createReferral({ slug: "taken" })).rejects.toThrow(
      /already taken/i,
    );
  });

  it("records a click via POST to the clicks endpoint", async () => {
    const fetchMock = mockFetch(200, {
      slug: "abc123",
      targetPath: "/",
      clicks: 4,
    });
    const result = await recordReferralClick("abc123");
    expect(result.clicks).toBe(4);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/referrals\/abc123\/clicks$/);
    expect(init.method).toBe("POST");
  });

  it("parses stats", async () => {
    mockFetch(200, {
      slug: "abc123",
      targetPath: "/",
      clicks: 2,
      recent: [{ at: "2026-07-20T01:00:00.000Z" }],
    });
    const stats = await getReferralStats("abc123");
    expect(stats.clicks).toBe(2);
    expect(stats.recent).toHaveLength(1);
  });
});
