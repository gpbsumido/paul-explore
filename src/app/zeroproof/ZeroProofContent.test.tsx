import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  eventsResponse: () => Response = () => HttpResponse.json(EVENTS),
) => {
  server.use(
    http.get("/api/zeroproof/events", () => eventsResponse()),
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

// The lobby splits Board / Leaderboard / Your record into tabs, and inactive
// panels are hidden (out of the a11y tree). Switch to the tab a test cares about.
const goToTab = async (name: RegExp) =>
  fireEvent.click(await screen.findByRole("tab", { name }));

describe("ZeroProofContent — slate", () => {
  // The board windows events to the next few days off "now"; pin it so the
  // fixture's dated event stays inside the default 3-day window.
  const SLATE_NOW = new Date("2026-09-08T00:00:00.000Z").getTime();
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(SLATE_NOW);
  });
  afterEach(() => {
    nowSpy.mockRestore();
  });

  it("names the product in the only h1", () => {
    renderPage();
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent(/ZeroProof/i);
  });

  it("lists an upcoming event with both teams", async () => {
    renderPage();
    const heading = await screen.findByRole("heading", { name: /Celtics/ });
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
    await screen.findByRole("heading", { name: /Celtics/ });
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toContain("/thoughts/zeroproof");
  });

  it("has no axe violations once the slate has loaded", async () => {
    const { container } = renderPage();
    await screen.findByRole("heading", { name: /Celtics/ });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("ZeroProofContent — tabs", () => {
  it("splits the lobby into Board, Leaderboard and Your record, Board first", async () => {
    renderPage();
    const tablist = screen.getByRole("tablist", {
      name: /zeroproof sections/i,
    });
    expect(
      within(tablist)
        .getAllByRole("tab")
        .map((t) => t.textContent),
    ).toEqual(["Board", "Leaderboard", "Your record"]);
    expect(screen.getByRole("tab", { name: "Board" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      await screen.findByRole("heading", { name: /the board/i }),
    ).toBeVisible();
  });

  it("reveals a panel's content only once its tab is selected", async () => {
    renderPage();
    // The leaderboard sits on its own tab, hidden (and out of the a11y tree) first.
    expect(screen.queryByRole("table", { name: /leaderboard/i })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Leaderboard" }));
    expect(
      await screen.findByRole("table", { name: /leaderboard/i }),
    ).toBeInTheDocument();
  });

  it("moves between tabs with the arrow keys", () => {
    renderPage();
    const board = screen.getByRole("tab", { name: "Board" });
    board.focus();
    fireEvent.keyDown(board, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Leaderboard" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

describe("ZeroProofContent — board horizon", () => {
  const NOW = new Date("2026-09-08T00:00:00.000Z").getTime();
  const boardEvent = (id: string, iso: string, home: string, away: string) => ({
    id,
    sport: "americanfootball_nfl",
    home,
    away,
    commenceTime: iso,
    status: "upcoming",
    markets: [
      {
        market: "h2h",
        fetchedAt: iso,
        outcomes: [
          { name: home, priceAmerican: -110 },
          { name: away, priceAmerican: 120 },
        ],
      },
    ],
  });
  const HORIZON_EVENTS = {
    events: [
      boardEvent("h-near", "2026-09-09T18:00:00.000Z", "Bills", "Chiefs"), // +1d
      boardEvent("h-mid", "2026-09-13T18:00:00.000Z", "Eagles", "Cowboys"), // +5d
      boardEvent("h-far", "2026-09-18T18:00:00.000Z", "Niners", "Rams"), // +10d
    ],
  };
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(NOW);
  });
  afterEach(() => {
    nowSpy.mockRestore();
  });

  const renderBoard = () =>
    renderPage(undefined, undefined, () => HttpResponse.json(HORIZON_EVENTS));

  it("shows only games within the next 3 days by default", async () => {
    renderBoard();
    expect(
      await screen.findByRole("heading", { name: /Bills/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Eagles/ })).toBeNull();
    expect(screen.queryByRole("heading", { name: /Niners/ })).toBeNull();
  });

  it("reveals games further out when you click load more", async () => {
    renderBoard();
    await screen.findByRole("heading", { name: /Bills/ });
    fireEvent.click(screen.getByRole("button", { name: /load more games/i }));
    expect(
      await screen.findByRole("heading", { name: /Eagles/ }),
    ).toBeInTheDocument();
    // +10d is still beyond the widened 6-day window.
    expect(screen.queryByRole("heading", { name: /Niners/ })).toBeNull();
  });

  it("collapses back to the next 3 days", async () => {
    renderBoard();
    await screen.findByRole("heading", { name: /Bills/ });
    fireEvent.click(screen.getByRole("button", { name: /load more games/i }));
    await screen.findByRole("heading", { name: /Eagles/ });
    fireEvent.click(
      screen.getByRole("button", { name: /show only next 3 days/i }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /Eagles/ })).toBeNull(),
    );
    expect(screen.getByRole("heading", { name: /Bills/ })).toBeInTheDocument();
  });

  it("swaps the load-more button for auto-load when the toggle is on", async () => {
    renderBoard();
    await screen.findByRole("heading", { name: /Bills/ });
    expect(
      screen.getByRole("button", { name: /load more games/i }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /auto-load as i scroll/i }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /load more games/i }),
      ).toBeNull(),
    );
    expect(screen.getByText(/loading more as you scroll/i)).toBeInTheDocument();
  });
});

describe("ZeroProofContent — board days and existing bets", () => {
  const NOW = new Date("2026-09-08T00:00:00.000Z").getTime();
  const dayLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  const ev = (id: string, iso: string, home: string, away: string) => ({
    id,
    sport: "americanfootball_nfl",
    home,
    away,
    commenceTime: iso,
    status: "upcoming",
    markets: [
      {
        market: "h2h",
        fetchedAt: iso,
        outcomes: [
          { name: home, priceAmerican: -110 },
          { name: away, priceAmerican: 120 },
        ],
      },
    ],
  });
  const betOn = (eventId: string) => ({
    id: `bet-${eventId}`,
    walletId: "w1",
    eventId,
    market: "h2h",
    selection: "Bills",
    oddsAmerican: -110,
    lineValue: null,
    closingOddsAmerican: null,
    clv: null,
    stakeCents: 2500,
    status: "open",
    placedAt: "2026-09-05T00:00:00.000Z",
    settledAt: null,
  });
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(NOW);
  });
  afterEach(() => {
    nowSpy.mockRestore();
  });

  it("groups fixtures under a heading per day", async () => {
    const events = {
      events: [
        ev("d1", "2026-09-09T18:00:00.000Z", "Bills", "Jets"),
        ev("d2", "2026-09-09T21:00:00.000Z", "Rams", "Niners"),
        ev("d3", "2026-09-10T18:00:00.000Z", "Bears", "Packers"),
      ],
    };
    renderPage(undefined, undefined, () => HttpResponse.json(events));
    expect(
      await screen.findByRole("heading", {
        name: dayLabel("2026-09-09T18:00:00.000Z"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: dayLabel("2026-09-10T18:00:00.000Z"),
      }),
    ).toBeInTheDocument();
  });

  it("flags a fixture the caller already has a bet on", async () => {
    const events = { events: [ev("evt-b", "2026-09-09T18:00:00.000Z", "Bills", "Jets")] };
    renderPage(
      () => HttpResponse.json(PROFILE),
      () => HttpResponse.json({ bets: [betOn("evt-b")] }),
      () => HttpResponse.json(events),
    );
    await screen.findByRole("heading", { name: /Bills/ });
    expect(screen.getByText(/your bet/i)).toBeInTheDocument();
  });

  it("always shows a fixture the caller has bet on, even past the horizon", async () => {
    const events = {
      events: [
        ev("near", "2026-09-09T18:00:00.000Z", "Bills", "Jets"),
        ev("far", "2026-09-20T18:00:00.000Z", "Bears", "Packers"),
      ],
    };
    renderPage(
      () => HttpResponse.json(PROFILE),
      () => HttpResponse.json({ bets: [betOn("far")] }),
      () => HttpResponse.json(events),
    );
    // The far fixture is 12 days out — past the 3-day default — but shown anyway.
    expect(
      await screen.findByRole("heading", { name: /Bears/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/your bet/i)).toBeInTheDocument();
  });
});

describe("ZeroProofContent — leaderboard", () => {
  it("ranks players by sharp score with an opaque handle, never the raw sub", async () => {
    renderPage();
    await goToTab(/leaderboard/i);
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
    await goToTab(/leaderboard/i);
    await screen.findByRole("table", { name: /leaderboard/i });
    expect(screen.getByText("41-22-3")).toBeInTheDocument();
  });

  it("toggles between the sharp and ROI boards", async () => {
    renderPage();
    await goToTab(/leaderboard/i);
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
    await goToTab(/your record/i);
    const cta = await screen.findByRole("link", { name: /sign in/i });
    expect(cta).toHaveAttribute("href", "/auth/login");
  });

  it("shows a signed-in player's stats, wallet balance, and accolades", async () => {
    renderPage(() => HttpResponse.json(PROFILE));
    await goToTab(/your record/i);
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
    await goToTab(/your record/i);
    expect(await screen.findByText(/recent bets/i)).toBeInTheDocument();
    expect(screen.getByText("won")).toBeInTheDocument();
    expect(screen.getByText(/CLV \+7\.9%/)).toBeInTheDocument();
  });

  it("tells a signed-in player with no wallet how to open one", async () => {
    renderPage(() => HttpResponse.json({ ...PROFILE, wallets: [] }));
    await goToTab(/your record/i);
    expect(await screen.findByText(/no wallet open yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open a season wallet/i }),
    ).toBeInTheDocument();
  });

  it("opens a Season wallet with a deposit amount the backend requires", async () => {
    let openedMode: string | null = null;
    let openedDeposit: number | undefined;
    server.use(
      http.post("/api/zeroproof/wallets", async ({ request }) => {
        const body = (await request.json()) as {
          mode: string;
          depositCents?: number;
        };
        openedMode = body.mode;
        openedDeposit = body.depositCents;
        return HttpResponse.json({ id: "w-new", mode: body.mode });
      }),
    );
    renderPage(() => HttpResponse.json({ ...PROFILE, wallets: [] }));
    await goToTab(/your record/i);
    fireEvent.click(
      await screen.findByRole("button", { name: /open a season wallet/i }),
    );
    // Season must carry a depositCents (the backend rejects it otherwise); a bare
    // { mode } is the bug that surfaced as "Validation failed".
    await waitFor(() => expect(openedMode).toBe("season"));
    expect(openedDeposit).toBeGreaterThanOrEqual(2000);
  });
});

describe("ZeroProofContent — bet slip", () => {
  // The slip is filled from the board, so keep the fixture event inside the
  // default 3-day window by pinning "now".
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(
      new Date("2026-09-08T00:00:00.000Z").getTime(),
    );
  });
  afterEach(() => {
    nowSpy.mockRestore();
  });

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
