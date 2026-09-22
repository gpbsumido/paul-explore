import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";
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

  it("filters the bets to live only", async () => {
    server.use(
      http.get("/api/zeroproof/admin/bets", () =>
        HttpResponse.json({
          bets: [
            bet({ id: "resolved", selection: "Celtics", status: "won" }),
            bet({ id: "live", selection: "Lakers", status: "open", settledAt: null }),
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

  it("has no axe violations", async () => {
    server.use(
      http.get("/api/zeroproof/admin/bets", () => HttpResponse.json({ bets: [bet()] })),
    );
    const { container } = renderAdmin();
    await screen.findByRole("table", { name: /all bets/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
