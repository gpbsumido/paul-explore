import { describe, it, expect } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import type { ESPNRosterEntry, ESPNScheduleEntry, ESPNTeam } from "@/types/espn";
import PredictionPanel from "./PredictionPanel";

const USER_TEAM_ID = 1;
const OPPONENT_TEAM_ID = 2;

/** A roster entry whose season average is `perGame`, over 40 games played. */
const entry = (
  id: number,
  fullName: string,
  perGame: number,
  overrides: Partial<ESPNRosterEntry["playerPoolEntry"]["player"]> & { lineupSlotId?: number } = {},
): ESPNRosterEntry => {
  const { lineupSlotId = 0, ...player } = overrides;
  return {
    lineupSlotId,
    playerPoolEntry: {
      player: {
        id,
        fullName,
        defaultPositionId: 1,
        proTeamId: 1,
        injuryStatus: "ACTIVE",
        stats: [{ id: "002026", appliedTotal: perGame * 40, stats: { "42": 40 } }],
        ...player,
      },
    },
  };
};

const team = (id: number, entries: ESPNRosterEntry[], rank: number, wins = 10, losses = 5): ESPNTeam => ({
  id,
  name: `Team ${id}`,
  abbrev: `T${id}`,
  owners: [],
  record: { overall: { wins, losses } },
  roster: { entries },
  currentProjectedRank: rank,
  rankCalculatedFinal: rank,
});

const side = (teamId: number) => ({
  teamId,
  totalPoints: 0,
  cumulativeScore: { wins: 0, losses: 0, ties: 0, scoreByStat: {} },
});

const weekMatchups: ESPNScheduleEntry[] = [
  { id: 1, away: side(USER_TEAM_ID), home: side(OPPONENT_TEAM_ID), winner: "UNDECIDED" },
];

/** Pro team 1 plays twice this week, pro team 2 once, pro team 3 not at all. */
const schedule = {
  1: [
    { date: "2026-03-30", opp: "BOS", home: true },
    { date: "2026-04-01", opp: "NYK", home: false },
  ],
  2: [{ date: "2026-03-31", opp: "MIA", home: true }],
};

function serve({
  freeAgents = [] as unknown[],
  scheduleStatus = 200,
}: { freeAgents?: unknown[]; scheduleStatus?: number } = {}) {
  server.use(
    http.get("/api/nba/schedule", () =>
      scheduleStatus === 200
        ? HttpResponse.json(schedule)
        : HttpResponse.json({ error: "nope" }, { status: scheduleStatus }),
    ),
    http.get("/api/nba/freeagents", () => HttpResponse.json(freeAgents)),
  );
}

function renderPanel(teams: ESPNTeam[], overrides: Partial<React.ComponentProps<typeof PredictionPanel>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PredictionPanel
        teams={teams}
        userTeamId={USER_TEAM_ID}
        weekMatchups={weekMatchups}
        season={2026}
        {...overrides}
      />
    </QueryClientProvider>,
  );
}

const rowFor = (name: string) => within(screen.getByRole("table")).getByText(name).closest("tr")!;

