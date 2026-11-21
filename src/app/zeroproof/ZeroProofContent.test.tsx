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
import { playerHandle } from "@/lib/zeroproof/format";

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
  leaderboardResponse: () => Response = () => HttpResponse.json(LEADERBOARD),
) => {
  server.use(
    http.get("/api/zeroproof/events", ({ request }) => eventsResponse(request)),
    http.get("/api/zeroproof/leaderboard", () => leaderboardResponse()),
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
    // The panels stay mounted so their data preloads. Wait for the leaderboard
    // to be in the page, hidden, before checking it is out of the way.
    await waitFor(() =>
      expect(document.querySelector("#zp-panel-leaderboard table")).not.toBeNull(),
    );
    expect(screen.queryByRole("table", { name: /leaderboard/i })).toBeNull();
    expect(document.getElementById("zp-panel-leaderboard")).toHaveAttribute("hidden");

    fireEvent.click(screen.getByRole("tab", { name: "Leaderboard" }));

    expect(
      await screen.findByRole("table", { name: /leaderboard/i }),
    ).toBeInTheDocument();
    expect(document.getElementById("zp-panel-board")).toHaveAttribute("hidden");
  });

  it.each([
    ["ArrowRight", "Board", "Leagues"],
    ["ArrowDown", "Board", "Leagues"],
    ["ArrowLeft", "Leagues", "Board"],
    ["ArrowUp", "Leagues", "Board"],
    ["ArrowLeft", "Board", "Your record"],
    ["ArrowRight", "Your record", "Board"],
    ["End", "Board", "Your record"],
    ["Home", "Your record", "Board"],
  ])("%s on %s lands on %s, and focus goes with it", (key, from, to) => {
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: from }));
    const start = screen.getByRole("tab", { name: from });
    start.focus();

    fireEvent.keyDown(start, { key });

    const landed = screen.getByRole("tab", { name: to });
    expect(landed).toHaveAttribute("aria-selected", "true");
    expect(landed).toHaveFocus();
  });

  it("keeps only the selected tab in the tab order", () => {
    renderPage();

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.getAttribute("tabindex"))).toEqual([
      "0",
      "-1",
      "-1",
      "-1",
      "-1",
    ]);
    fireEvent.click(screen.getByRole("tab", { name: "Compare" }));
    expect(
      screen.getAllByRole("tab").filter((tab) => tab.getAttribute("tabindex") === "0"),
    ).toEqual([screen.getByRole("tab", { name: "Compare" })]);
  });

  it("ignores keys that are not navigation", () => {
    renderPage();
    const board = screen.getByRole("tab", { name: "Board" });
    board.focus();

    fireEvent.keyDown(board, { key: "a" });

    expect(board).toHaveAttribute("aria-selected", "true");
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

describe("ZeroProofContent — record names the matchup", () => {
  const totalBet = {
    id: "bet-1",
    walletId: "w1",
    eventId: "evt-1",
    market: "total",
    selection: "Over",
    home: "Celtics",
    away: "Heat",
    sport: "basketball_nba",
    oddsAmerican: -110,
    lineValue: 210.5,
    closingOddsAmerican: null,
    clv: null,
    stakeCents: 2500,
    status: "open",
    placedAt: "2026-09-05T00:00:00.000Z",
    settledAt: null,
  };

  it("shows both teams next to the pick, not just 'Over Total'", async () => {
    renderPage(
      () => HttpResponse.json(PROFILE),
      () => HttpResponse.json({ bets: [totalBet] }),
    );
    fireEvent.click(await screen.findByRole("tab", { name: "Your record" }));
    const panel = await screen.findByRole("tabpanel", { name: "Your record" });
    // The matchup travels with the bet now, so a totals pick names who's playing.
    expect(await within(panel).findByText(/Heat @ Celtics/)).toBeInTheDocument();
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
      screen.getByRole("switch", { name: /auto-load as i scroll/i }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /load more games/i }),
      ).toBeNull(),
    );
    expect(screen.getByText(/loading more as you scroll/i)).toBeInTheDocument();
  });
});

