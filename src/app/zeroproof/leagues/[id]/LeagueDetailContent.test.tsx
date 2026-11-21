import { describe, it, expect, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";
import { playerHandle } from "@/lib/zeroproof/format";
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
  lastCheckedAt: "2026-09-09T00:00:00.000Z",
  lastOkAt: "2026-09-09T00:00:00.000Z",
  lastError: null,
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
    // A healthy league shows no warning.
    expect(list).not.toHaveTextContent(/couldn't reach/i);
  });

  it("warns when an added ESPN league can't be resolved", async () => {
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () =>
        HttpResponse.json(
          detail({
            espnLeagues: [
              espnLeague({
                lastOkAt: null,
                lastError: "ESPN fantasy returned 401 for ffl:836777691:2026",
              }),
            ],
          }),
        ),
      ),
    );
    renderDetail();
    const list = await screen.findByRole("list", { name: /added espn leagues/i });
    expect(list).toHaveTextContent(/couldn't reach this league/i);
    expect(list).toHaveTextContent(/401/);
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

/** Serves one detail payload for lg-1. */
const serveDetail = (payload: ReturnType<typeof detail>) =>
  server.use(http.get("/api/zeroproof/leagues/lg-1", () => HttpResponse.json(payload)));

describe("LeagueDetailContent rules and standings", () => {
  it("spells out the members, how it is won and the starting bankroll", async () => {
    serveDetail(detail());
    renderDetail();
    expect(
      await screen.findByText("2/10 members \u00b7 first to $2,000.00 \u00b7 $500.00 to start"),
    ).toBeInTheDocument();
  });

  it("names a timeline league's end date", async () => {
    const endsAt = "2026-12-24T12:00:00.000Z";
    serveDetail(
      detail({
        league: league({ winCondition: "timeline", thresholdCents: null, endsAt }),
      }),
    );
    renderDetail();
    expect(
      await screen.findByText(
        `2/10 members \u00b7 highest by ${new Date(endsAt).toLocaleDateString()} \u00b7 $500.00 to start`,
      ),
    ).toBeInTheDocument();
  });

  it("shows each player's rank, handle, bankroll, ROI and record in rank order", async () => {
    serveDetail(detail());
    renderDetail();
    const table = await screen.findByRole("table", { name: /standings/i });
    const [first, second] = within(table).getAllByRole("row").slice(1);

    expect(within(first).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "1",
      playerHandle("auth0|a"),
      "$1,840.00",
      "+20%",
      "3-1-0",
    ]);
    expect(within(second).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "2",
      playerHandle("auth0|b"),
      "$1,200.00",
      "+20%",
      "3-1-0",
    ]);
  });

  it("says the board is level when nothing has settled", async () => {
    serveDetail(detail({ standings: [] }));
    renderDetail();
    expect(await screen.findByText(/no bets settled yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: /standings/i })).toBeNull();
  });

  it("names the winner once a league has settled, and not before", async () => {
    serveDetail(
      detail({ league: league({ status: "settled", winnerSub: "auth0|a" }) }),
    );
    const settled = renderDetail();
    expect(await screen.findByRole("status")).toHaveTextContent(
      `Winner: ${playerHandle("auth0|a")}`,
    );
    settled.unmount();

    serveDetail(detail({ league: league({ status: "open", winnerSub: null }) }));
    renderDetail();
    await screen.findByRole("heading", { name: /friday night parlays/i });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("says the league does not exist on a 404, with a way back", async () => {
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () => new HttpResponse(null, { status: 404 })),
    );
    renderDetail();
    expect(await screen.findByText("This league doesn't exist.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to zeroproof/i })).toHaveAttribute(
      "href",
      "/zeroproof",
    );
  });

  it("says the league could not be loaded on a server error", async () => {
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () => new HttpResponse(null, { status: 500 })),
    );
    renderDetail();
    expect(await screen.findByText("Couldn't load the league (500)")).toBeInTheDocument();
  });
});

