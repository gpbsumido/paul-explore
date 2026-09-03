import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
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

const PROFILE = {
  stats: {
    wins: 18,
    losses: 11,
    pushes: 2,
    betCount: 29,
    roiPct: 8.4,
    currentStreak: 3,
    longestStreak: 6,
    biggestHitCents: 4200,
    clvAvgPct: 2.1,
    sharpScore: 72.5,
  },
  wallets: [
    {
      id: "w1",
      mode: "season",
      principalCents: 10000,
      balanceCents: 11840,
      lockStart: "2026-09-01T00:00:00.000Z",
      lockEnd: "2026-12-01T00:00:00.000Z",
      status: "active",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  accolades: [{ id: "first_win", name: "First Win", awardedAt: "2026-09-02T00:00:00.000Z" }],
};

const renderPage = (
  meResponse: () => Response = () => new HttpResponse(null, { status: 401 }),
  betsResponse: () => Response = () => HttpResponse.json({ bets: [] }),
) => {
  server.use(
    http.get("/api/zeroproof/events", () => HttpResponse.json(EVENTS)),
    http.get("/api/zeroproof/leaderboard", () =>
      HttpResponse.json(LEADERBOARD),
    ),
    http.get("/api/zeroproof/me", () => meResponse()),
    http.get("/api/zeroproof/bets", () => betsResponse()),
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

  it("toggles between the sharp and ROI boards", async () => {
    renderPage();
    // sharp is the default board
    expect(await screen.findByText("88.5")).toBeInTheDocument();
    // now serve a different board per ?board, and switch to ROI
    server.use(
      http.get("/api/zeroproof/leaderboard", ({ request }) => {
        const board = new URL(request.url).searchParams.get("board");
        return HttpResponse.json({
          entries:
            board === "roi"
              ? [
                  {
                    userSub: "auth0|roi-king",
                    wins: 5,
                    losses: 4,
                    pushes: 0,
                    betCount: 9,
                    roiPct: 99.9,
                    sharpScore: null,
                  },
                ]
              : LEADERBOARD.entries,
        });
      }),
    );
    fireEvent.click(screen.getByRole("tab", { name: /^roi$/i }));
    expect(await screen.findByText("+99.9%")).toBeInTheDocument();
    expect(screen.queryByText("88.5")).not.toBeInTheDocument();
  });
});

describe("ZeroProofContent — profile", () => {
  it("prompts a signed-out visitor to sign in", async () => {
    renderPage();
    const cta = await screen.findByRole("link", { name: /sign in/i });
    expect(cta).toHaveAttribute("href", "/auth/login");
  });

  it("shows a signed-in player's stats, wallet balance, and accolades", async () => {
    renderPage(() => HttpResponse.json(PROFILE));
    // stats
    expect(await screen.findByText("18-11-2")).toBeInTheDocument();
    expect(screen.getByText("+8.4%")).toBeInTheDocument();
    // wallet balance in dollars from cents
    expect(screen.getByText("$118.40")).toBeInTheDocument();
    // accolade
    expect(screen.getByText("First Win")).toBeInTheDocument();
  });

  it("lists a signed-in player's recent bets with result and closing-line value", async () => {
    renderPage(
      () => HttpResponse.json(PROFILE),
      () =>
        HttpResponse.json({
          bets: [
            {
              id: "b1",
              walletId: "w1",
              eventId: "evt-1",
              market: "h2h",
              selection: "Celtics",
              oddsAmerican: 122,
              lineValue: null,
              closingOddsAmerican: 130,
              clv: 7.9,
              stakeCents: 2500,
              status: "won",
              placedAt: "2026-09-01T00:00:00.000Z",
              settledAt: "2026-09-02T00:00:00.000Z",
            },
          ],
        }),
    );
    expect(await screen.findByText(/recent bets/i)).toBeInTheDocument();
    expect(screen.getByText("won")).toBeInTheDocument();
    expect(screen.getByText(/CLV \+7\.9%/)).toBeInTheDocument();
  });

  it("tells a signed-in player with no wallet how to open one", async () => {
    renderPage(() => HttpResponse.json({ ...PROFILE, wallets: [] }));
    expect(await screen.findByText(/no wallet open yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open a season wallet/i }),
    ).toBeInTheDocument();
  });

  it("opens a wallet by posting the chosen mode", async () => {
    let openedMode: string | null = null;
    server.use(
      http.post("/api/zeroproof/wallets", async ({ request }) => {
        openedMode = ((await request.json()) as { mode: string }).mode;
        return HttpResponse.json({ id: "w-new", mode: openedMode });
      }),
    );
    renderPage(() => HttpResponse.json({ ...PROFILE, wallets: [] }));
    fireEvent.click(
      await screen.findByRole("button", { name: /open a season wallet/i }),
    );
    await waitFor(() => expect(openedMode).toBe("season"));
  });
});

describe("ZeroProofContent — bet slip", () => {
  it("fills the slip when an outcome is picked, and prompts a signed-out visitor to sign in", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });
    expect(within(slip).getByText("Celtics")).toBeInTheDocument();
    expect(
      within(slip).getByRole("link", { name: /sign in to bet/i }),
    ).toHaveAttribute("href", "/auth/login");
  });

  it("places a bet from a signed-in wallet with the picked outcome and stake", async () => {
    let placed: Record<string, unknown> | null = null;
    server.use(
      http.post("/api/zeroproof/bets", async ({ request }) => {
        placed = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: "bet-1" });
      }),
    );
    renderPage(() => HttpResponse.json(PROFILE));
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });
    fireEvent.change(within(slip).getByLabelText(/stake/i), {
      target: { value: "25" },
    });
    fireEvent.click(within(slip).getByRole("button", { name: /place bet/i }));
    await waitFor(() => expect(placed).not.toBeNull());
    expect(placed).toMatchObject({
      walletId: "w1",
      eventId: "evt-1",
      market: "h2h",
      selection: "Celtics",
      stakeCents: 2500,
    });
  });
});

describe("ZeroProofContent — live updates", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls so a bet that grades server-side appears without a reload", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let call = 0;
    const openBet = {
      id: "b1",
      walletId: "w1",
      eventId: "evt-1",
      market: "h2h",
      selection: "Celtics",
      oddsAmerican: 122,
      lineValue: null,
      closingOddsAmerican: null,
      clv: null,
      stakeCents: 2500,
      status: "open",
      placedAt: "2026-09-01T00:00:00.000Z",
      settledAt: null,
    };
    const settledBet = {
      ...openBet,
      status: "won",
      closingOddsAmerican: 130,
      clv: 7.9,
      settledAt: "2026-09-02T00:00:00.000Z",
    };
    renderPage(
      () => HttpResponse.json(PROFILE),
      () => {
        call += 1;
        return HttpResponse.json({ bets: [call === 1 ? openBet : settledBet] });
      },
    );
    expect(await screen.findByText("open")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(31_000);
    expect(await screen.findByText("won")).toBeInTheDocument();
  });
});
