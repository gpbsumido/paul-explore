import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";

vi.mock("@/lib/auth0", () => ({
  auth0: {
    getAccessToken: async () => {
      throw new Error("no session");
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

const renderPage = async () =>
  render(await VitalsPage({ searchParams: Promise.resolve({}) }));

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
        HttpResponse.json({ versions: ["4.5.9", "4.5.8"] }),
      ),
    );
    const requested = recordDataCalls();

    await renderPage();

    expect(requested).toHaveLength(3);
    for (const url of requested) {
      expect(url).toContain("v=4");
      expect(url).toContain("mode=major");
    }
    expect(screen.queryByText(/couldn't reach the vitals api/i)).toBeNull();
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
