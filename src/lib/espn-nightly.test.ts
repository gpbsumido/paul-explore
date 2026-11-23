import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./upstream", () => ({ fetchUpstream: vi.fn() }));

import { fetchUpstream, type UpstreamResult } from "./upstream";
import { loadNightlySlate, scoreboardUrl, summaryUrl } from "./espn-nightly";
import { fantasyLeagueUrl } from "./espn-performances";

/** A scoreboard with one finished game that tipped on the evening of `isoDate`. */
const scoreboardWith = (events: { id: string; isoDate: string; state?: string }[]) => ({
  events: events.map((e) => ({
    id: e.id,
    date: e.isoDate,
    status: { type: { state: e.state ?? "post" } },
  })),
});

/** A box score where the home side wins and `players` each scored the given points. */
const boxscore = (players: { id: string; name: string; points: number }[]) => ({
  header: {
    season: { type: 2 },
    competitions: [
      {
        competitors: [
          { id: "1", homeAway: "home", winner: true, team: { abbreviation: "BOS" } },
          { id: "2", homeAway: "away", team: { abbreviation: "NYK" } },
        ],
      },
    ],
  },
  boxscore: {
    players: [
      {
        team: { id: "1" },
        statistics: [
          {
            keys: ["minutes", "points"],
            athletes: players.map((p) => ({
              athlete: { id: p.id, displayName: p.name },
              stats: ["30", String(p.points)],
            })),
          },
        ],
      },
    ],
  },
});

const leagueWith = (rosterIds: number[]) => ({
  teams: [
    {
      name: "Paul's Perfect Team",
      roster: { entries: rosterIds.map((id) => ({ playerPoolEntry: { player: { id } } })) },
    },
  ],
});

type Routes = Record<string, unknown>;

/**
 * Answers ESPN requests from a table keyed by a fragment of the URL, first
 * matching key wins. A URL with no entry is a 404. ESPN itself answers a quiet
 * date with a 200 and no events, so a test that wants an empty night serves
 * `{ events: [] }` rather than leaving the date out.
 */
function serve(routes: Routes) {
  vi.mocked(fetchUpstream).mockImplementation(async (url) => {
    const key = Object.keys(routes).find((fragment) => url.includes(fragment));
    const body = key === undefined ? undefined : routes[key];
    return {
      ok: true,
      response:
        body === undefined
          ? new Response("not found", { status: 404 })
          : new Response(JSON.stringify(body), { status: 200 }),
    };
  });
}

const urlsRequested = () => vi.mocked(fetchUpstream).mock.calls.map(([url]) => String(url));

