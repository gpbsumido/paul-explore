import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import { useNbaPlayers, useNbaTeams } from "@/hooks/useNbaRoster";
import type { Player, Team } from "@/types/nba";

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const team = (overrides: Partial<Team>): Team => ({
  id: 1,
  full_name: "Atlanta Hawks",
  abbreviation: "ATL",
  city: "Atlanta",
  conference: "East",
  division: "Southeast",
  name: "Hawks",
  ...overrides,
});

const player = (overrides: Partial<Player>): Player => ({
  id: 10,
  first_name: "Trae",
  last_name: "Young",
  position: "G",
  ...overrides,
});

/**
 * portfolio_api wraps the two lists differently: teams come back as
 * `{ data: { data: [...] } }` and a roster as `{ data: [...] }`. Both pages
 * guessed with `json.data?.data ?? json.data ?? []`, which also turns any
 * other shape into an empty list instead of an error.
 */
describe("useNbaTeams", () => {
  it("reads the teams out of their paginated wrapper, sorted by name", async () => {
    server.use(
      http.get("/api/nba/teams", () =>
        HttpResponse.json({
          data: {
            data: [team({ id: 2, full_name: "Boston Celtics" }), team({ id: 1 })],
            meta: {},
          },
        }),
      ),
    );
    const { result } = renderHook(() => useNbaTeams(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((t) => t.full_name)).toEqual([
      "Atlanta Hawks",
      "Boston Celtics",
    ]);
  });

  it("fails on a body it doesn't recognise rather than showing no teams", async () => {
    server.use(http.get("/api/nba/teams", () => HttpResponse.json({ teams: [] })));
    const { result } = renderHook(() => useNbaTeams(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("fails with the route's own reason", async () => {
    server.use(
      http.get("/api/nba/teams", () =>
        HttpResponse.json({ error: "Failed to fetch teams" }, { status: 502 }),
      ),
    );
    const { result } = renderHook(() => useNbaTeams(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to fetch teams");
  });
});

describe("useNbaPlayers", () => {
  it("reads a team's roster", async () => {
    server.use(
      http.get("/api/nba/players/:teamId", ({ params }) =>
        HttpResponse.json({
          data: [player({ id: Number(params.teamId) * 100 })],
          meta: {},
        }),
      ),
    );
    const { result } = renderHook(() => useNbaPlayers(7), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((p) => p.id)).toEqual([700]);
  });

  it("fails on a body it doesn't recognise rather than showing an empty roster", async () => {
    server.use(http.get("/api/nba/players/:teamId", () => HttpResponse.json({ players: [] })));
    const { result } = renderHook(() => useNbaPlayers(7), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("waits for a team before asking", () => {
    const { result } = renderHook(() => useNbaPlayers(null), { wrapper: wrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
