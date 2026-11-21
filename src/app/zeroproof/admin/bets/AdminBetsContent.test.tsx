import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";
import { playerHandle } from "@/lib/zeroproof/format";
import AdminBetsContent from "./AdminBetsContent";

const bet = (overrides: Record<string, unknown> = {}) => ({
  id: "bet-1",
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
  userSub: "auth0|greg",
  email: "greg@example.com",
  handle: "Greg the Sharp",
  mode: "season",
  home: "Celtics",
  away: "Heat",
  sport: "basketball_nba",
  ...overrides,
});

/** Serves a fixed list of bets from the admin endpoint. */
const serveBets = (bets: Record<string, unknown>[]) =>
  server.use(
    http.get("/api/zeroproof/admin/bets", () => HttpResponse.json({ bets })),
  );

/** The cells of the table row that contains the given text. */
const rowCells = (table: HTMLElement, text: string) => {
  const row = within(table)
    .getAllByRole("row")
    .find((candidate) => candidate.textContent?.includes(text));
  if (!row) throw new Error(`no row containing ${text}`);
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
};

const renderAdmin = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <AdminBetsContent />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

afterEach(() => server.resetHandlers());

describe("AdminBetsContent", () => {
  it("lists everyone's bets with who placed them", async () => {
    server.use(
      http.get("/api/zeroproof/admin/bets", () =>
        HttpResponse.json({
          bets: [
            bet(),
            bet({
              id: "bet-2",
              userSub: "auth0|sam",
              handle: "Sam",
              email: "sam@example.com",
              selection: "Yankees",
              status: "lost",
            }),
          ],
        }),
      ),
    );
    renderAdmin();
    const table = await screen.findByRole("table", { name: /all bets/i });
    expect(table).toHaveTextContent("Greg the Sharp");
    expect(table).toHaveTextContent("Celtics");
    expect(table).toHaveTextContent("Sam");
    expect(table).toHaveTextContent("Yankees");
  });

  it("names the matchup for each bet, not just the selection", async () => {
    server.use(
      http.get("/api/zeroproof/admin/bets", () =>
        HttpResponse.json({
          bets: [bet({ selection: "Over", market: "total", lineValue: 210.5 })],
        }),
      ),
    );
    renderAdmin();
    const table = await screen.findByRole("table", { name: /all bets/i });
    // The god's view names who's playing, so a totals bet isn't a mystery matchup.
    expect(table).toHaveTextContent("Heat @ Celtics");
  });

  it("summarises each player's win-loss-push record and live count", async () => {
    server.use(
      http.get("/api/zeroproof/admin/bets", () =>
        HttpResponse.json({
          bets: [
            bet({ id: "a", status: "won" }),
            bet({ id: "b", status: "lost", settledAt: "2026-09-03T00:00:00.000Z" }),
            bet({ id: "c", status: "open", settledAt: null }),
          ],
        }),
      ),
    );
    renderAdmin();
    const records = await screen.findByRole("table", { name: /player records/i });
    expect(records).toHaveTextContent("Greg the Sharp");
    // one win, one loss, no pushes
    expect(records).toHaveTextContent("1-1-0");
  });

  it("counts each player's wins, losses, pushes, total and live bets, busiest player first", async () => {
    serveBets([
      bet({ id: "a", status: "won" }),
      bet({ id: "b", status: "won" }),
      bet({ id: "c", status: "lost" }),
      bet({ id: "d", status: "push" }),
      bet({ id: "e", status: "open", settledAt: null }),
      bet({ id: "f", status: "open", settledAt: null }),
      bet({ id: "g", userSub: "auth0|sam", handle: "Sam", email: "sam@example.com", status: "lost" }),
    ]);
    renderAdmin();

    const records = await screen.findByRole("table", { name: /player records/i });

    expect(rowCells(records, "Greg the Sharp")).toEqual([
      "Greg the Sharpgreg@example.com",
      "2-1-1",
      "6",
      "2",
    ]);
    expect(rowCells(records, "Sam")).toEqual(["Samsam@example.com", "0-1-0", "1", "0"]);
    const [firstPlayer] = within(records).getAllByRole("row").slice(1);
    expect(firstPlayer).toHaveTextContent("Greg the Sharp");
  });

  it("names a bettor by handle, then email, then an anonymous handle", async () => {
    serveBets([
      bet({ id: "a", userSub: "auth0|one", handle: "Handle One", email: "one@example.com" }),
      bet({ id: "b", userSub: "auth0|two", handle: null, email: "two@example.com" }),
      bet({ id: "c", userSub: "auth0|three", handle: null, email: null }),
    ]);
    renderAdmin();

    const records = await screen.findByRole("table", { name: /player records/i });

    expect(rowCells(records, "Handle One")[0]).toBe("Handle Oneone@example.com");
    // The email is the name here, so it is not printed a second time.
    expect(rowCells(records, "two@example.com")[0]).toBe("two@example.com");
    expect(rowCells(records, playerHandle("auth0|three"))[0]).toBe(
      playerHandle("auth0|three"),
    );
  });

  it("shows odds with a sign, the stake in dollars, and a dash for a bet not yet settled", async () => {
    serveBets([
      bet({ id: "o", status: "open", settledAt: null, oddsAmerican: 150, stakeCents: 1050 }),
    ]);
    renderAdmin();

    const table = await screen.findByRole("table", { name: /all bets/i });
    const cells = rowCells(table, "Greg the Sharp");

    expect(cells[4]).toBe("+150");
    expect(cells[5]).toBe("$10.50");
    expect(cells[7]).toBe("open");
    expect(cells[9]).toBe("\u2014");
  });

  it("filters the bets to resolved only, leaving live ones out", async () => {
    serveBets([
      bet({ id: "done", selection: "Celtics", status: "won", home: "Bulls", away: "Knicks" }),
      bet({ id: "live", selection: "Lakers", status: "open", settledAt: null, home: "Suns", away: "Kings" }),
    ]);
    renderAdmin();
    await screen.findByRole("table", { name: /all bets/i });

    fireEvent.click(screen.getByRole("button", { name: /^resolved$/i }));

    const table = screen.getByRole("table", { name: /all bets/i });
    expect(table).toHaveTextContent("Celtics");
    expect(table).not.toHaveTextContent("Lakers");
  });

  it("says no bets match when the chosen view is empty", async () => {
    serveBets([bet({ id: "done", status: "won" })]);
    renderAdmin();
    await screen.findByRole("table", { name: /all bets/i });

    fireEvent.click(screen.getByRole("button", { name: /^live$/i }));

    expect(screen.getByText("No bets match this view yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: /all bets/i })).toBeNull();
  });

  it("filters the bets to live only", async () => {
    server.use(
      http.get("/api/zeroproof/admin/bets", () =>
        HttpResponse.json({
          bets: [
            bet({ id: "resolved", selection: "Celtics", status: "won", home: "Bulls", away: "Knicks" }),
            bet({ id: "live", selection: "Lakers", status: "open", settledAt: null, home: "Suns", away: "Kings" }),
          ],
        }),
      ),
    );
    renderAdmin();
    await screen.findByRole("table", { name: /all bets/i });
    fireEvent.click(screen.getByRole("button", { name: /^live$/i }));
    const table = screen.getByRole("table", { name: /all bets/i });
    expect(table).toHaveTextContent("Lakers");
    expect(table).not.toHaveTextContent("Celtics");
  });

  it("searches server-side by the entered term", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/zeroproof/admin/bets", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ bets: [bet()] });
      }),
    );
    renderAdmin();
    await screen.findByRole("table", { name: /all bets/i });
    fireEvent.change(screen.getByLabelText(/search/i), { target: { value: "greg" } });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
    await waitFor(() => expect(capturedUrl).toContain("q=greg"));
  });

  it("sends the search trimmed and URL-encoded", async () => {
    const searched: (string | null)[] = [];
    server.use(
      http.get("/api/zeroproof/admin/bets", ({ request }) => {
        searched.push(new URL(request.url).searchParams.get("q"));
        return HttpResponse.json({ bets: [bet()] });
      }),
    );
    renderAdmin();
    await screen.findByRole("table", { name: /all bets/i });

    fireEvent.change(screen.getByLabelText(/search/i), { target: { value: "  a&b c " } });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => expect(searched).toContain("a&b c"));
    expect(searched[0]).toBeNull();
  });

  it("says no bets have been placed, or that none match the search", async () => {
    server.use(
      http.get("/api/zeroproof/admin/bets", ({ request }) =>
        HttpResponse.json({
          bets: new URL(request.url).searchParams.has("q") ? [] : [],
        }),
      ),
    );
    renderAdmin();
    expect(await screen.findByText("No bets placed yet.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/search/i), { target: { value: "zzz" } });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    expect(await screen.findByText('No bets match "zzz".')).toBeInTheDocument();
  });

  it("says the list could not be loaded rather than that no bets exist", async () => {
    server.use(
      http.get("/api/zeroproof/admin/bets", () => new HttpResponse(null, { status: 500 })),
    );
    renderAdmin();

    expect(await screen.findByText("Couldn't load bets (500)")).toBeInTheDocument();
    expect(screen.queryByText("No bets placed yet.")).toBeNull();
  });

  it("has no axe violations", async () => {
    server.use(
      http.get("/api/zeroproof/admin/bets", () => HttpResponse.json({ bets: [bet()] })),
    );
    const { container } = renderAdmin();
    await screen.findByRole("table", { name: /all bets/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
