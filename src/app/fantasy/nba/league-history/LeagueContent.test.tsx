import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { currentNbaSeason } from "@/lib/nbaSeason";
import type { ESPNLeagueResponse, ESPNTeam } from "@/types/espn";
import LeagueContent from "./LeagueContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/fantasy/nba/league-history",
}));

/** A team with just the fields the card reads, overridable per test. */
const team = (overrides: Partial<ESPNTeam> & { id: number; name: string }): ESPNTeam => ({
  abbrev: "TM",
  owners: [],
  record: { overall: { wins: 0, losses: 0 } },
  roster: { entries: [] },
  currentProjectedRank: 0,
  rankCalculatedFinal: 0,
  ...overrides,
});

const league = (teams: ESPNTeam[]): ESPNLeagueResponse => ({
  settings: { name: "The Hardwood League" },
  teams,
  members: [
    { id: "owner-1", displayName: "Paul S" },
    { id: "owner-2", displayName: "George" },
  ],
});

const serveLeague = (body: ESPNLeagueResponse, season = currentNbaSeason()) =>
  server.use(http.get(`/api/nba/league/${season}`, () => HttpResponse.json(body)));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LeagueContent />
    </QueryClientProvider>,
  );
}

describe("LeagueContent", () => {
  it("lists the teams best finish first, with record, owner and a rank badge", async () => {
    serveLeague(
      league([
        team({ id: 1, name: "Late Bloomers", owners: ["owner-2"], rankCalculatedFinal: 4, record: { overall: { wins: 30, losses: 52 } } }),
        team({ id: 2, name: "Champs", owners: ["owner-1"], rankCalculatedFinal: 1, record: { overall: { wins: 60, losses: 22 } } }),
        team({ id: 3, name: "Podium", owners: ["owner-2"], rankCalculatedFinal: 3 }),
      ]),
    );
    renderPage();

    await screen.findByText("Champs");
    const names = screen
      .getAllByRole("button")
      .map((card) => within(card).queryByText(/Champs|Podium|Late Bloomers/)?.textContent)
      .filter(Boolean);
    expect(names).toEqual(["Champs", "Podium", "Late Bloomers"]);

    const champs = screen.getByText("Champs").closest("button")!;
    expect(champs).toHaveTextContent("60–22");
    expect(champs).toHaveTextContent("Paul S");
    expect(champs).toHaveTextContent("#1");
    expect(screen.getByText("The Hardwood League")).toBeInTheDocument();
  });

  it("names a team's owner Unknown when ESPN has no member for it, and hides an unset rank", async () => {
    serveLeague(
      league([
        team({ id: 1, name: "Orphans", owners: ["nobody"], rankCalculatedFinal: 0 }),
        team({ id: 2, name: "Ownerless", owners: [], rankCalculatedFinal: 0 }),
      ]),
    );
    renderPage();

    const orphans = (await screen.findByText("Orphans")).closest("button")!;
    expect(orphans).toHaveTextContent("Unknown");
    expect(orphans).not.toHaveTextContent("#0");
    expect(screen.getByText("Ownerless").closest("button")).toHaveTextContent("Unknown");
  });

  it("opens a team's roster with each player's position on click", async () => {
    const user = userEvent.setup();
    serveLeague(
      league([
        team({
          id: 1,
          name: "Champs",
          rankCalculatedFinal: 1,
          roster: {
            entries: [
              { lineupSlotId: 0, playerPoolEntry: { player: { id: 10, fullName: "Nikola Jokic", defaultPositionId: 5 } } },
              { lineupSlotId: 1, playerPoolEntry: { player: { id: 11, fullName: "Mystery Man", defaultPositionId: 9 } } },
            ],
          },
        }),
      ]),
    );
    renderPage();

    expect(screen.queryByText("Nikola Jokic")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /Champs/ }));

    const jokic = screen.getByText("Nikola Jokic").closest("tr")!;
    expect(jokic).toHaveTextContent("C");
    expect(screen.getByText("Mystery Man").closest("tr")).toHaveTextContent("—");

    await user.click(screen.getByRole("button", { name: /Champs/ }));
    expect(screen.queryByText("Nikola Jokic")).not.toBeInTheDocument();
  });

  it("loads another season's league when the selector changes", async () => {
    const user = userEvent.setup();
    const requested: string[] = [];
    const previousSeason = currentNbaSeason() - 1;
    server.use(
      http.get("/api/nba/league/:season", ({ params }) => {
        requested.push(String(params.season));
        const name = params.season === String(previousSeason) ? "Last Year's Team" : "This Year's Team";
        return HttpResponse.json(league([team({ id: 1, name, rankCalculatedFinal: 1 })]));
      }),
    );
    renderPage();

    await screen.findByText("This Year's Team");
    await user.selectOptions(screen.getByLabelText("Season"), String(previousSeason));

    expect(await screen.findByText("Last Year's Team")).toBeInTheDocument();
    expect(requested).toEqual([String(currentNbaSeason()), String(previousSeason)]);
  });

  it("says so, with a retry, when the league can't be loaded", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`/api/nba/league/${currentNbaSeason()}`, () =>
        HttpResponse.json({ error: "nope" }, { status: 500 }),
      ),
    );
    renderPage();

    expect(await screen.findByText("Failed to load league data")).toBeInTheDocument();
    expect(screen.queryByText(/no league data available/i)).not.toBeInTheDocument();

    serveLeague(league([team({ id: 1, name: "Back Again", rankCalculatedFinal: 1 })]));
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("Back Again")).toBeInTheDocument();
  });

  it("says there is no league data when the season has no teams", async () => {
    serveLeague(league([]));
    renderPage();

    expect(await screen.findByText(/no league data available/i)).toBeInTheDocument();
  });
});
