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

  it("has no axe violations", async () => {
    server.use(http.get("/api/zeroproof/ingest-health", () => HttpResponse.json(health)));
    const { container } = renderAdmin();
    await screen.findByRole("table", { name: /real-sports ingest health/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
