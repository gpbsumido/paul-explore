import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import LeaguesPanel from "./LeaguesPanel";

function renderPanel(sub: string | null) {
  const asked = { mine: 0 };
  server.use(
    http.get("/api/me", () =>
      HttpResponse.json({ name: null, email: null, sub, isFlagAdmin: false }),
    ),
    http.get("/api/zeroproof/leagues/mine", () => {
      asked.mine += 1;
      return HttpResponse.json({ leagues: [] });
    }),
    http.get("/api/zeroproof/leagues", () => HttpResponse.json({ leagues: [] })),
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
});
