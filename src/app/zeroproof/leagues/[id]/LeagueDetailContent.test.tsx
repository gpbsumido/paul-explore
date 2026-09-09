import { describe, it, expect, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";
import LeagueDetailContent from "./LeagueDetailContent";

const league = (overrides: Record<string, unknown> = {}) => ({
  id: "lg-1",
  commissionerSub: "auth0|boss",
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
  memberCount: 2,
  ...overrides,
});

const standing = (userSub: string, rank: number, balanceCents: number) => ({
  userSub,
  balanceCents,
  wins: 3,
  losses: 1,
  pushes: 0,
  betCount: 4,
  roiPct: 20,
  rank,
});

const detail = (overrides: Record<string, unknown> = {}) => ({
  league: league(),
  standings: [standing("auth0|a", 1, 184000), standing("auth0|b", 2, 120000)],
  espnLeagues: [],
  callerWalletId: null,
  isMember: false,
  isCommissioner: false,
  ...overrides,
});

const espnLeague = (overrides: Record<string, unknown> = {}) => ({
  id: "le-1",
  game: "ffl",
  leagueId: "836777691",
  season: "2026",
  label: "The office league",
  createdAt: "2026-09-08T00:00:00.000Z",
  ...overrides,
});

const renderDetail = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LeagueDetailContent leagueId="lg-1" />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

afterEach(() => server.resetHandlers());

describe("LeagueDetailContent", () => {
  it("renders the rules and standings ranked by bankroll", async () => {
    server.use(http.get("/api/zeroproof/leagues/lg-1", () => HttpResponse.json(detail())));
    renderDetail();

    expect(await screen.findByRole("heading", { name: /friday night parlays/i })).toBeInTheDocument();
    const table = await screen.findByRole("table", { name: /friday night parlays standings/i });
    const firstDataRow = within(table).getAllByRole("row")[1];
    expect(within(firstDataRow).getByText("1")).toBeInTheDocument();
    expect(within(firstDataRow).getByText("$1,840.00")).toBeInTheDocument();
  });

  it("shows a Join button for a joinable public league", async () => {
    server.use(http.get("/api/zeroproof/leagues/lg-1", () => HttpResponse.json(detail())));
    renderDetail();
    expect(await screen.findByRole("button", { name: /join this league/i })).toBeInTheDocument();
  });

  it("shows the winner banner when the league is settled", async () => {
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () =>
        HttpResponse.json(
          detail({ league: league({ status: "settled", winnerSub: "auth0|a" }) }),
        ),
      ),
    );
    renderDetail();
    expect(await screen.findByRole("status")).toHaveTextContent(/winner/i);
  });

  it("lists the ESPN leagues added to the league", async () => {
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () =>
        HttpResponse.json(detail({ espnLeagues: [espnLeague()] })),
      ),
    );
    renderDetail();
    const list = await screen.findByRole("list", { name: /added espn leagues/i });
    expect(list).toHaveTextContent("836777691");
    expect(list).toHaveTextContent(/The office league/i);
  });

  it("lets the commissioner add an ESPN league", async () => {
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () =>
        HttpResponse.json(detail({ isCommissioner: true })),
      ),
      http.post("/api/zeroproof/leagues/lg-1/espn-leagues", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ espnLeague: espnLeague() }, { status: 201 });
      }),
    );
    renderDetail();
    fireEvent.change(await screen.findByLabelText(/ESPN league id/i), {
      target: { value: "836777691" },
    });
    fireEvent.change(screen.getByLabelText(/^season$/i), { target: { value: "2026" } });
    fireEvent.click(screen.getByRole("button", { name: /^add league$/i }));
    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured).toMatchObject({ game: "ffl", leagueId: "836777691", season: "2026" });
  });

  it("hides the add form from a non-commissioner", async () => {
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () =>
        HttpResponse.json(detail({ espnLeagues: [espnLeague()] })),
      ),
    );
    renderDetail();
    await screen.findByRole("list", { name: /added espn leagues/i });
    expect(screen.queryByRole("button", { name: /^add league$/i })).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    server.use(http.get("/api/zeroproof/leagues/lg-1", () => HttpResponse.json(detail())));
    const { container } = renderDetail();
    await screen.findByRole("table", { name: /standings/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
