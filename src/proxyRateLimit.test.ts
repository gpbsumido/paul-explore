import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { auth0 } from "@/lib/auth0";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), middleware: vi.fn() },
}));

const post = (path: string, ip: string) =>
  new NextRequest(new URL(path, "https://paulsumido.com"), {
    method: "POST",
    headers: { "x-real-ip": ip },
  });

/** Sends `count` POSTs from one address and returns their statuses. */
async function flood(path: string, ip: string, count: number): Promise<number[]> {
  const statuses: number[] = [];
  for (let i = 0; i < count; i++) statuses.push((await proxy(post(path, ip))).status);
  return statuses;
}

/**
 * The proxy is where every rate limit is enforced, from one rule table, so a
 * flood is refused before any route code or session work runs.
 */
describe("proxy rate limiting", () => {
  beforeEach(async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(null);
    const { NextResponse } = await import("next/server");
    vi.mocked(auth0.middleware).mockImplementation(async () => NextResponse.next());
  });

  it("refuses the 21st vitals beacon in a minute, and says when to retry", async () => {
    const statuses = await flood("/api/vitals", "203.0.113.40", 21);

    expect(statuses.slice(0, 20).every((status) => status !== 429)).toBe(true);
    expect(statuses[20]).toBe(429);

    const res = await proxy(post("/api/vitals", "203.0.113.40"));
    expect(res.headers.get("X-RateLimit-Limit")).toBe("20");
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("refuses the 61st ZeroProof telemetry batch at the proxy", async () => {
    const statuses = await flood("/api/zeroproof/track", "203.0.113.41", 61);

    expect(statuses.slice(0, 60).every((status) => status !== 429)).toBe(true);
    expect(statuses[60]).toBe(429);
  });

  it("counts each address on its own", async () => {
    await flood("/api/vitals", "203.0.113.42", 21);

    expect((await proxy(post("/api/vitals", "203.0.113.43"))).status).not.toBe(429);
  });
});
