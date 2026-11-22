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
import { VITALS_ALERT_LABEL, VITALS_ALERT_TITLE } from "@/lib/vitalsAlert";
import { forgiveUnexpectedOutput } from "@/test/unexpectedOutput";

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
  // reset, not just clear, so one test's mocked GitHub answers cannot reach the next
  vi.resetAllMocks();
});

describe("GET /api/vitals/alert", () => {
  it("rejects a request without the cron secret, touching nothing", async () => {
    const { GET } = await import("./route");

    const res = await GET(alertRequest());

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
    expect(findOpenIssue).not.toHaveBeenCalled();
  });

  it("rejects the wrong secret", async () => {
    const { GET } = await import("./route");

    const res = await GET(alertRequest("Bearer not-the-secret"));

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("rejects everyone when no secret is configured, even one that spells 'undefined'", async () => {
    vi.stubEnv("CRON_SECRET", undefined);
    const { GET } = await import("./route");

    expect((await GET(alertRequest("Bearer undefined"))).status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
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
    const issue = vi.mocked(createIssue).mock.calls[0][0];
    expect(issue).toMatchObject({
      repo: "gpbsumido/paul-explore",
      token: "ghp_test",
      label: VITALS_ALERT_LABEL,
      title: VITALS_ALERT_TITLE,
    });
    expect(issue.body).toContain("LCP");
  });

  it("looks for the open alert by its label in the configured repo", async () => {
    vi.stubEnv("GITHUB_REPOSITORY", "someone/else");
    upstream();
    vi.mocked(findOpenIssue).mockResolvedValue(null);
    const { GET } = await import("./route");

    await GET(alertRequest(`Bearer ${SECRET}`));

    expect(findOpenIssue).toHaveBeenCalledWith({
      repo: "someone/else",
      token: "ghp_test",
      label: VITALS_ALERT_LABEL,
    });
  });

  it("falls back to this repo when GITHUB_REPOSITORY is not set", async () => {
    vi.stubEnv("GITHUB_REPOSITORY", "");
    upstream();
    vi.mocked(findOpenIssue).mockResolvedValue(null);
    const { GET } = await import("./route");

    await GET(alertRequest(`Bearer ${SECRET}`));

    expect(vi.mocked(findOpenIssue).mock.calls[0][0].repo).toBe(
      "gpbsumido/paul-explore",
    );
  });

  it("updates the existing issue instead of opening a duplicate", async () => {
    upstream({ summary: poorLcp });
    vi.mocked(findOpenIssue).mockResolvedValue({ number: 7 });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));

    expect(res.status).toBe(200);
    expect(updateIssue).toHaveBeenCalledTimes(1);
    expect(vi.mocked(updateIssue).mock.calls[0][0]).toMatchObject({ number: 7 });
    expect(vi.mocked(updateIssue).mock.calls[0][0].body).toContain("LCP");
    expect(createIssue).not.toHaveBeenCalled();
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

    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ dispatched: true, recovered: true });
    expect(closeIssue).toHaveBeenCalledTimes(1);
    expect(vi.mocked(closeIssue).mock.calls[0][0]).toMatchObject({
      number: 7,
      comment: "All vitals are back within thresholds. Closing.",
    });
  });

  it("keeps the issue open while only one of the three checks has recovered", async () => {
    upstream({
      summary: { LCP: { p75: 1500 } },
      byPage: [
        { page: "/projects", total: 80, metrics: { LCP: { p75: 4300, count: 80 } } },
      ],
    });
    vi.mocked(findOpenIssue).mockResolvedValue({ number: 7 });
    const { GET } = await import("./route");

    await GET(alertRequest(`Bearer ${SECRET}`));

    expect(closeIssue).not.toHaveBeenCalled();
    expect(updateIssue).toHaveBeenCalledTimes(1);
  });

  it("still dispatches on a site breach when the by-page fetch fails", async () => {
    vi.mocked(fetchUpstream).mockImplementation(async (url: string) => {
      if (url.includes("/by-page")) return unreachable;
      if (url.includes("/by-version")) return ok({ byVersion: [] });
      return ok({ summary: poorLcp });
    });
    vi.mocked(findOpenIssue).mockResolvedValue(null);
    vi.mocked(createIssue).mockResolvedValue({ number: 5 });
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(body.findings).toEqual({ site: 1, pages: 0, regressions: 0 });
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(forgiveUnexpectedOutput()).toEqual([
      "[vitals alert] by-page unavailable; skipping that section",
    ]);
  });

  it("returns 502 when the summary comes back with an error status", async () => {
    vi.mocked(fetchUpstream).mockImplementation(async (url: string) =>
      url.includes("/summary")
        ? ({
            ok: true,
            response: new Response(JSON.stringify({ summary: {} }), { status: 500 }),
          } as Awaited<ReturnType<typeof fetchUpstream>>)
        : ok({ byPage: [] }),
    );
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));

    expect(res.status).toBe(502);
    expect(createIssue).not.toHaveBeenCalled();
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
    expect(forgiveUnexpectedOutput()).toEqual([
      "[vitals alert] by-version unavailable; skipping that section",
    ]);
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
    expect(forgiveUnexpectedOutput()).toEqual([
      "[vitals alert] VITALS_ALERT_GITHUB_TOKEN unset; not dispatching",
    ]);
  });

  it("degrades to dispatched:false when a GitHub call throws", async () => {
    upstream({ summary: poorLcp });
    vi.mocked(findOpenIssue).mockRejectedValue(new Error("GitHub down"));
    const { GET } = await import("./route");

    const res = await GET(alertRequest(`Bearer ${SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ dispatched: false });
    expect(forgiveUnexpectedOutput()).toEqual([
      "[vitals alert] GitHub dispatch failed: Error: GitHub down",
    ]);
  });
});
