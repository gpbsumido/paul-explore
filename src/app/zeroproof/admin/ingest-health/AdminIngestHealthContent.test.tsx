import { describe, it, expect, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";
import AdminIngestHealthContent from "./AdminIngestHealthContent";

const health = {
  sports: [
    {
      source: "basketball_nba",
      stage: "results",
      lastCheckedAt: "2026-09-09T00:00:00.000Z",
      lastOkAt: null,
      lastError: "The Odds API scores returned 429 for basketball_nba",
    },
    {
      source: "baseball_mlb",
      stage: "odds",
      lastCheckedAt: "2026-09-09T00:00:00.000Z",
      lastOkAt: "2026-09-09T00:00:00.000Z",
      lastError: null,
    },
  ],
  espnLeagues: [
    {
      game: "fba",
      leagueId: "449389534",
      season: "2027",
      lastCheckedAt: "2026-09-09T00:00:00.000Z",
      lastOkAt: null,
      lastError: "ESPN fantasy returned 401 for fba:449389534:2027",
    },
  ],
};

const renderAdmin = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <AdminIngestHealthContent />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

afterEach(() => server.resetHandlers());

describe("AdminIngestHealthContent", () => {
  it("shows a failing sport's error and a healthy sport's OK", async () => {
    server.use(http.get("/api/zeroproof/ingest-health", () => HttpResponse.json(health)));
    renderAdmin();
    const table = await screen.findByRole("table", { name: /real-sports ingest health/i });
    expect(within(table).getByText(/429 for basketball_nba/i)).toBeInTheDocument();
    expect(within(table).getByText(/^OK$/i)).toBeInTheDocument();
  });

  it("shows ESPN league health too", async () => {
    server.use(http.get("/api/zeroproof/ingest-health", () => HttpResponse.json(health)));
    renderAdmin();
    const table = await screen.findByRole("table", { name: /espn league ingest health/i });
    expect(within(table).getByText(/401 for fba:449389534:2027/i)).toBeInTheDocument();
  });

  it("puts each status against its own source, not just somewhere in the table", async () => {
    server.use(http.get("/api/zeroproof/ingest-health", () => HttpResponse.json(health)));
    renderAdmin();
    const table = await screen.findByRole("table", { name: /real-sports ingest health/i });

    const failing = within(table).getByRole("row", { name: /basketball_nba/ });
    expect(failing).toHaveTextContent("429 for basketball_nba");
    expect(failing).not.toHaveTextContent("OK \u00b7");
    const healthy = within(table).getByRole("row", { name: /baseball_mlb/ });
    expect(healthy).toHaveTextContent("OK \u00b7 checked");
    expect(healthy).not.toHaveTextContent("429");
  });

  it("says a failing source never resolved, or when it last did", async () => {
    server.use(
      http.get("/api/zeroproof/ingest-health", () =>
        HttpResponse.json({
          sports: [
            { ...health.sports[0], lastOkAt: null },
            {
              ...health.sports[0],
              source: "icehockey_nhl",
              lastError: "scores returned 500",
              lastOkAt: "2026-09-01T00:00:00.000Z",
            },
          ],
          espnLeagues: [],
        }),
      ),
    );
    renderAdmin();
    const table = await screen.findByRole("table", { name: /real-sports ingest health/i });

    expect(within(table).getByRole("row", { name: /basketball_nba/ })).toHaveTextContent(
      "never resolved",
    );
    const resolvedBefore = within(table).getByRole("row", { name: /icehockey_nhl/ });
    expect(resolvedBefore).toHaveTextContent("last ok");
    expect(resolvedBefore).not.toHaveTextContent("never resolved");
  });

  it("says so when nothing has been recorded", async () => {
    server.use(
      http.get("/api/zeroproof/ingest-health", () =>
        HttpResponse.json({ sports: [], espnLeagues: [] }),
      ),
    );
    renderAdmin();

    expect(await screen.findByText(/nothing recorded yet/i)).toBeInTheDocument();
    expect(screen.getByText("None checked yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("says the health could not be loaded instead of showing an empty report", async () => {
    server.use(
      http.get("/api/zeroproof/ingest-health", () => new HttpResponse(null, { status: 503 })),
    );
    renderAdmin();

    expect(await screen.findByText("Couldn't load ingest health (503)")).toBeInTheDocument();
    expect(screen.queryByText(/nothing recorded yet/i)).toBeNull();
  });

  it("has no axe violations", async () => {
    server.use(http.get("/api/zeroproof/ingest-health", () => HttpResponse.json(health)));
    const { container } = renderAdmin();
    await screen.findByRole("table", { name: /real-sports ingest health/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
