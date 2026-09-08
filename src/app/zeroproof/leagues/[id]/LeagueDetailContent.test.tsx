import { describe, it, expect, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
  callerWalletId: null,
  isMember: false,
  isCommissioner: false,
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

  it("shows the ESPN binding when the league is bound", async () => {
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () =>
        HttpResponse.json(
          detail({ league: league({ espnGame: "ffl", espnLeagueId: "836777691", espnSeason: "2026" }) }),
        ),
      ),
    );
    renderDetail();
    expect(await screen.findByText(/only ESPN football league/i)).toBeInTheDocument();
    expect(screen.getByText("836777691")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    server.use(http.get("/api/zeroproof/leagues/lg-1", () => HttpResponse.json(detail())));
    const { container } = renderDetail();
    await screen.findByRole("table", { name: /standings/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
