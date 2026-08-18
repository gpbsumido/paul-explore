import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

vi.mock("@/lib/githubIssues", () => ({
  findOpenIssue: vi.fn(),
  createIssue: vi.fn(),
  updateIssue: vi.fn(),
  closeIssue: vi.fn(),
}));

import { fetchUpstream } from "@/lib/upstream";
import {
  findOpenIssue,
  createIssue,
  updateIssue,
  closeIssue,
} from "@/lib/githubIssues";

const SECRET = "cron-s3cret";

/** An upstream summary response with the given metric P75s. */
const summaryOk = (summary: Record<string, { p75: number }>) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const poorLcp = { LCP: { p75: 6000 } };
const healthy = { LCP: { p75: 1500 } };

function alertRequest(auth?: string) {
  return new NextRequest("http://localhost:3000/api/vitals/alert", {
    headers: auth ? { authorization: auth } : undefined,
  });
}

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", SECRET);
  vi.stubEnv("VITALS_ALERT_GITHUB_TOKEN", "ghp_test");
  vi.stubEnv("GITHUB_REPOSITORY", "gpbsumido/paul-explore");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("GET /api/vitals/alert", () => {
  it("rejects a request without the cron secret, touching nothing", async () => {
    const { GET } = await import("./route");

    const res = await GET(alertRequest());

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
    expect(findOpenIssue).not.toHaveBeenCalled();
  });

  it("rejects a request whose bearer token is wrong", async () => {
    const { GET } = await import("./route");

    const res = await GET(alertRequest("Bearer nope"));

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("opens a new issue when a metric is Poor and none is open", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(summaryOk(poorLcp));
    vi.mocked(findOpenIssue).mockResolvedValue(null);
    vi.mocked(createIssue).mockResolvedValue({ number: 1 });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ dispatched: true });
    expect(body.breaches).toHaveLength(1);
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(updateIssue).not.toHaveBeenCalled();
  });

  it("updates the existing issue instead of opening a duplicate", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(summaryOk(poorLcp));
    vi.mocked(findOpenIssue).mockResolvedValue({ number: 7 });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));

    expect(res.status).toBe(200);
    expect(updateIssue).toHaveBeenCalledTimes(1);
    expect(vi.mocked(updateIssue).mock.calls[0][0]).toMatchObject({ number: 7 });
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("closes the open issue when every metric has recovered", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(summaryOk(healthy));
    vi.mocked(findOpenIssue).mockResolvedValue({ number: 7 });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(closeIssue).toHaveBeenCalledTimes(1);
    expect(body.breaches).toEqual([]);
  });

  it("writes nothing to GitHub when healthy with no open issue", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(summaryOk(healthy));
    vi.mocked(findOpenIssue).mockResolvedValue(null);
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ dispatched: false });
    expect(createIssue).not.toHaveBeenCalled();
    expect(updateIssue).not.toHaveBeenCalled();
    expect(closeIssue).not.toHaveBeenCalled();
  });

  it("returns a 502 and dispatches nothing when the summary fetch fails", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: false,
      cause: "unreachable",
      message: "down",
    } as Awaited<ReturnType<typeof fetchUpstream>>);
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));

    expect(res.status).toBe(502);
    expect(findOpenIssue).not.toHaveBeenCalled();
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("degrades to dispatched:false when the GitHub token is absent", async () => {
    vi.stubEnv("VITALS_ALERT_GITHUB_TOKEN", "");
    vi.mocked(fetchUpstream).mockResolvedValue(summaryOk(poorLcp));
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ dispatched: false });
    expect(body.breaches).toHaveLength(1);
    expect(findOpenIssue).not.toHaveBeenCalled();
  });

  it("degrades to dispatched:false when a GitHub call throws", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(summaryOk(poorLcp));
    vi.mocked(findOpenIssue).mockRejectedValue(new Error("GitHub down"));
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ dispatched: false });
  });
});
