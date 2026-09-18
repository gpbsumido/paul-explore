import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { Toaster } from "@paul-portfolio/react";
import { server } from "@/test/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { notifyMutationError } from "@/lib/mutationErrorToast";
import { axe } from "@/test/a11y";
import ZeroProofContent from "./ZeroProofContent";
import { localDayKey } from "@/lib/zeroproof/boardFilters";

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
  eventsResponse: (request?: Request) => Response = () => HttpResponse.json(EVENTS),
  myLeaguesResponse: () => Response = () => HttpResponse.json({ leagues: [] }),
  discoverResponse: () => Response = () => HttpResponse.json({ leagues: [] }),
) => {
  server.use(
    http.get("/api/zeroproof/events", ({ request }) => eventsResponse(request)),
    http.get("/api/zeroproof/leaderboard", () =>
      HttpResponse.json(LEADERBOARD),
    ),
    http.get("/api/zeroproof/me", () => meResponse()),
    http.get("/api/zeroproof/bets", () => betsResponse()),
    http.get("/api/zeroproof/leagues/mine", () => myLeaguesResponse()),
    http.get("/api/zeroproof/leagues", () => discoverResponse()),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // These tests exercise the lobby, not the first-visit tour — mark it seen so
  // the tour doesn't auto-open over them. Its own flow is covered separately.
  window.localStorage.setItem("zeroproof-tour-seen", "true");
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

describe("ZeroProofContent — leaderboard default", () => {
  it("opens on the ROI board so it isn't empty while players are below the sharp volume floor", async () => {
    renderPage();
    await goToTab(/leaderboard/i);
    const roiTab = await screen.findByRole("tab", { name: "ROI" });
    expect(roiTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Sharp" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});

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
  it("splits the lobby into Board, Leagues, Leaderboard, Compare and Your record, Board first", async () => {
    renderPage();
    const tablist = screen.getByRole("tablist", {
      name: /zeroproof sections/i,
    });
    expect(
      within(tablist)
        .getAllByRole("tab")
        .map((t) => t.textContent),
    ).toEqual(["Board", "Leagues", "Leaderboard", "Compare", "Your record"]);
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
    expect(screen.getByRole("tab", { name: "Leagues" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

describe("ZeroProofContent — compare", () => {
  it("asks a signed-out visitor to sign in", async () => {
    renderPage(); // me → 401
    fireEvent.click(screen.getByRole("tab", { name: "Compare" }));
    expect(await screen.findByText(/sign in to compare/i)).toBeInTheDocument();
  });

  it("shows how a signed-in player stacks up against the board", async () => {
    renderPage(() => HttpResponse.json(PROFILE));
    fireEvent.click(screen.getByRole("tab", { name: "Compare" }));
    const panel = await screen.findByRole("tabpanel", { name: "Compare" });
    expect(
      await within(panel).findByRole("heading", { name: /how you stack up/i }),
    ).toBeInTheDocument();
    // My ROI from the profile fixture shows up in the comparison table.
    expect(within(panel).getByText("+8.4%")).toBeInTheDocument();
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

describe("ZeroProofContent — board filters", () => {
  const NOW = new Date("2026-09-08T00:00:00.000Z").getTime();
  const mk = (
    id: string,
    sport: string,
    iso: string,
    home: string,
    away: string,
    homePrice: number,
    awayPrice: number,
  ) => ({
    id,
    sport,
    home,
    away,
    commenceTime: iso,
    status: "upcoming",
    markets: [
      {
        market: "h2h",
        fetchedAt: iso,
        outcomes: [
          { name: home, priceAmerican: homePrice },
          { name: away, priceAmerican: awayPrice },
        ],
      },
    ],
  });
  // All within the default 3-day window off NOW, so only the facet filters vary.
  const FILTER_EVENTS = {
    events: [
      mk("f-nba", "basketball_nba", "2026-09-09T18:00:00.000Z", "Suns", "Nuggets", -110, 120),
      mk("f-nfl", "americanfootball_nfl", "2026-09-09T20:00:00.000Z", "Bills", "Jets", -300, 240),
      mk("f-fan", "fantasy_ffl", "2026-09-10T18:00:00.000Z", "Team Alpha", "Team Beta", -110, -110),
    ],
  };
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(NOW);
  });
  afterEach(() => nowSpy.mockRestore());

  const renderBoard = () =>
    renderPage(undefined, undefined, () => HttpResponse.json(FILTER_EVENTS));

  const shows = (name: RegExp) => screen.queryByRole("heading", { name });

  it("shows every sport by default", async () => {
    renderBoard();
    expect(await screen.findByRole("heading", { name: /Suns/ })).toBeInTheDocument();
    expect(shows(/Bills/)).toBeInTheDocument();
    expect(shows(/Team Alpha/)).toBeInTheDocument();
  });

  it("filters ESPN fantasy in and out by type", async () => {
    renderBoard();
    await screen.findByRole("heading", { name: /Suns/ });
    fireEvent.change(screen.getByRole("combobox", { name: /show sports or fantasy/i }), {
      target: { value: "fantasy" },
    });
    await waitFor(() => expect(shows(/Suns/)).toBeNull());
    expect(shows(/Bills/)).toBeNull();
    expect(shows(/Team Alpha/)).toBeInTheDocument();
  });

  it("filters by a specific sport", async () => {
    renderBoard();
    await screen.findByRole("heading", { name: /Suns/ });
    fireEvent.change(screen.getByRole("combobox", { name: "Sport" }), {
      target: { value: "basketball_nba" },
    });
    await waitFor(() => expect(shows(/Bills/)).toBeNull());
    expect(shows(/Suns/)).toBeInTheDocument();
    expect(shows(/Team Alpha/)).toBeNull();
  });

  it("filters by odds — longshots keeps only the event with a +200 outcome", async () => {
    renderBoard();
    await screen.findByRole("heading", { name: /Suns/ });
    fireEvent.change(screen.getByRole("combobox", { name: "Odds" }), {
      target: { value: "underdogs" },
    });
    await waitFor(() => expect(shows(/Suns/)).toBeNull());
    expect(shows(/Bills/)).toBeInTheDocument(); // Jets +240
    expect(shows(/Team Alpha/)).toBeNull();
  });

  it("filters by odds — even keeps only events with no big favorite or longshot", async () => {
    renderBoard();
    await screen.findByRole("heading", { name: /Suns/ });
    fireEvent.change(screen.getByRole("combobox", { name: "Odds" }), {
      target: { value: "even" },
    });
    await waitFor(() => expect(shows(/Bills/)).toBeNull()); // -300 breaks it
    expect(shows(/Suns/)).toBeInTheDocument();
    expect(shows(/Team Alpha/)).toBeInTheDocument();
  });

  it("filters to a single day via the from/to date range", async () => {
    renderBoard();
    await screen.findByRole("heading", { name: /Suns/ });
    // The fantasy game's local day; the NBA game (a full day earlier) is excluded.
    const fantasyDay = localDayKey("2026-09-10T18:00:00.000Z")!;
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: fantasyDay } });
    fireEvent.change(screen.getByLabelText("To date"), { target: { value: fantasyDay } });
    await waitFor(() => expect(shows(/Suns/)).toBeNull());
    expect(shows(/Team Alpha/)).toBeInTheDocument();
  });

  it("filters to a multi-day range with just the From bound", async () => {
    renderBoard();
    await screen.findByRole("heading", { name: /Suns/ });
    // From the NBA/NFL day onward keeps everything; from the day after drops them.
    const nbaDay = localDayKey("2026-09-09T18:00:00.000Z")!;
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: nbaDay } });
    expect(await screen.findByRole("heading", { name: /Suns/ })).toBeInTheDocument();
    const fantasyDay = localDayKey("2026-09-10T18:00:00.000Z")!;
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: fantasyDay } });
    await waitFor(() => expect(shows(/Suns/)).toBeNull());
    expect(shows(/Team Alpha/)).toBeInTheDocument();
  });

  it("shows an empty state and a working Clear filters when nothing matches", async () => {
    renderBoard();
    await screen.findByRole("heading", { name: /Suns/ });
    // Fantasy only + odds longshots: the only fantasy game is a pick'em, so empty.
    fireEvent.change(screen.getByRole("combobox", { name: /show sports or fantasy/i }), {
      target: { value: "fantasy" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Odds" }), {
      target: { value: "underdogs" },
    });
    expect(await screen.findByText(/no games match your filters/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(await screen.findByRole("heading", { name: /Suns/ })).toBeInTheDocument();
  });

  it("has no axe violations with the filter controls present", async () => {
    const { container } = renderBoard();
    await screen.findByRole("heading", { name: /Suns/ });
    expect(await axe(container)).toHaveNoViolations();
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

  it("shows what the caller bet and the stake on the fixture card", async () => {
    const events = { events: [ev("evt-b", "2026-09-09T18:00:00.000Z", "Bills", "Jets")] };
    renderPage(
      () => HttpResponse.json(PROFILE),
      () => HttpResponse.json({ bets: [betOn("evt-b")] }),
      () => HttpResponse.json(events),
    );
    const card = (await screen.findByRole("heading", { name: /Bills/ })).closest("li");
    expect(card).not.toBeNull();
    const yourBets = within(card as HTMLElement).getByRole("list", {
      name: /your bets on this matchup/i,
    });
    expect(within(yourBets).getByText("Bills")).toBeInTheDocument();
    expect(within(yourBets).getByText("$25.00")).toBeInTheDocument();
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

  it("toggles between the ROI and sharp boards", async () => {
    renderPage();
    await goToTab(/leaderboard/i);
    // ROI is the default board; the base mock serves LEADERBOARD for it.
    expect(await screen.findByText("88.5")).toBeInTheDocument();
    // now serve a different board per ?board, and switch to Sharp
    server.use(
      http.get("/api/zeroproof/leaderboard", ({ request }) => {
        const board = new URL(request.url).searchParams.get("board");
        return HttpResponse.json({
          entries:
            board === "sharp"
              ? [
                  {
                    userSub: "auth0|sharp-king",
                    wins: 5,
                    losses: 4,
                    pushes: 0,
                    betCount: 9,
                    roiPct: 1.0,
                    sharpScore: 91.1,
                  },
                ]
              : LEADERBOARD.entries,
        });
      }),
    );
    fireEvent.click(screen.getByRole("tab", { name: /^sharp$/i }));
    expect(await screen.findByText("91.1")).toBeInTheDocument();
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
    // Scope to the record panel: the Compare panel also renders these stats.
    const panel = await screen.findByRole("tabpanel", { name: /your record/i });
    // stats
    expect(await within(panel).findByText("18-11-2")).toBeInTheDocument();
    expect(within(panel).getByText("+8.4%")).toBeInTheDocument();
    // wallet balance in dollars from cents
    expect(within(panel).getByText("$118.40")).toBeInTheDocument();
    // accolade
    expect(within(panel).getByText("First Win")).toBeInTheDocument();
  });

  it("charts a bankroll trend once there are settled bets", async () => {
    const settled = (id: string, status: string, settledAt: string) => ({
      id,
      walletId: "w1",
      eventId: "e",
      market: "h2h",
      selection: "x",
      oddsAmerican: 100,
      lineValue: null,
      closingOddsAmerican: 130,
      clv: 5,
      stakeCents: 1000,
      status,
      placedAt: "2026-09-01T00:00:00.000Z",
      settledAt,
    });
    renderPage(
      () => HttpResponse.json(PROFILE),
      () =>
        HttpResponse.json({
          bets: [
            settled("b1", "won", "2026-09-02T00:00:00.000Z"),
            settled("b2", "lost", "2026-09-03T00:00:00.000Z"),
          ],
        }),
    );
    await goToTab(/your record/i);
    expect(
      await screen.findByRole("heading", { name: /bankroll trend/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/over 2 settled bets/i)).toBeInTheDocument();
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
    // "won" now also appears on the board card for this fixture, so scope to the
    // visible record panel where the recent-bets list lives.
    expect(
      within(screen.getByRole("tabpanel")).getByText("won"),
    ).toBeInTheDocument();
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

  it("disables the Season wallet button when an active season wallet already exists", async () => {
    // PROFILE ships with an active season wallet, so opening a second would 409.
    renderPage(() => HttpResponse.json(PROFILE));
    await goToTab(/your record/i);

    const seasonButton = await screen.findByRole("button", {
      name: /open a season wallet/i,
    });
    expect(seasonButton).toBeDisabled();
    expect(
      screen.getByText(/already have an active season wallet/i),
    ).toBeInTheDocument();
    // Challenge is a different wallet type and stays available.
    expect(
      screen.getByRole("button", { name: /open a challenge wallet/i }),
    ).not.toBeDisabled();
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
    // Grades on both the recent-bets list and the board card for the fixture.
    expect((await screen.findAllByText("won")).length).toBeGreaterThan(0);
  });
});

describe("ZeroProofContent — leagues", () => {
  const LEAGUE = {
    id: "lg-1",
    commissionerSub: "auth0|me",
    name: "Friday Night Parlays",
    joinCode: null,
    visibility: "public",
    startingBankrollCents: 50000,
    maxMembers: 10,
    winCondition: "threshold",
    thresholdCents: 200000,
    endsAt: null,
    status: "open",
    winnerSub: null,
    createdAt: "2026-09-08T00:00:00.000Z",
    settledAt: null,
    memberCount: 4,
  };
  const discover = () => HttpResponse.json({ leagues: [LEAGUE] });
  const empty = () => HttpResponse.json({ leagues: [] });

  it("lists discoverable leagues on the Leagues tab", async () => {
    renderPage(undefined, undefined, undefined, empty, discover);
    await goToTab(/^leagues$/i);
    expect(
      await screen.findByRole("link", { name: /friday night parlays/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^join$/i })).toBeInTheDocument();
  });

  it("shows a labelled create form whose fields follow the win condition", async () => {
    renderPage();
    await goToTab(/^leagues$/i);
    fireEvent.click(screen.getByRole("button", { name: /create a league/i }));
    expect(screen.getByLabelText(/league name/i)).toBeInTheDocument();
    // Threshold is the default, so the target amount field shows.
    expect(screen.getByLabelText("Target ($)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /highest by a date/i }));
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
    expect(screen.queryByLabelText("Target ($)")).toBeNull();
  });

  it("joining a discoverable league then shows it under your leagues", async () => {
    let joined = false;
    renderPage(
      undefined,
      undefined,
      undefined,
      () => HttpResponse.json({ leagues: joined ? [LEAGUE] : [] }),
      discover,
    );
    server.use(
      http.post("/api/zeroproof/leagues/lg-1/join", () => {
        joined = true;
        return HttpResponse.json({ walletId: "w-1" });
      }),
    );
    await goToTab(/^leagues$/i);
    fireEvent.click(await screen.findByRole("button", { name: /^join$/i }));
    // My-leagues refetches after the join and the league appears there too.
    await waitFor(() =>
      expect(
        screen.getAllByRole("link", { name: /friday night parlays/i }).length,
      ).toBeGreaterThan(1),
    );
  });

  it("has no axe violations on the Leagues tab", async () => {
    const { container } = renderPage(undefined, undefined, undefined, empty, discover);
    await goToTab(/^leagues$/i);
    await screen.findByRole("link", { name: /friday night parlays/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("ZeroProofContent — ESPN fantasy", () => {
  const NOW = new Date("2026-09-08T00:00:00.000Z").getTime();
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(NOW);
  });
  afterEach(() => {
    nowSpy.mockRestore();
  });

  const FANTASY = {
    events: [
      {
        id: "fev-1",
        sport: "fantasy_ffl",
        home: "Vancouver Seahawks",
        away: "Barbarians",
        commenceTime: "2026-09-09T18:00:00.000Z",
        status: "upcoming",
        markets: [
          {
            market: "h2h",
            fetchedAt: "2026-09-08T00:00:00.000Z",
            outcomes: [
              { name: "Vancouver Seahawks", priceAmerican: -110 },
              { name: "Barbarians", priceAmerican: -110 },
            ],
          },
        ],
      },
    ],
  };

  it("badges a fantasy matchup on the board", async () => {
    renderPage(undefined, undefined, () => HttpResponse.json(FANTASY));
    expect(await screen.findByText("Fantasy Football")).toBeInTheDocument();
  });
});

describe("ZeroProofContent — error recovery", () => {
  it("recovers the board with Try again after a transient failure", async () => {
    let calls = 0;
    renderPage(undefined, undefined, () => {
      calls += 1;
      return calls === 1
        ? new HttpResponse(null, { status: 503 })
        : HttpResponse.json(EVENTS);
    });

    // The failed board says so and offers a way back.
    expect(
      await screen.findByText(/board is unavailable/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    // Retry refetches and clears the error once the board answers.
    await waitFor(() =>
      expect(screen.queryByText(/board is unavailable/i)).not.toBeInTheDocument(),
    );
    expect(calls).toBe(2);
  });
});

describe("ZeroProofContent — wallet error toast", () => {
  // The Toaster store is a module-level singleton, so clear anything a test raised.
  afterEach(() => {
    document.querySelectorAll(".toast__dismiss").forEach((btn) => {
      fireEvent.click(btn);
    });
  });

  // A ZeroProof write error rides the app-wide handler (providers.tsx): a
  // MutationCache whose onError toasts through the shared Toaster. The test
  // wires the same pieces so it proves the real path, not a bespoke one.
  const renderWithToasts = () => {
    const client = new QueryClient({
      mutationCache: new MutationCache({
        onError: (error, _v, _c, mutation) =>
          notifyMutationError(error, mutation.meta),
      }),
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    window.localStorage.setItem("zeroproof-tour-seen", "true");
    return render(
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <ZeroProofContent />
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>,
    );
  };

  it("surfaces a failed wallet open as an error toast with the server's message", async () => {
    server.use(
      http.get("/api/zeroproof/events", () => HttpResponse.json(EVENTS)),
      http.get("/api/zeroproof/leaderboard", () => HttpResponse.json(LEADERBOARD)),
      http.get("/api/zeroproof/me", () =>
        HttpResponse.json({ ...PROFILE, wallets: [] }),
      ),
      http.get("/api/zeroproof/bets", () => HttpResponse.json({ bets: [] })),
      http.get("/api/zeroproof/leagues/mine", () =>
        HttpResponse.json({ leagues: [] }),
      ),
      http.get("/api/zeroproof/leagues", () => HttpResponse.json({ leagues: [] })),
      http.post("/api/zeroproof/wallets", () =>
        HttpResponse.json(
          { error: "Deposits are closed for the season." },
          { status: 409 },
        ),
      ),
    );
    renderWithToasts();
    await goToTab(/your record/i);
    fireEvent.click(
      await screen.findByRole("button", { name: /open a season wallet/i }),
    );
    expect(
      await screen.findByText(/deposits are closed for the season/i),
    ).toBeInTheDocument();
  });
});

describe("ZeroProofContent — past fixtures", () => {
  const SLATE_NOW = new Date("2026-09-08T00:00:00.000Z").getTime();
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(SLATE_NOW);
  });
  afterEach(() => nowSpy.mockRestore());

  const PAST_EVENT = {
    id: "past-1",
    sport: "basketball_nba",
    home: "Suns",
    away: "Nuggets",
    commenceTime: "2026-09-02T23:00:00.000Z",
    status: "final",
    markets: [
      {
        market: "h2h",
        fetchedAt: "2026-09-02T20:00:00.000Z",
        outcomes: [
          { name: "Suns", priceAmerican: -120 },
          { name: "Nuggets", priceAmerican: 110 },
        ],
      },
    ],
  };

  it("reveals recent past fixtures, read-only, when the box is checked", async () => {
    renderPage(undefined, undefined, (request) => {
      const includePast =
        !!request && new URL(request.url).searchParams.get("include") === "past";
      return HttpResponse.json({
        events: includePast ? [...EVENTS.events, PAST_EVENT] : EVENTS.events,
      });
    });

    // Wait for the upcoming board to load.
    await screen.findByRole("heading", { name: /Celtics/ });
    // The upcoming board doesn't include the finished game yet.
    expect(screen.queryByRole("heading", { name: /Nuggets/ })).toBeNull();

    fireEvent.click(
      await screen.findByRole("checkbox", { name: /show past fixtures/i }),
    );

    // It shows up, badged Final, with static lines (no bet button for it).
    expect(
      await screen.findByRole("heading", { name: /Nuggets/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Final")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Suns/ })).toBeNull();
  });
})
