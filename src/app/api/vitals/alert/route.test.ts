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

const ok = (body: unknown) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const unreachable = {
  ok: false,
  cause: "unreachable",
  message: "down",
} as Awaited<ReturnType<typeof fetchUpstream>>;

/**
 * Routes each upstream URL to a body. Anything not provided defaults to a
 * healthy/empty response, so a test only spells out the endpoint it cares about.
 */
function upstream({
  summary = {},
  byPage = [],
  byVersion = [],
}: {
  summary?: Record<string, { p75: number }>;
  byPage?: unknown[];
  byVersion?: unknown[];
} = {}) {
  vi.mocked(fetchUpstream).mockImplementation(async (url: string) => {
    if (url.includes("/by-page")) return ok({ byPage });
    if (url.includes("/by-version")) return ok({ byVersion });
    return ok({ summary });
  });
}

const poorLcp = { LCP: { p75: 6000 } };

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

  it("opens an issue for a site-wide Poor metric", async () => {
    upstream({ summary: poorLcp });
    vi.mocked(findOpenIssue).mockResolvedValue(null);
    vi.mocked(createIssue).mockResolvedValue({ number: 1 });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ dispatched: true });
    expect(body.findings.site).toBe(1);
    expect(createIssue).toHaveBeenCalledTimes(1);
  });

  it("opens an issue when only a single page is Poor and the site-wide average is fine", async () => {
    upstream({
      summary: { LCP: { p75: 1500 } },
      byPage: [
        { page: "/projects", total: 80, metrics: { LCP: { p75: 4300, count: 80 } } },
      ],
    });
    vi.mocked(findOpenIssue).mockResolvedValue(null);
    vi.mocked(createIssue).mockResolvedValue({ number: 2 });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.findings.site).toBe(0);
    expect(body.findings.pages).toBe(1);
    expect(createIssue).toHaveBeenCalledTimes(1);
  });

  it("opens an issue when only a release regressed a band", async () => {
    upstream({
      byVersion: [
        { version: "5.2.1", metrics: { LCP: { p75: 1800, total: 100 } } },
        { version: "5.3.0", metrics: { LCP: { p75: 2700, total: 100 } } },
      ],
    });
    vi.mocked(findOpenIssue).mockResolvedValue(null);
    vi.mocked(createIssue).mockResolvedValue({ number: 3 });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.findings.regressions).toBe(1);
    expect(createIssue).toHaveBeenCalledTimes(1);
  });

  it("closes the issue when site, pages and releases are all clean", async () => {
    upstream();
    vi.mocked(findOpenIssue).mockResolvedValue({ number: 7 });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));

    expect(res.status).toBe(200);
    expect(closeIssue).toHaveBeenCalledTimes(1);
  });

  it("writes nothing when everything is clean and no issue is open", async () => {
    upstream();
    vi.mocked(findOpenIssue).mockResolvedValue(null);
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(body).toMatchObject({ dispatched: false });
    expect(createIssue).not.toHaveBeenCalled();
    expect(closeIssue).not.toHaveBeenCalled();
  });

  it("still dispatches on a site breach when the by-version fetch fails", async () => {
    vi.mocked(fetchUpstream).mockImplementation(async (url: string) => {
      if (url.includes("/by-version")) return unreachable;
      if (url.includes("/by-page")) return ok({ byPage: [] });
      return ok({ summary: poorLcp });
    });
    vi.mocked(findOpenIssue).mockResolvedValue(null);
    vi.mocked(createIssue).mockResolvedValue({ number: 4 });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.findings.site).toBe(1);
    expect(body.findings.regressions).toBe(0);
    expect(createIssue).toHaveBeenCalledTimes(1);
  });

  it("returns 502 and dispatches nothing when the summary fetch fails", async () => {
    vi.mocked(fetchUpstream).mockImplementation(async (url: string) => {
      if (url.includes("/summary")) return unreachable;
      return ok({ byPage: [] });
    });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));

    expect(res.status).toBe(502);
    expect(findOpenIssue).not.toHaveBeenCalled();
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("degrades to dispatched:false when the GitHub token is absent", async () => {
    vi.stubEnv("VITALS_ALERT_GITHUB_TOKEN", "");
    upstream({ summary: poorLcp });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ dispatched: false });
    expect(findOpenIssue).not.toHaveBeenCalled();
  });

  it("degrades to dispatched:false when a GitHub call throws", async () => {
    upstream({ summary: poorLcp });
    vi.mocked(findOpenIssue).mockRejectedValue(new Error("GitHub down"));
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ dispatched: false });
  });
});