describe("LeagueDetailContent joining", () => {
  it.each([
    ["a full league", detail({ league: league({ memberCount: 10, maxMembers: 10 }) })],
    ["a settled league", detail({ league: league({ status: "settled", winnerSub: "auth0|a" }) })],
    ["a league the caller is already in", detail({ isMember: true })],
  ])("offers no Join button on %s", async (_name, payload) => {
    serveDetail(payload);
    renderDetail();
    await screen.findByRole("heading", { name: /friday night parlays/i });
    expect(screen.queryByRole("button", { name: /join this league/i })).toBeNull();
  });

  it("tells a visitor an invite-only league needs the commissioner's code", async () => {
    serveDetail(detail({ league: league({ visibility: "invite" }) }));
    renderDetail();
    expect(await screen.findByText(/invite only/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /join this league/i })).toBeNull();
  });

  it("joins, then shows the member view once the detail refreshes", async () => {
    let member = false;
    const joins: unknown[] = [];
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () =>
        HttpResponse.json(detail({ isMember: member, callerWalletId: member ? "w1" : null })),
      ),
      http.post("/api/zeroproof/leagues/lg-1/join", async ({ request }) => {
        joins.push(await request.json());
        member = true;
        return HttpResponse.json({ ok: true });
      }),
    );
    renderDetail();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /join this league/i }));

    expect(await screen.findByRole("link", { name: /bet from the board/i })).toHaveAttribute(
      "href",
      "/zeroproof",
    );
    expect(joins).toEqual([{}]);
    expect(screen.queryByRole("button", { name: /join this league/i })).toBeNull();
  });

  it("says why a join was refused", async () => {
    serveDetail(detail());
    server.use(
      http.post("/api/zeroproof/leagues/lg-1/join", () =>
        HttpResponse.json({ error: "League is full" }, { status: 409 }),
      ),
    );
    renderDetail();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /join this league/i }));

    expect(await screen.findByText("League is full")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join this league/i })).toBeEnabled();
  });

  it("shows a member their invite code and where their wallet is", async () => {
    serveDetail(detail({ isMember: true, league: league({ joinCode: "ABC234" }) }));
    renderDetail();
    expect(await screen.findByText("ABC234")).toBeInTheDocument();
    expect(screen.getByText(/league wallet is in the bet slip/i)).toBeInTheDocument();
  });

  it("shows a non-member no wallet note", async () => {
    serveDetail(detail());
    renderDetail();
    await screen.findByRole("heading", { name: /friday night parlays/i });
    expect(screen.queryByText(/league wallet is in the bet slip/i)).toBeNull();
    expect(screen.queryByRole("link", { name: /bet from the board/i })).toBeNull();
  });
});