describe("ZeroProofContent — board highlights", () => {
  const NOW = new Date("2026-09-08T00:00:00.000Z").getTime();
  const NEAR = "2026-09-09T18:00:00.000Z"; // +1d, a near coin flip
  const FAR = "2026-09-18T18:00:00.000Z"; // +10.75d, the longest shot, past the 3-day horizon
  const priced = (id: string, iso: string, home: string, away: string, homePrice: number, awayPrice: number) => ({
    id,
    sport: "americanfootball_nfl",
    home,
    away,
    commenceTime: iso,
    status: "upcoming",
    markets: [
      {
        market: "h2h",
        fetchedAt: NEAR,
        outcomes: [
          { name: home, priceAmerican: homePrice },
          { name: away, priceAmerican: awayPrice },
        ],
      },
    ],
  });
  const HIGHLIGHT_EVENTS = {
    events: [
      priced("hl-near", NEAR, "Bills", "Chiefs", -105, 105),
      priced("hl-far", FAR, "Niners", "Rams", -450, 350),
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
    renderPage(undefined, undefined, () => HttpResponse.json(HIGHLIGHT_EVENTS));
  const kickoffIn = (container: HTMLElement, iso: string) =>
    container.querySelector(`time[datetime="${iso}"]`);

  it("shows when the biggest underdog and the closest game kick off", async () => {
    renderBoard();
    const underdog = await screen.findByRole("region", { name: "Biggest underdog" });
    const close = screen.getByRole("region", { name: "Closest game" });
    expect(kickoffIn(underdog, FAR)?.textContent).toMatch(/\d/);
    expect(kickoffIn(close, NEAR)?.textContent).toMatch(/\d/);
  });

  it("shows the date and time on every board card", async () => {
    renderBoard();
    const card = (await screen.findByRole("heading", { name: /Chiefs.*Bills/ })).closest("li");
    expect(card).not.toBeNull();
    expect(kickoffIn(card as HTMLElement, NEAR)?.textContent).toMatch(/\d/);
  });

  it("goes to a highlighted game's date, loading the board out to it", async () => {
    renderBoard();
    const underdog = await screen.findByRole("region", { name: "Biggest underdog" });
    expect(screen.queryByRole("heading", { name: /Rams.*Niners/ })).toBeNull();

    fireEvent.click(within(underdog).getByRole("button", { name: /go to date/i }));

    const heading = await screen.findByRole("heading", { name: /Rams.*Niners/ });
    // 10.75 days out: the 3-day horizon grows in steps to 12, so the days between show too.
    expect(screen.getByText(/showing games in the next 12 days/i)).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(heading.closest("li")));
  });

  it("groups each card's markets without adding a landmark per card", async () => {
    // Two cards with a Moneyline each used to mean two identical "Moneyline"
    // regions -- axe's landmark-unique, repeated once per fixture on a full board.
    renderBoard();
    await screen.findByRole("heading", { name: /Chiefs.*Bills/ });
    expect(screen.queryAllByRole("region", { name: "Moneyline" })).toHaveLength(0);
    expect(screen.getAllByRole("group", { name: "Moneyline" }).length).toBeGreaterThan(0);
  });

  it("names the day on the go-to-date button for screen readers", async () => {
    renderBoard();
    const close = await screen.findByRole("region", { name: "Closest game" });
    const button = within(close).getByRole("button", { name: /go to date/i });
    expect(button.getAttribute("aria-label")).toMatch(/^Go to date: \S/);
  });
});

describe("ZeroProofContent — a month of fixtures at most", () => {
  const NOW = new Date("2026-09-08T00:00:00.000Z").getTime();
  const DAY = 24 * 60 * 60 * 1000;
  const fixture = (id: string, days: number, home: string, away: string, awayPrice = 120) => {
    const iso = new Date(NOW + days * DAY).toISOString();
    return {
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
            { name: away, priceAmerican: awayPrice },
          ],
        },
      ],
    };
  };
  const CAP_EVENTS = {
    events: [
      fixture("cap-near", 1, "Bills", "Chiefs"),
      fixture("cap-late", 28, "Eagles", "Cowboys"),
      // 40 days out, and the longest shot on the board: it must still not show.
      fixture("cap-beyond", 40, "Niners", "Rams", 900),
    ],
  };
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(NOW);
  });
  afterEach(() => {
    nowSpy.mockRestore();
  });

  it("asks the backend for no more than a month ahead", async () => {
    const urls: string[] = [];
    renderPage(undefined, undefined, (request) => {
      if (request) urls.push(request.url);
      return HttpResponse.json(CAP_EVENTS);
    });
    await screen.findByRole("heading", { name: /Chiefs.*Bills/ });
    expect(urls.every((url) => new URL(url).searchParams.get("aheadDays") === "30")).toBe(true);
  });

  it("stops loading at a month out and says to come back later", async () => {
    renderPage(undefined, undefined, () => HttpResponse.json(CAP_EVENTS));
    await screen.findByRole("heading", { name: /Chiefs.*Bills/ });
    expect(screen.queryByText(/come back later/i)).toBeNull();

    // Keep loading until there's nothing left to load.
    while (screen.queryByRole("button", { name: /load more games/i })) {
      fireEvent.click(screen.getByRole("button", { name: /load more games/i }));
    }

    expect(await screen.findByRole("heading", { name: /Cowboys.*Eagles/ })).toBeInTheDocument();
    expect(screen.getByText(/showing games in the next 30 days/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Rams.*Niners/ })).toBeNull();
    expect(screen.getByText(/come back later/i)).toBeInTheDocument();
  });

  it("doesn't pick a highlight from past the month", async () => {
    renderPage(undefined, undefined, () => HttpResponse.json(CAP_EVENTS));
    const underdog = await screen.findByRole("region", { name: "Biggest underdog" });
    expect(within(underdog).queryByText("Rams")).toBeNull();
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

  it("locks a fixture you've bet on once its game has started", async () => {
    // A fantasy matchup keeps a future synthetic commence time, so only its
    // 'started' status closes it — the board must respect that, not just kickoff.
    const started = {
      ...ev("evt-live", "2026-09-20T18:00:00.000Z", "Alpha", "Bravo"),
      sport: "fantasy_fba",
      status: "started",
    };
    renderPage(
      () => HttpResponse.json(PROFILE),
      () => HttpResponse.json({ bets: [betOn("evt-live")] }),
      () => HttpResponse.json({ events: [started] }),
    );
    await screen.findByRole("heading", { name: /Alpha/ });
    // Started → its outcomes are read-only, so there's no button to add a bet.
    expect(screen.queryByRole("button", { name: /Alpha/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Bravo/ })).toBeNull();
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

  it("keeps multiple picks compact until review, then allows removing one", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Lakers/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });
    const review = within(slip).getByRole("button", { name: /review 2 picks/i });

    expect(review).toHaveAttribute("aria-expanded", "false");
    expect(within(slip).queryByRole("list", { name: /selected picks/i })).toBeNull();
    fireEvent.click(review);
    expect(within(slip).getByRole("list", { name: /selected picks/i })).toBeInTheDocument();
    fireEvent.click(within(slip).getByRole("button", { name: /remove Lakers from slip/i }));
    expect(within(slip).getByRole("heading", { name: /bet slip \(1\)/i })).toBeInTheDocument();
    expect(within(slip).queryByRole("button", { name: /review .* picks/i })).toBeNull();
  });

  it("takes a pick back off the slip when the same outcome is tapped again", async () => {
    renderPage();
    const celtics = await screen.findByRole("button", { name: /Celtics/ });
    fireEvent.click(celtics);
    expect(celtics).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByRole("region", { name: /bet slip/i })).toBeInTheDocument();

    fireEvent.click(celtics);

    expect(celtics).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("region", { name: /bet slip/i })).toBeNull();
  });

  it("keeps sign-in and clearing available in a compact signed-out slip", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Lakers/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });

    expect(within(slip).getByRole("link", { name: /sign in to bet/i })).toBeInTheDocument();
    fireEvent.click(within(slip).getByRole("button", { name: /clear/i }));
    expect(screen.queryByRole("region", { name: /bet slip/i })).toBeNull();
  });

  it("keeps the collapsed and expanded slip free of accessibility violations", async () => {
    const { container } = renderPage(() => HttpResponse.json(PROFILE));
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Lakers/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });

    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(within(slip).getByRole("button", { name: /set 2 stakes/i }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("places different stakes for two picks with one action", async () => {
    const placed: Record<string, unknown>[] = [];
    server.use(
      http.post("/api/zeroproof/bets", async ({ request }) => {
        placed.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ id: `bet-${placed.length}` });
      }),
    );
    renderPage(() => HttpResponse.json(PROFILE));
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Lakers/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });
    const place = within(slip).getByRole("button", { name: /place 2 bets/i });
    expect(place).toBeDisabled();
    fireEvent.click(within(slip).getByRole("button", { name: /set 2 stakes/i }));
    fireEvent.change(within(slip).getByRole("textbox", { name: /stake for Celtics/i }), {
      target: { value: "25" },
    });
    expect(place).toBeDisabled();
    fireEvent.change(within(slip).getByRole("textbox", { name: /stake for Lakers/i }), {
      target: { value: "10" },
    });
    expect(within(slip).getByText("$35.00 total stake")).toBeInTheDocument();
    fireEvent.click(within(slip).getByRole("button", { name: /hide picks/i }));
    expect(within(slip).queryByRole("list", { name: /selected picks/i })).toBeNull();
    expect(place).toBeEnabled();
    fireEvent.click(place);
    await waitFor(() => expect(placed).toHaveLength(2));
    expect(placed).toEqual([
      expect.objectContaining({ selection: "Celtics", stakeCents: 2500 }),
      expect.objectContaining({ selection: "Lakers", stakeCents: 1000 }),
    ]);
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

  it("flags the fixture the moment a bet is placed, before the server confirms", async () => {
    // Hold the POST open so the only thing that could flag the fixture is the
    // optimistic write — the bets GET stays empty throughout.
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post("/api/zeroproof/bets", async () => {
        await gate;
        return HttpResponse.json({ id: "bet-1" });
      }),
    );
    renderPage(() => HttpResponse.json(PROFILE));
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });
    fireEvent.change(within(slip).getByLabelText(/stake/i), {
      target: { value: "25" },
    });
    expect(screen.queryByText("Your bet")).toBeNull();
    fireEvent.click(within(slip).getByRole("button", { name: /place bet/i }));
    expect(await screen.findByText("Your bet")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: /your bets on this matchup/i }),
    ).toHaveTextContent("Celtics");
    release();
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
    // Your leagues only load for a session, which the panel reads from /api/me.
    server.use(
      http.get("/api/me", () =>
        HttpResponse.json({ name: null, email: null, sub: "auth0|me", isFlagAdmin: false }),
      ),
    );
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

  it("reveals recent past fixtures, read-only, and widens the window as you load earlier", async () => {
    const pastDaysRequested: (string | null)[] = [];
    renderPage(undefined, undefined, (request) => {
      const url = request ? new URL(request.url) : null;
      const includePast = url?.searchParams.get("include") === "past";
      if (includePast) pastDaysRequested.push(url!.searchParams.get("pastDays"));
      return HttpResponse.json({
        events: includePast ? [...EVENTS.events, PAST_EVENT] : EVENTS.events,
      });
    });

    // Wait for the upcoming board to load.
    await screen.findByRole("heading", { name: /Celtics/ });
    // The upcoming board doesn't include the finished game yet.
    expect(screen.queryByRole("heading", { name: /Nuggets/ })).toBeNull();

    fireEvent.click(
      await screen.findByRole("switch", { name: /show past fixtures/i }),
    );

    // It shows up, badged Final, with static lines (no bet button for it).
    const nuggets = await screen.findByRole("heading", { name: /Nuggets/ });
    expect(nuggets).toBeInTheDocument();
    expect(screen.getByText("Final")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Suns/ })).toBeNull();
    // And it slots in chronologically — the finished game (Sep 2) sits above the
    // upcoming one (Sep 10), not buried below it in reverse order.
    const celtics = screen.getByRole("heading", { name: /Celtics/ });
    expect(
      nuggets.compareDocumentPosition(celtics) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // "Load earlier fixtures" widens the list backwards, so it sits at the top —
    // above the earliest fixture — not buried at the bottom of the board.
    const loadEarlier = screen.getByRole("button", { name: /load earlier/i });
    expect(
      loadEarlier.compareDocumentPosition(nuggets) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The first past fetch asked for just the initial 2-week window.
    expect(pastDaysRequested).toContain("14");

    // Loading earlier widens the requested window rather than pulling 3 months.
    fireEvent.click(screen.getByRole("button", { name: /load earlier/i }));
    await waitFor(() => expect(pastDaysRequested).toContain("28"));
  });
})

