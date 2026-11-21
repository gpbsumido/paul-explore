import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";

// No session by default; a test signs in by setting a token.
const session = vi.hoisted(() => ({ token: undefined as string | undefined }));

vi.mock("@/lib/auth0", () => ({
  auth0: {
    getAccessToken: async () => {
      if (session.token === undefined) throw new Error("no session");
      return { token: session.token };
    },
  },
}));

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

import VitalsPage from "./page";

/**
 * Stubs the three data endpoints and hands back the list of URLs they were
 * called with, so a test can assert on the query the page actually sent —
 * including the version scope it decided on.
 */
function recordDataCalls() {
  const requested: string[] = [];
  const record = (path: string) =>
    http.get(`${API_URL}/api/vitals/${path}`, ({ request }) => {
      requested.push(request.url);
      return HttpResponse.json({ summary: {}, byPage: [], byVersion: [] });
    });

  server.use(record("summary"), record("by-page"), record("by-version"));
  return requested;
}

afterEach(() => {
  session.token = undefined;
});

const renderPage = async (searchParams: { v?: string } = {}) =>
  render(await VitalsPage({ searchParams: Promise.resolve(searchParams) }));

/** The scope a recorded request asked for, read as parameters rather than substrings. */
const scopeOf = (url: string) => {
  const { searchParams } = new URL(url);
  return { v: searchParams.get("v"), mode: searchParams.get("mode") };
};

const answerWithVersions = (versions: string[]) =>
  server.use(
    http.get(`${API_URL}/api/vitals/versions`, () =>
      HttpResponse.json({ versions }),
    ),
  );

describe("VitalsPage when the versions endpoint is unreachable", () => {
  it("does not fall back to a version that never existed", async () => {
    server.use(
      http.get(`${API_URL}/api/vitals/versions`, () => HttpResponse.error()),
    );
    const requested = recordDataCalls();

    await renderPage();

    expect(requested.filter((url) => url.includes("v=0"))).toEqual([]);
    expect(requested).toEqual([]);
  });

  it("tells the visitor the API is down", async () => {
    server.use(
      http.get(`${API_URL}/api/vitals/versions`, () => HttpResponse.error()),
    );
    recordDataCalls();

    await renderPage();

    expect(
      screen.getByText(/couldn't reach the vitals api/i),
    ).toBeInTheDocument();
  });

  it("treats a 500 the same way, because a broken backend is not an empty one", async () => {
    server.use(
      http.get(`${API_URL}/api/vitals/versions`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );
    const requested = recordDataCalls();

    await renderPage();

    expect(
      screen.getByText(/couldn't reach the vitals api/i),
    ).toBeInTheDocument();
    expect(requested).toEqual([]);
  });
});

describe("VitalsPage when the versions endpoint answers", () => {
  it("scopes to the current major", async () => {
    server.use(
      http.get(`${API_URL}/api/vitals/versions`, () =>
        HttpResponse.json({ versions: ["5.1.0", "4.5.9"] }),
      ),
    );
    const requested = recordDataCalls();

    await renderPage();

    expect(requested).toHaveLength(3);
    for (const url of requested) {
      expect(scopeOf(url)).toEqual({ v: "5", mode: "major" });
    }
    expect(screen.queryByText(/couldn't reach the vitals api/i)).toBeNull();
  });

  it.each([
    ["major:3", { v: "3", mode: "major" }],
    ["minor:4.2", { v: "4.2", mode: "minor" }],
    ["4.5.8", { v: "4.5.8", mode: null }],
  ])("honours ?v=%s over the current major", async (urlVersion, expected) => {
    answerWithVersions(["4.5.9", "4.5.8"]);
    const requested = recordDataCalls();

    await renderPage({ v: urlVersion });

    expect(requested).toHaveLength(3);
    for (const url of requested) expect(scopeOf(url)).toEqual(expected);
  });

  it("forwards the visitor's token on every call when they are signed in", async () => {
    session.token = "visitor-token";
    const authorizations: (string | null)[] = [];
    server.use(
      http.get(`${API_URL}/api/vitals/versions`, ({ request }) => {
        authorizations.push(request.headers.get("authorization"));
        return HttpResponse.json({ versions: ["4.5.9"] });
      }),
      ...["summary", "by-page", "by-version"].map((path) =>
        http.get(`${API_URL}/api/vitals/${path}`, ({ request }) => {
          authorizations.push(request.headers.get("authorization"));
          return HttpResponse.json({ summary: {}, byPage: [], byVersion: [] });
        }),
      ),
    );

    await renderPage();

    expect(authorizations).toEqual(Array(4).fill("Bearer visitor-token"));
  });

  it("sends no authorization for a signed-out visitor, and still renders", async () => {
    const authorizations: (string | null)[] = [];
    server.use(
      http.get(`${API_URL}/api/vitals/versions`, ({ request }) => {
        authorizations.push(request.headers.get("authorization"));
        return HttpResponse.json({ versions: ["4.5.9"] });
      }),
    );
    recordDataCalls();

    await renderPage();

    expect(authorizations).toEqual([null]);
    expect(screen.getByRole("heading", { name: "Core Web Vitals" })).toBeInTheDocument();
  });

  it("shows the empty state, not a crash, when the data endpoints error", async () => {
    answerWithVersions(["4.5.9"]);
    server.use(
      http.get(`${API_URL}/api/vitals/summary`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
      http.get(`${API_URL}/api/vitals/by-page`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
      http.get(`${API_URL}/api/vitals/by-version`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    await renderPage();

    expect(
      screen.getByText(/visit a few pages and check back/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/couldn't reach the vitals api/i)).toBeNull();
  });

  it("renders the rows the by-page endpoint returns", async () => {
    answerWithVersions(["4.5.9"]);
    recordDataCalls();
    server.use(
      http.get(`${API_URL}/api/vitals/by-page`, () =>
        HttpResponse.json({
          byPage: [
            { page: "/thoughts", total: 40, metrics: { LCP: { p75: 1800, count: 40 } } },
          ],
        }),
      ),
    );

    await renderPage();

    expect(screen.getByRole("row", { name: /\/thoughts/ })).toBeInTheDocument();
  });

  it("asks for all-time data when no versions exist yet, not a version zero", async () => {
    // A reachable backend with an empty versions list is a fresh database,
    // and a fresh database has no major "0" to scope to. The queries should
    // carry no version filter at all.
    server.use(
      http.get(`${API_URL}/api/vitals/versions`, () =>
        HttpResponse.json({ versions: [] }),
      ),
    );
    const requested = recordDataCalls();

    await renderPage();

    expect(requested).toHaveLength(3);
    for (const url of requested) {
      expect(url).not.toContain("v=");
      expect(url).not.toContain("mode=");
    }
    expect(screen.queryByText(/couldn't reach the vitals api/i)).toBeNull();
  });

  it("keeps working when the versions endpoint is not deployed", async () => {
    server.use(
      http.get(`${API_URL}/api/vitals/versions`, () =>
        HttpResponse.json({ error: "not found" }, { status: 404 }),
      ),
    );
    const requested = recordDataCalls();

    await renderPage();

    expect(requested).toHaveLength(3);
    expect(screen.queryByText(/couldn't reach the vitals api/i)).toBeNull();
  });
});