beforeEach(() => {
  vi.mocked(fetchUpstream).mockReset();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-07-20T15:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("scoreboardUrl and summaryUrl", () => {
  it("point at the sport's own ESPN endpoints", () => {
    expect(scoreboardUrl("nba", "20260420")).toBe(
      "https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20260420&limit=1000",
    );
    expect(scoreboardUrl("wnba", "202604")).toBe(
      "https://site.web.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard?dates=202604&limit=1000",
    );
    expect(summaryUrl("wnba", "401")).toBe(
      "https://site.web.api.espn.com/apis/site/v2/sports/basketball/wnba/summary?event=401",
    );
  });
});

describe("loadNightlySlate with a date", () => {
  const night = { id: "e1", isoDate: "2026-04-21T02:30:00Z" };

  it("turns that night's box scores into cards dated by the venue's local day", async () => {
    serve({
      "scoreboard?dates=20260420": scoreboardWith([night]),
      "summary?event=e1": boxscore([
        { id: "10", name: "Jayson Tatum", points: 40 },
        { id: "11", name: "Derrick White", points: 12 },
      ]),
    });

    const slate = await loadNightlySlate({ sport: "wnba", season: "2025", date: "2026-04-20" });

    // 02:30Z on the 21st is still the evening of the 20th in the US.
    expect(slate).toMatchObject({ date: "2026-04-20", error: false });
    expect(slate.cards.map((c) => c.playerName)).toEqual(["Jayson Tatum", "Derrick White"]);
    expect(urlsRequested()).toContain(scoreboardUrl("wnba", "20260420"));
  });

  it("reports the asked-for date with no cards when nothing finished that night", async () => {
    serve({ "scoreboard?dates=20260420": scoreboardWith([{ ...night, state: "in" }]) });

    expect(await loadNightlySlate({ sport: "wnba", season: "2025", date: "2026-04-20" })).toEqual({
      cards: [],
      date: "2026-04-20",
      error: false,
    });
  });

  it("skips a box score that can't be fetched and keeps the rest", async () => {
    serve({
      "scoreboard?dates=20260420": scoreboardWith([night, { id: "e2", isoDate: "2026-04-21T02:30:00Z" }]),
      "summary?event=e1": boxscore([{ id: "10", name: "Jayson Tatum", points: 40 }]),
    });

    const slate = await loadNightlySlate({ sport: "wnba", season: "2025", date: "2026-04-20" });

    expect(slate.cards.map((c) => c.playerName)).toEqual(["Jayson Tatum"]);
  });
});

describe("loadNightlySlate without a date", () => {
  const settled = {
    "summary?event=e1": boxscore([{ id: "10", name: "Jayson Tatum", points: 40 }]),
  };

  // ESPN stopped answering date ranges ("400 Failed to get events endpoint."),
  // so the scan reads a calendar month at a time, which it still serves.
  it("scans back a calendar month at a time from today, newest first", async () => {
    serve({});

    await loadNightlySlate({ sport: "wnba", season: "2025" });

    const scoreboards = urlsRequested().filter((url) => url.includes("/scoreboard?"));
    expect(scoreboards[0]).toBe(scoreboardUrl("wnba", "202607"));
    expect(scoreboards[1]).toBe(scoreboardUrl("wnba", "202606"));
    expect(scoreboards[7]).toBe(scoreboardUrl("wnba", "202512"));
  });

  it("stops at the first month that produced cards", async () => {
    serve({
      "dates=202606": scoreboardWith([{ id: "e1", isoDate: "2026-06-05T23:00:00Z" }]),
      ...settled,
    });

    const slate = await loadNightlySlate({ sport: "wnba", season: "2025" });

    expect(slate).toMatchObject({ date: "2026-06-05", error: false });
    expect(slate.cards).toHaveLength(1);
    expect(urlsRequested().filter((url) => url.includes("/scoreboard?"))).toHaveLength(2);
  });

  it("keeps looking past a finished slate that yielded no cards", async () => {
    serve({
      "dates=202607": scoreboardWith([{ id: "empty", isoDate: "2026-07-15T23:00:00Z" }]),
      "dates=202606": scoreboardWith([{ id: "e1", isoDate: "2026-06-05T23:00:00Z" }]),
      ...settled,
    });

    const slate = await loadNightlySlate({ sport: "wnba", season: "2025" });

    expect(slate.date).toBe("2026-06-05");
  });

  it("gives up after eighteen quiet months with no date and no error", async () => {
    serve({ "/scoreboard?": { events: [] } });

    const slate = await loadNightlySlate({ sport: "wnba", season: "2025" });

    expect(slate).toEqual({ cards: [], date: null, error: false });
    expect(urlsRequested().filter((url) => url.includes("/scoreboard?"))).toHaveLength(18);
  });

  // An outage used to come back as error: false, so Card Lab said nothing had
  // been played instead of saying it couldn't reach ESPN.
  it("flags an error when no window's scoreboard can be read", async () => {
    serve({});

    const slate = await loadNightlySlate({ sport: "wnba", season: "2025" });

    expect(slate).toEqual({ cards: [], date: null, error: true });
  });
});

describe("a full slate", () => {
  it("keeps the top rarities scarce, however many players had a big night", async () => {
    const forty = Array.from({ length: 40 }, (_, i) => ({ id: String(100 + i), name: `Player ${i}`, points: 10 + i }));
    serve({
      "scoreboard?dates=20260420": scoreboardWith([{ id: "e1", isoDate: "2026-04-21T02:30:00Z" }]),
      "summary?event=e1": boxscore(forty),
    });

    const { cards } = await loadNightlySlate({ sport: "wnba", season: "2025", date: "2026-04-20" });

    const count = (rarity: string) => cards.filter((c) => c.rarity === rarity).length;
    expect(cards).toHaveLength(40);
    expect(count("sir")).toBeLessThanOrEqual(2);
    expect(count("rare")).toBeLessThanOrEqual(Math.max(3, Math.ceil(40 * 0.15)));
  });

  it("ignores a box score served with an error status, even if the body looks fine", async () => {
    vi.mocked(fetchUpstream).mockImplementation(async (url) => {
      const href = String(url);
      if (href.includes("scoreboard?dates=20260420")) {
        return {
          ok: true,
          response: new Response(JSON.stringify(scoreboardWith([{ id: "e1", isoDate: "2026-04-21T02:30:00Z" }]))),
        };
      }
      return {
        ok: true,
        response: new Response(JSON.stringify(boxscore([{ id: "10", name: "Jayson Tatum", points: 40 }])), {
          status: 500,
        }),
      };
    });

    const slate = await loadNightlySlate({ sport: "wnba", season: "2025", date: "2026-04-20" });

    expect(slate.cards).toEqual([]);
  });
});

describe("the fantasy roster", () => {
  const night = { id: "e1", isoDate: "2026-04-21T02:30:00Z" };
  const twoPlayers = boxscore([
    { id: "10", name: "Jayson Tatum", points: 40 },
    { id: "11", name: "Derrick White", points: 12 },
  ]);

  it("keeps only rostered players, and says which fantasy team owns them", async () => {
    serve({
      [fantasyLeagueUrl("nba", "2025")]: leagueWith([10]),
      "scoreboard?dates=20260420": scoreboardWith([night]),
      "summary?event=e1": twoPlayers,
    });

    const slate = await loadNightlySlate({ sport: "nba", season: "2025", date: "2026-04-20" });

    expect(slate.cards.map((c) => c.playerName)).toEqual(["Jayson Tatum"]);
    expect(slate.cards[0].boosts).toContain("Paul's Perfect Team");
  });

  it("shows the whole slate when the league can't be read", async () => {
    serve({
      "scoreboard?dates=20260420": scoreboardWith([night]),
      "summary?event=e1": twoPlayers,
    });

    const slate = await loadNightlySlate({ sport: "nba", season: "2025", date: "2026-04-20" });

    expect(slate.cards).toHaveLength(2);
    expect(slate.cards.every((c) => !c.boosts.includes("Paul's Perfect Team"))).toBe(true);
  });

  it("shows the whole slate when the league has no players on any roster", async () => {
    serve({
      [fantasyLeagueUrl("nba", "2025")]: leagueWith([]),
      "scoreboard?dates=20260420": scoreboardWith([night]),
      "summary?event=e1": twoPlayers,
    });

    const slate = await loadNightlySlate({ sport: "nba", season: "2025", date: "2026-04-20" });

    expect(slate.cards).toHaveLength(2);
  });

  it("reads the WNBA league for the current calendar year, whatever season it was handed", async () => {
    serve({});

    await loadNightlySlate({ sport: "wnba", season: "2019", date: "2026-04-20" });

    expect(urlsRequested()).toContain(fantasyLeagueUrl("wnba", "2026"));
  });

  it("reads the NBA league for the season it was handed", async () => {
    serve({});

    await loadNightlySlate({ sport: "nba", season: "2025", date: "2026-04-20" });

    expect(urlsRequested()).toContain(fantasyLeagueUrl("nba", "2025"));
  });
});

describe("the ESPN cookie for a private league", () => {
  const leagueHeaders = () => {
    const call = vi
      .mocked(fetchUpstream)
      .mock.calls.find(([url]) => String(url).includes("lm-api-reads.fantasy.espn.com"));
    return (call?.[1] as { headers?: Record<string, string> } | undefined)?.headers;
  };

  it("is sent when both values are set", async () => {
    vi.stubEnv("ESPN_S2", "s2-value");
    vi.stubEnv("ESPN_SWID", "{swid-value}");
    serve({});

    await loadNightlySlate({ sport: "wnba", season: "2025", date: "2026-04-20" });

    expect(leagueHeaders()).toEqual({ Cookie: "espn_s2=s2-value; SWID={swid-value}" });
  });

  it.each([
    ["only ESPN_S2", "s2-value", ""],
    ["only ESPN_SWID", "", "{swid-value}"],
    ["neither", "", ""],
  ])("is left off when %s is set", async (_label, s2, swid) => {
    vi.stubEnv("ESPN_S2", s2);
    vi.stubEnv("ESPN_SWID", swid);
    serve({});

    await loadNightlySlate({ sport: "wnba", season: "2025", date: "2026-04-20" });

    expect(leagueHeaders()).toBeUndefined();
  });

  it("is never sent to the scoreboard or box-score requests", async () => {
    vi.stubEnv("ESPN_S2", "s2-value");
    vi.stubEnv("ESPN_SWID", "{swid-value}");
    serve({
      "scoreboard?dates=20260420": scoreboardWith([{ id: "e1", isoDate: "2026-04-21T02:30:00Z" }]),
      "summary?event=e1": boxscore([{ id: "10", name: "Jayson Tatum", points: 40 }]),
    });

    await loadNightlySlate({ sport: "wnba", season: "2025", date: "2026-04-20" });

    const publicCalls = vi
      .mocked(fetchUpstream)
      .mock.calls.filter(([url]) => !String(url).includes("lm-api-reads.fantasy.espn.com"));
    expect(publicCalls.length).toBeGreaterThan(0);
    expect(publicCalls.every(([, init]) => (init as { headers?: unknown })?.headers === undefined)).toBe(true);
  });
});

describe("an unreadable upstream", () => {
  it.each([
    ["unreachable", (): UpstreamResult => ({ ok: false, cause: "unreachable", message: "down" })],
    ["answering HTML", (): UpstreamResult => ({ ok: true, response: new Response("<html>", { status: 200 }) })],
  ])("flags a scoreboard that's %s as an error, not an empty night or a crash", async (_label, scoreboard) => {
    vi.mocked(fetchUpstream).mockImplementation(async (url) => {
      if (String(url).includes("/scoreboard?")) return scoreboard();
      return { ok: true, response: new Response("<html>", { status: 200 }) };
    });

    expect(await loadNightlySlate({ sport: "wnba", season: "2025", date: "2026-04-20" })).toEqual({
      cards: [],
      date: "2026-04-20",
      error: true,
    });
  });
});