describe("ZeroProofContent — signed-out visitors", () => {
  // The board, the record trend and the bet history all share the bets query.
  // Only the profile's copy waited for a session; the board's fired on load
  // for everyone, so every signed-out visit made a request that could only 401.
  it("doesn't ask for bets before there's a session", async () => {
    const betsRequests = vi.fn(() => HttpResponse.json({ bets: [] }));
    const meRequests = vi.fn(() => new HttpResponse(null, { status: 401 }));
    const eventsRequests = vi.fn(() => HttpResponse.json(EVENTS));
    renderPage(meRequests, betsRequests, eventsRequests);

    // By the time the board has asked for events and the session check has
    // come back, every query on the page has had its chance to run.
    await waitFor(() => expect(eventsRequests).toHaveBeenCalled());
    await waitFor(() => expect(meRequests).toHaveBeenCalled());
    await screen.findByRole("heading", { name: /the board/i });

    expect(betsRequests).not.toHaveBeenCalled();
  });

  it("still loads bets once signed in", async () => {
    const betsRequests = vi.fn(() => HttpResponse.json({ bets: [] }));
    renderPage(() => HttpResponse.json(PROFILE), betsRequests);

    await waitFor(() => expect(betsRequests).toHaveBeenCalled());
  });
});

describe("ZeroProofContent — placing bets, the awkward cases", () => {
  // Same pinned clock as the main slip tests, so the fixture sits inside the
  // default 3-day window.
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(
      new Date("2026-09-08T00:00:00.000Z").getTime(),
    );
  });
  afterEach(() => {
    nowSpy.mockRestore();
  });

  /** Fills the slip with both sides of the fixture and opens the stake fields. */
  const pickBothSides = async () => {
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Lakers/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });
    fireEvent.click(within(slip).getByRole("button", { name: /set 2 stakes/i }));
    return slip;
  };
  const stake = (slip: HTMLElement, team: string, dollars: string) =>
    fireEvent.change(
      within(slip).getByRole("textbox", { name: new RegExp(`stake for ${team}`, "i") }),
      { target: { value: dollars } },
    );

  it.each([["0"], ["-5"], ["abc"], [""]])(
    "does not count a stake of %j, so the bets cannot be placed with it",
    async (badStake) => {
      renderPage(() => HttpResponse.json(PROFILE));
      const slip = await pickBothSides();

      stake(slip, "Celtics", badStake);
      stake(slip, "Lakers", "10");

      expect(within(slip).getByText("1 of 2 stakes set")).toBeInTheDocument();
      expect(within(slip).getByRole("button", { name: /place 2 bets/i })).toBeDisabled();
    },
  );

  it("turns dollars into whole cents without losing a cent to floating point", async () => {
    const placed: Record<string, unknown>[] = [];
    server.use(
      http.post("/api/zeroproof/bets", async ({ request }) => {
        placed.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ id: "bet-1" });
      }),
    );
    renderPage(() => HttpResponse.json(PROFILE));
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });

    // 1.15 * 100 is 114.99999999999999 in floating point.
    fireEvent.change(within(slip).getByLabelText(/stake/i), { target: { value: "1.15" } });
    fireEvent.click(within(slip).getByRole("button", { name: /place bet/i }));

    await waitFor(() => expect(placed).toHaveLength(1));
    expect(placed[0].stakeCents).toBe(115);
  });

  it("takes a bet off the slip once it has been placed", async () => {
    server.use(
      http.post("/api/zeroproof/bets", () => HttpResponse.json({ id: "bet-1" })),
    );
    renderPage(() => HttpResponse.json(PROFILE));
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });
    fireEvent.change(within(slip).getByLabelText(/stake/i), { target: { value: "5" } });

    fireEvent.click(within(slip).getByRole("button", { name: /place bet/i }));

    await waitFor(() =>
      expect(screen.queryByRole("region", { name: /bet slip/i })).toBeNull(),
    );
  });

  it("stops at the first failed bet and leaves it, and the ones after it, on the slip", async () => {
    const attempted: string[] = [];
    server.use(
      http.post("/api/zeroproof/bets", async ({ request }) => {
        const body = (await request.json()) as { selection: string };
        attempted.push(body.selection);
        return HttpResponse.json({ error: "Odds moved" }, { status: 409 });
      }),
    );
    renderPage(() => HttpResponse.json(PROFILE));
    const slip = await pickBothSides();
    stake(slip, "Celtics", "25");
    stake(slip, "Lakers", "10");

    fireEvent.click(within(slip).getByRole("button", { name: /place 2 bets/i }));

    await waitFor(() => expect(attempted).toEqual(["Celtics"]));
    // Both picks are still there to retry, and nothing else was sent.
    await waitFor(() =>
      expect(within(slip).getByRole("button", { name: /place 2 bets/i })).toBeEnabled(),
    );
    expect(attempted).toEqual(["Celtics"]);
    expect(within(slip).getByRole("heading", { name: /bet slip \(2\)/i })).toBeInTheDocument();
  });

  it("keeps a bet that landed off the slip when a later one fails", async () => {
    server.use(
      http.post("/api/zeroproof/bets", async ({ request }) => {
        const body = (await request.json()) as { selection: string };
        return body.selection === "Celtics"
          ? HttpResponse.json({ id: "bet-1" })
          : HttpResponse.json({ error: "Odds moved" }, { status: 409 });
      }),
    );
    renderPage(() => HttpResponse.json(PROFILE));
    const slip = await pickBothSides();
    stake(slip, "Celtics", "25");
    stake(slip, "Lakers", "10");

    fireEvent.click(within(slip).getByRole("button", { name: /place 2 bets/i }));

    await waitFor(() =>
      expect(within(slip).getByRole("heading", { name: /bet slip \(1\)/i })).toBeInTheDocument(),
    );
    expect(
      within(slip).getByRole("button", { name: /remove lakers from slip/i }),
    ).toBeInTheDocument();
    expect(
      within(slip).queryByRole("button", { name: /remove celtics from slip/i }),
    ).toBeNull();
  });

  it("takes the flag off the fixture again when the bet is refused", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post("/api/zeroproof/bets", async () => {
        await gate;
        return HttpResponse.json({ error: "Odds moved" }, { status: 409 });
      }),
    );
    renderPage(() => HttpResponse.json(PROFILE));
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });
    fireEvent.change(within(slip).getByLabelText(/stake/i), { target: { value: "25" } });
    fireEvent.click(within(slip).getByRole("button", { name: /place bet/i }));
    expect(await screen.findByText("Your bet")).toBeInTheDocument();
    // Refreshing the bets after the failure would also clear the flag, which
    // hides a missing rollback. Keep that refresh from ever answering, so only
    // the rollback can take the flag off.
    server.use(
      http.get("/api/zeroproof/bets", () => new Promise<Response>(() => {})),
    );

    release();

    await waitFor(() => expect(screen.queryByText("Your bet")).toBeNull());
    // The pick is still on the slip, so the visitor can try again.
    expect(screen.getByRole("region", { name: /bet slip/i })).toBeInTheDocument();
  });

  it("sends the wallet the visitor picked when they hold more than one", async () => {
    const placed: Record<string, unknown>[] = [];
    server.use(
      http.post("/api/zeroproof/bets", async ({ request }) => {
        placed.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ id: "bet-1" });
      }),
    );
    const twoWallets = {
      ...PROFILE,
      wallets: [
        PROFILE.wallets[0],
        { ...PROFILE.wallets[0], id: "w2", mode: "challenge", balanceCents: 4200 },
      ],
    };
    renderPage(() => HttpResponse.json(twoWallets));
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });
    fireEvent.change(await within(slip).findByLabelText(/^wallet$/i), {
      target: { value: "w2" },
    });
    fireEvent.change(within(slip).getByLabelText(/stake/i), { target: { value: "5" } });

    fireEvent.click(within(slip).getByRole("button", { name: /place bet/i }));

    await waitFor(() => expect(placed).toHaveLength(1));
    expect(placed[0].walletId).toBe("w2");
  });

  it("offers no wallet picker when there is only one wallet", async () => {
    renderPage(() => HttpResponse.json(PROFILE));
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });
    await within(slip).findByLabelText(/stake/i);

    expect(within(slip).queryByLabelText(/^wallet$/i)).toBeNull();
  });

  it("tells a signed-in visitor with no wallet to open one, with no stake fields", async () => {
    renderPage(() => HttpResponse.json({ ...PROFILE, wallets: [] }));
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });

    expect(
      await within(slip).findByText("Open a wallet to place these bets."),
    ).toBeInTheDocument();
    expect(within(slip).queryByLabelText(/stake/i)).toBeNull();
    expect(within(slip).queryByRole("button", { name: /place bet/i })).toBeNull();
  });

  it("shows a signed-out visitor no stake fields and no place button", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Celtics/ }));
    const slip = await screen.findByRole("region", { name: /bet slip/i });

    await within(slip).findByRole("link", { name: /sign in to bet/i });
    expect(within(slip).queryByLabelText(/stake/i)).toBeNull();
    expect(within(slip).queryByRole("button", { name: /place bet/i })).toBeNull();
  });
});