describe("LeagueDetailContent ESPN leagues", () => {
  it("describes each added league by sport, id, season and label", async () => {
    serveDetail(detail({ espnLeagues: [espnLeague({ game: "fba", label: null })] }));
    renderDetail();
    const list = await screen.findByRole("list", { name: /added espn leagues/i });
    expect(list).toHaveTextContent("Basketball \u00b7 836777691 (2026)");
    expect(list).not.toHaveTextContent("\u2014");
  });

  it("shows nothing for a visitor when none are added, but tells the commissioner", async () => {
    serveDetail(detail({ espnLeagues: [] }));
    const visitor = renderDetail();
    await screen.findByRole("heading", { name: /friday night parlays/i });
    expect(screen.queryByRole("heading", { name: "ESPN leagues" })).toBeNull();
    visitor.unmount();

    serveDetail(detail({ espnLeagues: [], isCommissioner: true }));
    renderDetail();
    expect(await screen.findByText("None added yet.")).toBeInTheDocument();
  });

  it("explains an unreachable league, with when it last worked or that it never did", async () => {
    serveDetail(
      detail({
        espnLeagues: [
          espnLeague({ id: "a", leagueId: "111", lastError: "401", lastOkAt: null }),
          espnLeague({ id: "b", leagueId: "222", lastError: "503", lastOkAt: "2026-09-05T00:00:00.000Z" }),
        ],
      }),
    );
    renderDetail();
    const list = await screen.findByRole("list", { name: /added espn leagues/i });
    const [never, before] = within(list).getAllByRole("listitem");
    expect(never).toHaveTextContent("hasn't resolved yet");
    expect(never).not.toHaveTextContent("Last reached");
    expect(before).toHaveTextContent("Last reached");
    expect(before).not.toHaveTextContent("hasn't resolved yet");
  });

  it("says a league has not synced yet when it was never checked", async () => {
    serveDetail(
      detail({
        espnLeagues: [espnLeague({ lastCheckedAt: null, lastOkAt: null, lastError: null })],
      }),
    );
    renderDetail();
    expect(await screen.findByText("Not synced yet.")).toBeInTheDocument();
  });

  it("lets only the commissioner remove one, and removes the one clicked", async () => {
    const deleted: string[] = [];
    let added = [espnLeague({ id: "a", leagueId: "111" }), espnLeague({ id: "b", leagueId: "222" })];
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () =>
        HttpResponse.json(detail({ isCommissioner: true, espnLeagues: added })),
      ),
      http.delete("/api/zeroproof/leagues/lg-1/espn-leagues/:id", ({ params }) => {
        deleted.push(String(params.id));
        added = added.filter((entry) => entry.id !== params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDetail();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /remove .*222/i }));

    await waitFor(() => expect(screen.queryByRole("button", { name: /remove .*222/i })).toBeNull());
    expect(deleted).toEqual(["b"]);
    expect(screen.getByRole("button", { name: /remove .*111/i })).toBeInTheDocument();
  });

  it("shows a visitor no Remove buttons", async () => {
    serveDetail(detail({ espnLeagues: [espnLeague()] }));
    renderDetail();
    await screen.findByRole("list", { name: /added espn leagues/i });
    expect(screen.queryByRole("button", { name: /remove/i })).toBeNull();
  });

  it("sends the chosen sport and trimmed fields, clears the form, and lists the new league", async () => {
    const posted: Record<string, unknown>[] = [];
    let added: ReturnType<typeof espnLeague>[] = [];
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () =>
        HttpResponse.json(detail({ isCommissioner: true, espnLeagues: added })),
      ),
      http.post("/api/zeroproof/leagues/lg-1/espn-leagues", async ({ request }) => {
        posted.push((await request.json()) as Record<string, unknown>);
        added = [espnLeague({ game: "fba", leagueId: "449389534" })];
        return HttpResponse.json({ espnLeague: added[0] }, { status: 201 });
      }),
    );
    renderDetail();
    const user = userEvent.setup();
    await user.selectOptions(await screen.findByLabelText("Sport"), "fba");
    await user.type(screen.getByLabelText(/ESPN league id/i), " 449389534 ");
    await user.type(screen.getByLabelText(/^season$/i), " 2026 ");

    await user.click(screen.getByRole("button", { name: /^add league$/i }));

    await waitFor(() =>
      expect(posted).toEqual([{ game: "fba", leagueId: "449389534", season: "2026" }]),
    );
    expect(
      await screen.findByRole("list", { name: /added espn leagues/i }),
    ).toHaveTextContent("449389534");
    expect(screen.getByLabelText(/ESPN league id/i)).toHaveValue("");
  });

  it("shows the server's reason when adding fails", async () => {
    server.use(
      http.get("/api/zeroproof/leagues/lg-1", () =>
        HttpResponse.json(detail({ isCommissioner: true })),
      ),
      http.post("/api/zeroproof/leagues/lg-1/espn-leagues", () =>
        HttpResponse.json({ error: "ESPN league is private" }, { status: 422 }),
      ),
    );
    renderDetail();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/ESPN league id/i), "836777691");
    await user.type(screen.getByLabelText(/^season$/i), "2026");

    await user.click(screen.getByRole("button", { name: /^add league$/i }));

    expect(await screen.findByText("ESPN league is private")).toBeInTheDocument();
  });
});
