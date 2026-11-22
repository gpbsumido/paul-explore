import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { currentNbaSeason } from "@/lib/nbaSeason";
import type { ESPNScheduleEntry, ESPNScoreboardResponse, ESPNTeam } from "@/types/espn";
import MatchupContent from "./MatchupContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ usePathname: () => "/fantasy/nba/matchups" }));
// Reduced motion keeps the count-up scores from animating in jsdom.
vi.mock("@/hooks/usePrefersReducedMotion", () => ({ usePrefersReducedMotion: () => true }));

const team = (id: number, name: string, ownerId: string): ESPNTeam => ({
  id,
  name,
  abbrev: `T${id}`,
  owners: [ownerId],
  record: { overall: { wins: 0, losses: 0 } },
  roster: { entries: [] },
  currentProjectedRank: id,
  rankCalculatedFinal: id,
});

/** One side of a matchup, with the category scores keyed by ESPN stat id. */
const side = (teamId: number, totalPoints: number, byStat: Record<string, number> = {}) => ({
  teamId,
  totalPoints,
  cumulativeScore: {
    wins: 0,
    losses: 0,
    ties: 0,
    scoreByStat: Object.fromEntries(
      Object.entries(byStat).map(([id, score]) => [id, { score, result: null }]),
    ),
  },
});

const entry = (id: number, away: ReturnType<typeof side>, home: ReturnType<typeof side>): ESPNScheduleEntry => ({
  id,
  away,
  home,
  winner: "UNDECIDED",
});

/**
 * Four teams, so two matchups a week. Three weeks of schedule, with the regular
 * season ending after week two: week three is the first playoff round.
 */
function scoreboard(overrides: Partial<ESPNScoreboardResponse> = {}): ESPNScoreboardResponse {
  return {
    schedule: [
      entry(1, side(1, 5, { "0": 120, "11": 10 }), side(2, 0, { "0": 100, "11": 14 })),
      entry(2, side(3, 0), side(4, 3)),
      entry(3, side(1, 1), side(3, 6)),
      entry(4, side(2, 0), side(4, 0)),
      entry(5, side(1, 0), side(2, 0)),
      entry(6, side(3, 0), side(4, 0)),
    ],
    teams: [team(1, "Alpha", "o1"), team(2, "Bravo", "o2"), team(3, "Charlie", "o3"), team(4, "Delta", "o4")],
    members: [
      { id: "o1", displayName: "paul", firstName: "Paul", lastName: "S" },
      { id: "o2", displayName: "george" },
    ],
    settings: { name: "League", scheduleSettings: { matchupPeriodCount: 2 } },
    status: { currentMatchupPeriod: 2 },
    ...overrides,
  };
}

const serve = (body: ESPNScoreboardResponse) =>
  server.use(http.get(`/api/nba/scoreboard/${currentNbaSeason()}`, () => HttpResponse.json(body)));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MatchupContent />
    </QueryClientProvider>,
  );
}

/** The page body only, so team names in the prediction picker do not count. */
const main = () => within(screen.getByRole("main"));