describe("ZeroProofContent — board details", () => {
  const NOW = new Date("2026-09-08T00:00:00.000Z").getTime();
  let nowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(NOW);
  });
  afterEach(() => nowSpy.mockRestore());

  it("says a fixture has no lines yet, with nothing to bet on", async () => {
    renderPage(undefined, undefined, () =>
      HttpResponse.json({ events: [{ ...EVENTS.events[0], markets: [] }] }),
    );

    expect(await screen.findByText("No lines posted yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Celtics/ })).toBeNull();
  });

  it("states what the biggest underdog pays as a multiple of the stake", async () => {
    renderPage(undefined, undefined, () =>
      HttpResponse.json({
        events: [
          {
            ...EVENTS.events[0],
            markets: [
              {
                market: "h2h",
                fetchedAt: "2026-09-08T00:00:00.000Z",
                outcomes: [
                  { name: "Lakers", priceAmerican: -450 },
                  { name: "Celtics", priceAmerican: 350 },
                ],
              },
            ],
          },
        ],
      }),
    );

    const underdog = await screen.findByRole("region", { name: "Biggest underdog" });
    expect(underdog).toHaveTextContent("Celtics");
    expect(underdog).toHaveTextContent("Pays 4.5× if it lands");
  });

  it("stops offering earlier fixtures once the three-month window is reached", async () => {
    const pastDaysRequested: number[] = [];
    renderPage(undefined, undefined, (request) => {
      const url = request ? new URL(request.url) : null;
      if (url?.searchParams.get("include") === "past") {
        pastDaysRequested.push(Number(url.searchParams.get("pastDays")));
      }
      return HttpResponse.json(EVENTS);
    });
    await screen.findByRole("heading", { name: /Celtics/ });
    fireEvent.click(await screen.findByRole("switch", { name: /show past fixtures/i }));

    for (let clicks = 0; clicks < 12; clicks += 1) {
      const more = await screen.findByRole("button", { name: /load earlier/i }).catch(() => null);
      if (!more) break;
      fireEvent.click(more);
      await waitFor(() => expect(Math.max(...pastDaysRequested)).toBeGreaterThan(14));
    }

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /load earlier/i })).toBeNull(),
    );
    expect(Math.max(...pastDaysRequested)).toBe(90);
  });

  it("still shows the board when the bets request is turned away", async () => {
    renderPage(
      () => HttpResponse.json(PROFILE),
      () => new HttpResponse(null, { status: 401 }),
    );

    expect(await screen.findByRole("heading", { name: /Celtics/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText("Your bet")).toBeNull();
  });
});

