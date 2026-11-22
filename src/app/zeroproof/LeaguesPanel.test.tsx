import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import type { ZeroproofLeague } from "@/lib/zeroproof/schemas";
import LeaguesPanel from "./LeaguesPanel";

/** A league as the backend sends it; override only what a test cares about. */
const leagueOf = (overrides: Partial<ZeroproofLeague> = {}): ZeroproofLeague => ({
  id: "lg-1",
  commissionerSub: "auth0|boss",
  name: "Sunday Sharps",
  joinCode: null,
  visibility: "public",
  startingBankrollCents: 50_000,
  maxMembers: 10,
  winCondition: "threshold",
  thresholdCents: 200_000,
  endsAt: null,
  status: "open",
  winnerSub: null,
  createdAt: "2026-09-01T00:00:00.000Z",
  settledAt: null,
  memberCount: 3,
  ...overrides,
});

/** Signed in, with the given leagues on each list and every write answered. */
function renderSignedIn({
  mine = [] as ZeroproofLeague[],
  discover = [] as ZeroproofLeague[],
} = {}) {
  server.use(
    http.get("/api/me", () =>
      HttpResponse.json({ name: null, email: null, sub: "auth0|me", isFlagAdmin: false }),
    ),
    http.get("/api/zeroproof/leagues/mine", () => HttpResponse.json({ leagues: mine })),
    http.get("/api/zeroproof/leagues", () => HttpResponse.json({ leagues: discover })),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <LeaguesPanel />
    </QueryClientProvider>,
  );
  return client;
}

function renderPanel(
  sub: string | null | "error",
  { mineStatus = 200, discoverStatus = 200 } = {},
) {
  const asked = { mine: 0 };
  server.use(
    http.get("/api/me", () =>
      sub === "error"
        ? new HttpResponse(null, { status: 500 })
        : HttpResponse.json({ name: null, email: null, sub, isFlagAdmin: false }),
    ),
    http.get("/api/zeroproof/leagues/mine", () => {
      asked.mine += 1;
      return mineStatus === 200
        ? HttpResponse.json({ leagues: [] })
        : new HttpResponse(null, { status: mineStatus });
    }),
    http.get("/api/zeroproof/leagues", () =>
      discoverStatus === 200
        ? HttpResponse.json({ leagues: [] })
        : new HttpResponse(null, { status: discoverStatus }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <LeaguesPanel />
    </QueryClientProvider>,
  );
  return asked;
}

/**
 * The same shape #701 fixed for bets: "my leagues" was asked for on every
 * signed-out visit, for an answer that could only be a 401.
 */
describe("LeaguesPanel", () => {
  it("doesn't ask for my leagues when signed out", async () => {
    const asked = renderPanel(null);

    expect(await screen.findByText(/sign in to see your leagues/i)).toBeInTheDocument();
    await screen.findByText(/no public leagues open/i);
    expect(asked.mine).toBe(0);
  });

  it("asks for my leagues when signed in", async () => {
    const asked = renderPanel("auth0|me");

    expect(await screen.findByText(/not in a league yet/i)).toBeInTheDocument();
    expect(asked.mine).toBe(1);
  });

  it("says it couldn't check, rather than asking me to sign in", async () => {
    const asked = renderPanel("error");

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t check/i);
    expect(screen.queryByText(/sign in to see/i)).toBeNull();
    expect(asked.mine).toBe(0);
  });

  it("says my leagues failed to load, rather than that I'm in none", async () => {
    renderPanel("auth0|me", { mineStatus: 500 });

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load your leagues/i);
    expect(screen.queryByText(/not in a league yet/i)).toBeNull();
  });

  it("says public leagues failed to load, rather than that none are open", async () => {
    renderPanel(null, { discoverStatus: 500 });

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load public leagues/i);
    expect(screen.queryByText(/no public leagues open/i)).toBeNull();
  });
});

