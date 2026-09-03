import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";
import ZeroProofContent from "./ZeroProofContent";

const EVENTS = {
  events: [
    {
      id: "evt-1",
      sport: "basketball_nba",
      home: "Lakers",
      away: "Celtics",
      commenceTime: "2026-09-10T23:30:00.000Z",
      status: "upcoming",
      markets: [
        {
          market: "h2h",
          fetchedAt: "2026-09-10T21:00:00.000Z",
          outcomes: [
            { name: "Lakers", priceAmerican: -110 },
            { name: "Celtics", priceAmerican: 122 },
          ],
        },
      ],
    },
  ],
};

const LEADERBOARD = {
  entries: [
    {
      userSub: "auth0|sharp-one",
      wins: 41,
      losses: 22,
      pushes: 3,
      betCount: 63,
      roiPct: 14.2,
      sharpScore: 88.5,
    },
    {
      userSub: "auth0|sharp-two",
      wins: 30,
      losses: 28,
      pushes: 1,
      betCount: 58,
      roiPct: 3.1,
      sharpScore: 61.0,
    },
  ],
};

const renderPage = () => {
  server.use(
    http.get("/api/zeroproof/events", () => HttpResponse.json(EVENTS)),
    http.get("/api/zeroproof/leaderboard", () =>
      HttpResponse.json(LEADERBOARD),
    ),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ZeroProofContent />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe("ZeroProofContent — slate", () => {
  it("names the product in the only h1", () => {
    renderPage();
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent(/ZeroProof/i);
  });

  it("lists an upcoming event with both teams", async () => {
    renderPage();
    const heading = await screen.findByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent("Celtics");
    expect(heading).toHaveTextContent("Lakers");
  });

  it("shows the moneyline prices as a book writes them", async () => {
    renderPage();
    // underdog gets a leading +, favourite keeps its -
    expect(await screen.findByText("+122")).toBeInTheDocument();
    expect(screen.getByText("-110")).toBeInTheDocument();
  });

  it("links to the write-up behind the feature", async () => {
    renderPage();
    await screen.findByRole("heading", { level: 3 });
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toContain("/thoughts/zeroproof");
  });

  it("has no axe violations once the slate has loaded", async () => {
    const { container } = renderPage();
    await screen.findByRole("heading", { level: 3 });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("ZeroProofContent — leaderboard", () => {
  it("ranks players by sharp score with an opaque handle, never the raw sub", async () => {
    renderPage();
    const board = await screen.findByRole("table", { name: /leaderboard/i });
    const rows = within(board).getAllByRole("row");
    // header + two players
    expect(rows.length).toBeGreaterThanOrEqual(3);
    // the raw Auth0 sub must never reach the DOM
    expect(board.textContent).not.toContain("auth0|");
    expect(board.textContent).toContain("88.5");
  });

  it("shows each player's win-loss-push record", async () => {
    renderPage();
    await screen.findByRole("table", { name: /leaderboard/i });
    expect(screen.getByText("41-22-3")).toBeInTheDocument();
  });
});