describe("ZeroProofContent — leaderboard figures", () => {
  it("numbers the rows from one, signs a positive ROI, and dashes a missing sharp score", async () => {
    renderPage(undefined, undefined, undefined, undefined, undefined, () =>
      HttpResponse.json({
        entries: [
          { userSub: "auth0|a", wins: 5, losses: 1, pushes: 0, betCount: 6, roiPct: 12.5, sharpScore: 77.5 },
          { userSub: "auth0|b", wins: 2, losses: 3, pushes: 0, betCount: 5, roiPct: -4.2, sharpScore: null },
        ],
      }),
    );
    await goToTab(/leaderboard/i);
    const board = await screen.findByRole("table", { name: /leaderboard/i });

    const [first, second] = within(board).getAllByRole("row").slice(1);
    const cells = (row: HTMLElement) =>
      within(row).getAllByRole("cell").map((cell) => cell.textContent);
    expect(cells(first)).toEqual(["1", playerHandle("auth0|a"), "5-1-0", "+12.5%", "77.5"]);
    expect(cells(second)).toEqual(["2", playerHandle("auth0|b"), "2-3-0", "-4.2%", "—"]);
  });
});

describe("ZeroProofContent — your record, in full", () => {
  /** A graded bet at even money, so a $10 win is +$10 and a $10 loss is -$10. */
  const graded = (
    id: string,
    status: string,
    settledAt: string,
    over: Record<string, unknown> = {},
  ) => ({
    id,
    walletId: "w1",
    eventId: "evt-1",
    market: "h2h",
    selection: "Celtics",
    oddsAmerican: 100,
    lineValue: null,
    closingOddsAmerican: 100,
    clv: 1,
    stakeCents: 1000,
    status,
    placedAt: "2026-09-01T00:00:00.000Z",
    settledAt,
    ...over,
  });

  const openRecord = async (...args: Parameters<typeof renderPage>) => {
    renderPage(...args);
    await goToTab(/your record/i);
    return screen.findByRole("tabpanel", { name: /your record/i });
  };

  /** The value printed under a stat's label. */
  const statValue = (panel: HTMLElement, label: string) =>
    within(panel).getByText(label).nextElementSibling?.textContent;

  it("fills in every stat tile from the profile and the settled bets", async () => {
    const panel = await openRecord(
      () => HttpResponse.json(PROFILE),
      () =>
        HttpResponse.json({
          bets: [
            graded("a", "won", "2026-09-02T00:00:00.000Z"),
            graded("b", "lost", "2026-09-03T00:00:00.000Z", { stakeCents: 400 }),
          ],
        }),
    );
    await within(panel).findByText("18-11-2");

    expect(statValue(panel, "Record")).toBe("18-11-2");
    // 18 wins of 29 graded.
    expect(statValue(panel, "Win rate")).toBe("62%");
    expect(statValue(panel, "ROI")).toBe("+8.4%");
    // +$10.00 won, -$4.00 lost.
    await waitFor(() => expect(statValue(panel, "Net profit")).toBe("+$6.00"));
    expect(statValue(panel, "Sharp score")).toBe("72.5");
    expect(statValue(panel, "Avg CLV")).toBe("+2.1%");
    expect(statValue(panel, "Streak")).toBe("W3");
    expect(statValue(panel, "Best streak")).toBe("W6");
    expect(statValue(panel, "Biggest hit")).toBe("$42.00");
    expect(statValue(panel, "Bets")).toBe("29");
  });

  it("shows a dash rather than a number for a win rate nobody has earned yet", async () => {
    const panel = await openRecord(() =>
      HttpResponse.json({
        ...PROFILE,
        stats: { ...PROFILE.stats, wins: 0, losses: 0, pushes: 0, betCount: 0, sharpScore: null },
      }),
    );
    await within(panel).findByText("0-0-0");

    expect(statValue(panel, "Win rate")).toBe("—");
    expect(statValue(panel, "Sharp score")).toBe("—");
  });

  it("shows each wallet's balance against what was locked", async () => {
    const panel = await openRecord(() => HttpResponse.json(PROFILE));

    const wallet = (await within(panel).findByText("$118.40")).closest("li");
    expect(wallet).toHaveTextContent("of $100.00 locked");
    expect(wallet).toHaveTextContent("season");
    expect(wallet).toHaveTextContent("active");
  });

  it("charts nothing from a single settled bet, and states both totals from two", async () => {
    const one = await openRecord(
      () => HttpResponse.json(PROFILE),
      () => HttpResponse.json({ bets: [graded("a", "won", "2026-09-02T00:00:00.000Z")] }),
    );
    await within(one).findByText("18-11-2");
    expect(within(one).queryByRole("heading", { name: /bankroll trend/i })).toBeNull();
  });

  it("states the bankroll trend in dollars, overall and for the season wallet", async () => {
    const panel = await openRecord(
      () => HttpResponse.json(PROFILE),
      () =>
        HttpResponse.json({
          bets: [
            graded("a", "won", "2026-09-02T00:00:00.000Z"),
            graded("b", "lost", "2026-09-03T00:00:00.000Z", { stakeCents: 400 }),
          ],
        }),
    );

    const summary = await within(panel).findByText(/over 2 settled bets/i);
    expect(summary).toHaveTextContent("Overall +$6.00");
    expect(summary).toHaveTextContent("Season +$6.00");
  });

  it("shows a minus sign on a losing trend", async () => {
    const panel = await openRecord(
      () => HttpResponse.json(PROFILE),
      () =>
        HttpResponse.json({
          bets: [
            graded("a", "lost", "2026-09-02T00:00:00.000Z"),
            graded("b", "lost", "2026-09-03T00:00:00.000Z", { stakeCents: 500 }),
          ],
        }),
    );

    expect(await within(panel).findByText(/over 2 settled bets/i)).toHaveTextContent(
      "Overall -$15.00",
    );
  });

  it("shows recent form as win, loss and push chips, newest first", async () => {
    const panel = await openRecord(
      () => HttpResponse.json(PROFILE),
      () =>
        HttpResponse.json({
          bets: [
            graded("a", "won", "2026-09-02T00:00:00.000Z"),
            graded("b", "lost", "2026-09-03T00:00:00.000Z"),
            graded("c", "push", "2026-09-04T00:00:00.000Z"),
          ],
        }),
    );

    const form = await within(panel).findByRole("list", {
      name: /recent settled bets, newest first/i,
    });
    expect(within(form).getAllByRole("listitem").map((chip) => chip.textContent)).toEqual([
      "PushP",
      "LossL",
      "WinW",
    ]);
  });

  it("keeps recent form to the last eight settled bets", async () => {
    const bets = Array.from({ length: 10 }, (_, i) =>
      graded(`b${i}`, "won", `2026-09-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`),
    );
    const panel = await openRecord(
      () => HttpResponse.json(PROFILE),
      () => HttpResponse.json({ bets }),
    );

    const form = await within(panel).findByRole("list", {
      name: /recent settled bets, newest first/i,
    });
    expect(within(form).getAllByRole("listitem")).toHaveLength(8);
  });

  it("lists at most the twelve latest bets in the history", async () => {
    const bets = Array.from({ length: 15 }, (_, i) =>
      graded(`b${i}`, "won", `2026-09-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`),
    );
    const panel = await openRecord(
      () => HttpResponse.json(PROFILE),
      () => HttpResponse.json({ bets }),
    );

    const heading = await within(panel).findByText("Recent bets");
    const list = heading.parentElement?.querySelector("ul");
    expect(list?.querySelectorAll(":scope > li")).toHaveLength(12);
  });

  it("says the record could not be loaded, and recovers with Try again", async () => {
    let failing = true;
    renderPage(() =>
      failing ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(PROFILE),
    );
    await goToTab(/your record/i);
    const panel = await screen.findByRole("tabpanel", { name: /your record/i });
    const alert = await within(panel).findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load your profile right now.");

    failing = false;
    fireEvent.click(within(alert).getByRole("button", { name: /try again/i }));

    expect(await within(panel).findByText("18-11-2")).toBeInTheDocument();
    expect(within(panel).queryByRole("alert")).toBeNull();
  });

  it("lists only the open bets as upcoming on the Compare tab", async () => {
    renderPage(
      () => HttpResponse.json(PROFILE),
      () =>
        HttpResponse.json({
          bets: [
            graded("open-1", "open", "", { settledAt: null, selection: "Lakers", stakeCents: 700 }),
            graded("done-1", "won", "2026-09-02T00:00:00.000Z", { selection: "Heat" }),
          ],
        }),
    );
    await goToTab(/compare/i);

    const upcoming = await screen.findByRole("region", { name: /upcoming/i });
    expect(within(upcoming).getByText("Lakers")).toBeInTheDocument();
    expect(within(upcoming).queryByText("Heat")).toBeNull();
  });
});