describe("LeaguesPanel lists", () => {
  it("shows each league with its size, how it is won and the starting bankroll", async () => {
    renderSignedIn({
      mine: [leagueOf({ id: "m1", name: "My League" })],
      discover: [
        leagueOf({
          id: "d1",
          name: "Race to Two Grand",
          memberCount: 4,
          maxMembers: 8,
          startingBankrollCents: 25_000,
          thresholdCents: 200_000,
        }),
      ],
    });

    const mine = await screen.findByRole("link", { name: "My League" });
    expect(mine).toHaveAttribute("href", "/zeroproof/leagues/m1");
    const row = (await screen.findByRole("link", { name: "Race to Two Grand" })).closest("li");
    expect(row).toHaveTextContent("4/8 \u00b7 First to $2,000.00 \u00b7 $250.00 start");
    expect(row).not.toHaveTextContent("settled");
  });

  it("labels a timeline league by its end date and marks a settled one", async () => {
    const endsAt = "2026-12-24T12:00:00.000Z";
    renderSignedIn({
      discover: [
        leagueOf({
          name: "Holiday Cup",
          winCondition: "timeline",
          thresholdCents: null,
          endsAt,
          status: "settled",
        }),
      ],
    });

    const row = (await screen.findByRole("link", { name: "Holiday Cup" })).closest("li");
    expect(row).toHaveTextContent(`Highest by ${new Date(endsAt).toLocaleDateString()}`);
    expect(row).toHaveTextContent("settled");
  });

  it("treats a 401 on my leagues as 'no leagues', not as a failure", async () => {
    server.use(
      http.get("/api/me", () =>
        HttpResponse.json({ name: null, email: null, sub: "auth0|me", isFlagAdmin: false }),
      ),
      http.get("/api/zeroproof/leagues/mine", () => new HttpResponse(null, { status: 401 })),
      http.get("/api/zeroproof/leagues", () => HttpResponse.json({ leagues: [] })),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <LeaguesPanel />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/not in a league yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("LeaguesPanel create form", () => {
  /** Records every POST to create a league and answers with a created league. */
  const recordCreates = (status = 201, error?: string) => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      http.post("/api/zeroproof/leagues", async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return status === 201
          ? HttpResponse.json(leagueOf(), { status })
          : HttpResponse.json({ error }, { status });
      }),
    );
    return bodies;
  };

  const openForm = async () => {
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Create a league" }));
    await user.type(screen.getByLabelText("League name"), "  Friday Fades  ");
    return user;
  };

  it("sends a first-to-target league with dollars converted to cents", async () => {
    const bodies = recordCreates();
    renderSignedIn();
    const user = await openForm();

    await user.click(screen.getByRole("button", { name: "Create league" }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      name: "Friday Fades",
      visibility: "public",
      startingBankrollCents: 50_000,
      maxMembers: 10,
      winCondition: "threshold",
      thresholdCents: 200_000,
    });
  });

  it("rounds fractional dollars to whole cents, not down a cent", async () => {
    const bodies = recordCreates();
    renderSignedIn();
    const user = await openForm();
    const bankroll = screen.getByLabelText("Starting bankroll ($)");
    await user.clear(bankroll);
    await user.type(bankroll, "1.15");

    await user.click(screen.getByRole("button", { name: "Create league" }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    // 1.15 * 100 is 114.99999999999999 in floating point.
    expect(bodies[0].startingBankrollCents).toBe(115);
  });

  it("sends an invite-only timeline league with its end date as an ISO time", async () => {
    const bodies = recordCreates();
    renderSignedIn();
    const user = await openForm();
    await user.click(screen.getByLabelText("Invite only"));
    await user.click(screen.getByLabelText("Highest by a date"));
    // datetime-local carries no zone, so the expected ISO time is built the same way.
    await user.type(screen.getByLabelText("End date"), "2027-01-15T12:00");

    await user.click(screen.getByRole("button", { name: "Create league" }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      name: "Friday Fades",
      visibility: "invite",
      startingBankrollCents: 50_000,
      maxMembers: 10,
      winCondition: "timeline",
      endsAt: new Date("2027-01-15T12:00").toISOString(),
    });
    expect(bodies[0]).not.toHaveProperty("thresholdCents");
  });

  it.each([
    ["Starting bankroll ($)", "abc", "Enter a starting bankroll"],
    ["Starting bankroll ($)", "0", "Enter a starting bankroll"],
    ["Starting bankroll ($)", "-5", "Enter a starting bankroll"],
    ["Target ($)", "", "Enter a target amount"],
    ["Target ($)", "0", "Enter a target amount"],
    ["Max members", "", "Max members must be at least 2"],
    ["Max members", "1", "Max members must be at least 2"],
  ])("refuses %s of %j without calling the server", async (label, value, message) => {
    const bodies = recordCreates();
    renderSignedIn();
    const user = await openForm();
    const field = screen.getByLabelText(label);
    await user.clear(field);
    if (value) await user.type(field, value);

    await user.click(screen.getByRole("button", { name: "Create league" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it("asks the browser to hold back a Max members below 2", async () => {
    renderSignedIn();
    await openForm();
    const maxMembers = screen.getByLabelText("Max members");
    expect(maxMembers).toBeRequired();
    expect(maxMembers).toHaveAttribute("min", "2");
  });

  it("asks for an end date on a timeline league instead of sending none", async () => {
    const bodies = recordCreates();
    renderSignedIn();
    const user = await openForm();
    await user.click(screen.getByLabelText("Highest by a date"));

    await user.click(screen.getByRole("button", { name: "Create league" }));

    expect(await screen.findByText("Pick an end date")).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it("shows the server's reason and keeps the form open when creating fails", async () => {
    recordCreates(409, "A league with that name already exists");
    renderSignedIn();
    const user = await openForm();

    await user.click(screen.getByRole("button", { name: "Create league" }));

    expect(
      await screen.findByText("A league with that name already exists"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("League name")).toHaveValue("  Friday Fades  ");
  });

  it("closes the form and refreshes both lists once the league exists", async () => {
    recordCreates();
    let mineRequests = 0;
    const client = renderSignedIn();
    server.use(
      http.get("/api/zeroproof/leagues/mine", () => {
        mineRequests += 1;
        return HttpResponse.json({ leagues: [] });
      }),
    );
    const user = await openForm();
    await screen.findByText(/not in a league yet/i);
    const before = mineRequests;

    await user.click(screen.getByRole("button", { name: "Create league" }));

    await waitFor(() =>
      expect(screen.queryByLabelText("League name")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(mineRequests).toBeGreaterThan(before));
    expect(client.getQueryCache().findAll().length).toBeGreaterThan(0);
  });
});

describe("LeaguesPanel joining", () => {
  const recordJoins = (status = 200, error?: string) => {
    const joins: { url: string; body: unknown }[] = [];
    server.use(
      http.post("/api/zeroproof/leagues/:id/join", async ({ request, params }) => {
        joins.push({ url: String(params.id), body: await request.json() });
        return status === 200
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ error }, { status });
      }),
    );
    return joins;
  };

  it("joins a public league without a code", async () => {
    const joins = recordJoins();
    renderSignedIn({ discover: [leagueOf({ id: "d1", name: "Open Door" })] });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Join" }));

    await waitFor(() => expect(joins).toEqual([{ url: "d1", body: {} }]));
  });

  it("sends the league's own code when it carries one", async () => {
    const joins = recordJoins();
    renderSignedIn({
      discover: [leagueOf({ id: "d2", name: "Coded", joinCode: "ABC234" })],
    });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Join" }));

    await waitFor(() =>
      expect(joins).toEqual([{ url: "d2", body: { joinCode: "ABC234" } }]),
    );
  });

  it("says why a join was refused, beside the league it was for", async () => {
    recordJoins(409, "League is full");
    renderSignedIn({
      discover: [
        leagueOf({ id: "d1", name: "Full House" }),
        leagueOf({ id: "d2", name: "Other" }),
      ],
    });
    const user = userEvent.setup();
    const [fullHouseJoin] = await screen.findAllByRole("button", { name: "Join" });

    await user.click(fullHouseJoin);

    const row = screen.getByRole("link", { name: "Full House" }).closest("li");
    expect(await within(row as HTMLElement).findByText("League is full")).toBeInTheDocument();
    expect(
      within(screen.getByRole("link", { name: "Other" }).closest("li") as HTMLElement).queryByText(
        "League is full",
      ),
    ).toBeNull();
  });

  it("falls back to a generic message when a refused join says nothing", async () => {
    server.use(
      http.post("/api/zeroproof/leagues/:id/join", () => new HttpResponse(null, { status: 500 })),
    );
    renderSignedIn({ discover: [leagueOf({ id: "d1", name: "Quiet Failure" })] });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Join" }));

    expect(await screen.findByText("Couldn't join (500)")).toBeInTheDocument();
  });

  it("looks a league up by code, trimmed and upper-cased", async () => {
    const codes: (string | null)[] = [];
    renderSignedIn();
    server.use(
      http.get("/api/zeroproof/leagues", ({ request }) => {
        const code = new URL(request.url).searchParams.get("code");
        codes.push(code);
        return HttpResponse.json({
          leagues: code ? [leagueOf({ id: "c1", name: "Found It", joinCode: code })] : [],
        });
      }),
    );
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Join by code"), "  abc234 ");
    await user.click(screen.getByRole("button", { name: "Find" }));

    expect(await screen.findByRole("link", { name: "Found It" })).toBeInTheDocument();
    expect(codes).toContain("ABC234");
  });

  it("says so when no league has that code", async () => {
    renderSignedIn();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Join by code"), "ZZZ999");
    await user.click(screen.getByRole("button", { name: "Find" }));

    expect(await screen.findByText("No league found for that code.")).toBeInTheDocument();
  });
});