describe("PredictionPanel", () => {
  it("projects each player's week as their average times games, and calls the top slots START", async () => {
    serve();
    renderPanel([
      team(USER_TEAM_ID, [
        entry(10, "Ann Ames", 20, { proTeamId: 1 }),
        entry(11, "Cole Crash", 10, { proTeamId: 2 }),
        entry(12, "Dee Dunn", 5, { proTeamId: 3, lineupSlotId: 13 }),
      ], 1),
      team(OPPONENT_TEAM_ID, [], 2),
    ]);

    await screen.findByText("Ann Ames");
    // 20 a game over two games, 10 over one, nothing for a team that is off.
    expect(within(rowFor("Ann Ames")).getByText("40")).toBeInTheDocument();
    expect(within(rowFor("Cole Crash")).getAllByText("10").length).toBeGreaterThan(0);
    expect(rowFor("Dee Dunn")).toHaveTextContent("No games");

    // Two lineup slots are active, so the two best projections start.
    expect(rowFor("Ann Ames")).toHaveTextContent("START");
    expect(rowFor("Cole Crash")).toHaveTextContent("START");
    expect(rowFor("Dee Dunn")).toHaveTextContent("SIT");
  });

  it("lists a player's games with the date, home or away, and the opponent", async () => {
    serve();
    renderPanel([team(USER_TEAM_ID, [entry(10, "Ann Ames", 20)], 1), team(OPPONENT_TEAM_ID, [], 2)]);

    await screen.findByText("Ann Ames");
    expect(rowFor("Ann Ames")).toHaveTextContent("Mon 3/30 vs BOS");
    expect(rowFor("Ann Ames")).toHaveTextContent("Wed 4/1 @ NYK");
  });

  it("discounts an injured player's projection and flags the status, and lists them under Injury Watch", async () => {
    serve();
    renderPanel([
      team(USER_TEAM_ID, [
        entry(10, "Ann Ames", 20, { proTeamId: 1, injuryStatus: "DAY_TO_DAY" }),
        entry(11, "Cole Crash", 20, { proTeamId: 1, injuryStatus: "OUT" }),
      ], 1),
      team(OPPONENT_TEAM_ID, [], 2),
    ]);

    await screen.findByRole("table");
    // 20 a game over two games is 40; day-to-day keeps three quarters of it and
    // OUT keeps none.
    expect(within(rowFor("Ann Ames")).getByText("DTD")).toBeInTheDocument();
    expect(within(rowFor("Ann Ames")).getByText("30")).toBeInTheDocument();
    expect(within(rowFor("Cole Crash")).getByText("OUT")).toBeInTheDocument();
    expect(within(rowFor("Cole Crash")).getByText("0")).toBeInTheDocument();

    const watch = screen.getByRole("heading", { name: /injury watch/i }).closest("section")!;
    expect(within(watch).getByText("Ann Ames")).toBeInTheDocument();
    expect(within(watch).getByText("Cole Crash")).toBeInTheDocument();
  });

  it("says there are no injury flags when the roster is healthy", async () => {
    serve();
    renderPanel([team(USER_TEAM_ID, [entry(10, "Ann Ames", 20)], 1), team(OPPONENT_TEAM_ID, [], 2)]);

    expect(await screen.findByText(/no injury flags on your roster/i)).toBeInTheDocument();
  });

  it("sums only the active starters into the projected totals and writes the outlook", async () => {
    serve();
    renderPanel([
      team(USER_TEAM_ID, [
        entry(10, "Ann Ames", 20, { proTeamId: 1 }),
        entry(11, "Bench Guy", 50, { proTeamId: 1, lineupSlotId: 13 }),
      ], 1),
      team(OPPONENT_TEAM_ID, [entry(20, "Rival Star", 10, { proTeamId: 1 })], 3, 8, 7),
    ]);

    // 40 for the starter (the bench slot is not counted) against 20 for the rival.
    const outlook = (await screen.findByRole("heading", { name: /weekly outlook/i })).closest("section")!;
    expect(outlook).toHaveTextContent("40vs20projected");
    expect(outlook).toHaveTextContent("You're ranked #1 facing a solid opponent ranked #3 (8-7).");
    expect(outlook).toHaveTextContent("Slight projection edge in your favor.");
  });

  it("says the rival projects stronger when they are well ahead", async () => {
    serve();
    renderPanel([
      team(USER_TEAM_ID, [entry(10, "Ann Ames", 5, { proTeamId: 1 })], 5),
      team(OPPONENT_TEAM_ID, [entry(20, "Rival Star", 40, { proTeamId: 1 })], 1),
    ]);

    const outlook = (await screen.findByRole("heading", { name: /weekly outlook/i })).closest("section")!;
    expect(outlook).toHaveTextContent("facing a top-tier opponent");
    expect(outlook).toHaveTextContent("Their roster projects stronger this week.");
    expect(outlook).toHaveTextContent("Consider streaming");
  });

  it("says there is no opponent when the week has no matchup for the team", async () => {
    serve();
    renderPanel([team(USER_TEAM_ID, [entry(10, "Ann Ames", 20)], 1)], { weekMatchups: [] });

    expect(await screen.findByText("No opponent found for this week.")).toBeInTheDocument();
  });

  it("suggests real free agents with their team, position and games this week, skipping scoreless ones", async () => {
    serve({
      freeAgents: [
        { id: 90, name: "Pickup Pat", position: 5, proTeamId: 2, avgPts: 18.5 },
        { id: 91, name: "Scoreless Sam", position: 1, proTeamId: 2, avgPts: 0 },
      ],
    });
    renderPanel([team(USER_TEAM_ID, [entry(10, "Ann Ames", 20)], 1), team(OPPONENT_TEAM_ID, [], 2)]);

    const pat = (await screen.findByText("Pickup Pat")).closest("div")!;
    expect(pat).toHaveTextContent("BOS · C · 1G this wk");
    expect(screen.queryByText("Scoreless Sam")).not.toBeInTheDocument();
  });

  it("renders nothing when the schedule can't be loaded, rather than guessing a week", async () => {
    serve({ scheduleStatus: 500 });
    const { container } = renderPanel([team(USER_TEAM_ID, [entry(10, "Ann Ames", 20)], 1)]);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(screen.queryByText("Ann Ames")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
