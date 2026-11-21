import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import type { Player, PlayerStats, Team } from "@/types/nba";
import StatsContent from "./StatsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/fantasy/nba/player/stats",
}));

const team = (id: number, full_name: string): Team => ({
  id,
  full_name,
  abbreviation: full_name.slice(0, 3).toUpperCase(),
  city: full_name,
  conference: "East",
  division: "Atlantic",
  name: full_name,
});

const player = (id: number, first_name: string, last_name: string, position = "G"): Player => ({
  id,
  first_name,
  last_name,
  position,
});

const stats = (overrides: Partial<PlayerStats>): PlayerStats => ({
  pts: 10,
  reb: 5,
  ast: 3,
  stl: 1,
  blk: 0.5,
  games_played: 40,
  min: "30:00",
  fgm: 4,
  fga: 9,
  fg_pct: 0.44,
  ft_pct: 0.8,
  fg3_pct: 0.36,
  turnover: 2,
  fantasy_points: 28.4,
  ...overrides,
});

/** The three teams come back out of order so the selector's sort is visible. */
const TEAMS = [team(2, "Boston Celtics"), team(1, "Atlanta Hawks"), team(3, "Chicago Bulls")];

/** Serves the teams, a Hawks roster of three, and their stats (Cole's request fails). */
function serveLeague() {
  server.use(
    http.get("/api/nba/teams", () => HttpResponse.json({ data: TEAMS })),
    http.get("/api/nba/players/:teamId", ({ params }) =>
      HttpResponse.json({
        data:
          params.teamId === "1"
            ? [
                player(11, "Ann", "Ames", "G"),
                player(12, "Bea", "Bright", "F"),
                player(13, "Cole", "Crash", "C"),
              ]
            : [player(21, "Dee", "Dunn", "G")],
      }),
    ),
    http.get("/api/nba/stats/:playerId", ({ params }) => {
      switch (params.playerId) {
        case "11":
          return HttpResponse.json({ data: [stats({ pts: 12.34, reb: 4, fantasy_points: 30 })] });
        case "12":
          return HttpResponse.json({ data: [stats({ pts: 25.5, reb: 9, fantasy_points: undefined })] });
        case "21":
          return HttpResponse.json({ data: [stats({ pts: 8 })] });
        default:
          return HttpResponse.json({ error: "nope" }, { status: 500 });
      }
    }),
  );
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <StatsContent />
    </QueryClientProvider>,
  );
}

/** Player names in the order the table shows them. */
const rowNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).queryByText(/Ames|Bright|Crash|Dunn/)?.textContent)
    .filter(Boolean);

describe("StatsContent", () => {
  it("lists the teams alphabetically and opens on the first one's roster", async () => {
    serveLeague();
    renderPage();

    const teamSelect = await screen.findByLabelText("Team");
    await screen.findByText("Ann Ames");

    const options = within(teamSelect).getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Select a team…", "Atlanta Hawks", "Boston Celtics", "Chicago Bulls"]);
    expect(teamSelect).toHaveValue("1");
  });

  it("shows each player's stats to one decimal, and a dash when there is no fantasy figure", async () => {
    serveLeague();
    renderPage();

    const ann = (await screen.findByText("Ann Ames")).closest("tr")!;
    expect(within(ann).getByText("12.3")).toBeInTheDocument();
    expect(within(ann).getByText("30.0")).toBeInTheDocument();
    const bea = (await screen.findByText("Bea Bright")).closest("tr")!;
    expect(within(bea).getByText("25.5")).toBeInTheDocument();
    expect(within(bea).getByText("—")).toBeInTheDocument();
  });

  it("orders by points, best first, and flips or re-sorts from the column headers", async () => {
    const user = userEvent.setup();
    serveLeague();
    renderPage();

    await screen.findByText("Bea Bright");
    await screen.findByText("Cole Crash");
    expect(rowNames()).toEqual(["Bea Bright", "Ann Ames", "Cole Crash"]);

    await user.click(screen.getByRole("columnheader", { name: /^PTS/ }));
    expect(rowNames()).toEqual(["Cole Crash", "Ann Ames", "Bea Bright"]);

    await user.click(screen.getByRole("columnheader", { name: /^Player/ }));
    expect(rowNames()).toEqual(["Ann Ames", "Bea Bright", "Cole Crash"]);
  });

  it("marks a player whose stats failed to load, and explains why when the row is clicked", async () => {
    const user = userEvent.setup();
    serveLeague();
    renderPage();

    const crash = (await screen.findByText("Cole Crash")).closest("tr")!;
    expect(crash).toHaveTextContent("Failed to load stats");

    await user.click(crash);
    expect(await screen.findByText("Why did this fail?")).toBeInTheDocument();
  });

  it("loads the roster of whichever team is picked", async () => {
    const user = userEvent.setup();
    serveLeague();
    renderPage();

    await screen.findByText("Ann Ames");
    await user.selectOptions(screen.getByLabelText("Team"), "3");

    expect(await screen.findByText("Dee Dunn")).toBeInTheDocument();
    expect(screen.queryByText("Ann Ames")).not.toBeInTheDocument();
  });

  it("only offers the comparison once two players have stats, and shows it when opened", async () => {
    const user = userEvent.setup();
    serveLeague();
    renderPage();

    const compare = await screen.findByRole("button", { name: /open player comparison/i });
    await screen.findByText("Bea Bright");
    await screen.findByText("Cole Crash");
    expect(compare).toBeEnabled();

    await user.selectOptions(screen.getByLabelText("Team"), "3");
    await screen.findByText("Dee Dunn");
    expect(screen.getByRole("button", { name: /open player comparison/i })).toBeDisabled();
  });

  it("says so, with a retry, when the teams can't be loaded", async () => {
    const user = userEvent.setup();
    server.use(http.get("/api/nba/teams", () => HttpResponse.json({ error: "nope" }, { status: 500 })));
    renderPage();

    expect(await screen.findByText("Failed to load teams")).toBeInTheDocument();
    expect(screen.queryByText(/pick a team/i)).not.toBeInTheDocument();

    serveLeague();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("Ann Ames")).toBeInTheDocument();
  });
});