describe("MatchupContent", () => {
  it("opens on the current matchup week, showing only that week's matchups", async () => {
    serve(scoreboard());
    renderPage();

    // Week two is games 3 and 4 of the schedule: Alpha v Charlie, Bravo v Delta.
    expect(await main().findByText("Charlie")).toBeInTheDocument();
    expect(main().getByText("Delta")).toBeInTheDocument();
    expect(screen.getByLabelText("Week")).toHaveValue("2");
  });

  it("steps through the weeks with the arrows and stops at either end", async () => {
    const user = userEvent.setup();
    serve(scoreboard({ status: { currentMatchupPeriod: 1 } }));
    renderPage();

    await main().findByText("Bravo");
    const previous = screen.getByRole("button", { name: "Previous week" });
    const next = screen.getByRole("button", { name: "Next week" });
    expect(previous).toBeDisabled();

    await user.click(next);
    expect(screen.getByLabelText("Week")).toHaveValue("2");
    await user.click(next);
    expect(screen.getByLabelText("Week")).toHaveValue("3");
    expect(next).toBeDisabled();
    await user.click(previous);
    expect(screen.getByLabelText("Week")).toHaveValue("2");
  });

  it("labels the playoff weeks in the selector and with a round badge", async () => {
    const user = userEvent.setup();
    serve(scoreboard());
    renderPage();

    await main().findByText("Charlie");
    const weeks = within(screen.getByLabelText("Week")).getAllByRole("option").map((o) => o.textContent);
    expect(weeks).toEqual(["Week 1", "Week 2", "Playoffs R1 (Wk 3)"]);

    expect(main().queryByText(/playoff round/i)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Week"), "3");
    expect(main().getByText("Playoff Round 1")).toBeInTheDocument();
  });

  it("says scores are still coming in only for a week where nobody has scored", async () => {
    const user = userEvent.setup();
    serve(scoreboard());
    renderPage();

    await main().findByText("Charlie");
    expect(main().queryByText(/scores update as games complete/i)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Week"), "3");
    expect(main().getByText(/scores update as games complete/i)).toBeInTheDocument();

    // Week one has a side on zero in each matchup, but somebody has scored.
    await user.selectOptions(screen.getByLabelText("Week"), "1");
    expect(main().queryByText(/scores update as games complete/i)).not.toBeInTheDocument();
  });

  it("goes back to the current week when the season changes", async () => {
    const user = userEvent.setup();
    server.use(http.get("/api/nba/scoreboard/:season", () => HttpResponse.json(scoreboard())));
    renderPage();

    await main().findByText("Charlie");
    await user.selectOptions(screen.getByLabelText("Week"), "3");
    expect(screen.getByLabelText("Week")).toHaveValue("3");

    await user.selectOptions(screen.getByLabelText("Season"), String(currentNbaSeason() - 1));
    await main().findByText("Charlie");
    expect(screen.getByLabelText("Week")).toHaveValue("2");
  });

  it("tallies category wins, counting fewer turnovers as the better score, and names the owner", async () => {
    serve(scoreboard({ status: { currentMatchupPeriod: 1 } }));
    renderPage();

    // Alpha leads PTS 120 to 100 and has fewer turnovers (10 to 14), so two of
    // the seven categories are Alpha's; the other five are level at zero.
    const card = (await main().findByText("Alpha")).closest("div.overflow-hidden")!;
    expect(card).toHaveTextContent("2–5–0");
    expect(within(card as HTMLElement).getByText("Paul S")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("george")).toBeInTheDocument();

    // A category both sides are level on has no winner to highlight.
    const rebounds = within(within(card as HTMLElement).getByText("REB").closest("tr")!).getAllByRole("cell");
    expect(rebounds[0]).not.toHaveClass("font-bold");
    expect(rebounds[2]).not.toHaveClass("font-bold");

    const turnovers = within(card as HTMLElement).getByText("TO").closest("tr")!;
    const [alpha, , bravo] = within(turnovers).getAllByRole("cell");
    expect(alpha).toHaveClass("font-bold");
    expect(bravo).not.toHaveClass("font-bold");
  });

  it("calls an owner Unknown when ESPN has no member for the team", async () => {
    serve(scoreboard({ status: { currentMatchupPeriod: 1 } }));
    renderPage();

    const card = (await main().findByText("Charlie")).closest("div.overflow-hidden") as HTMLElement;
    expect(within(card).getAllByText("Unknown")).toHaveLength(2);
  });

  it("says so, with a retry, when the scoreboard can't be loaded", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`/api/nba/scoreboard/${currentNbaSeason()}`, () =>
        HttpResponse.json({ error: "nope" }, { status: 500 }),
      ),
    );
    renderPage();

    expect(await main().findByText("Failed to load scoreboard")).toBeInTheDocument();

    serve(scoreboard());
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(await main().findByText("Charlie")).toBeInTheDocument();
  });

  it("says there are no matchups when the season has no schedule", async () => {
    serve(scoreboard({ schedule: [] }));
    renderPage();

    expect(await main().findByText(/no matchups for this week/i)).toBeInTheDocument();
  });
});
