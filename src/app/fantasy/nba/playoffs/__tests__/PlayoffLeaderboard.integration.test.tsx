import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse, delay } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import PlayoffLeaderboard from "../PlayoffLeaderboard";
import { LEADERBOARD_ROW_STATES } from "../leaderboardRowStates";
import type { LeaderboardEntry, PlayoffLeaderboardResponse } from "@/types/nba";

// ---- Factories ----

function makeEntry(
  overrides: Partial<LeaderboardEntry> = {},
): LeaderboardEntry {
  return {
    rank: 1,
    sub: "auth0|user1",
    bracketId: "00000000-0000-0000-0000-000000000001",
    username: "paul",
    displayName: "Paul",
    score: 24,
    maxScore: 52,
    roundBreakdown: [
      { label: "R1", earned: 6, max: 8 },
      { label: "R2", earned: 4, max: 8 },
      { label: "CF", earned: 2, max: 4 },
      { label: "Finals", earned: 0, max: 4 },
    ],
    ...overrides,
  };
}

function makeResponse(entries: LeaderboardEntry[]): PlayoffLeaderboardResponse {
  return { entries };
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// ---- Tests ----

describe("PlayoffLeaderboard", () => {
  it("renders ranked rows with name, score, and round breakdown", async () => {
    server.use(
      http.get("/api/nba/playoffs/leaderboard", () =>
        HttpResponse.json(
          makeResponse([
            makeEntry({
              rank: 1,
              sub: "auth0|u1",
              displayName: "Paul",
              score: 24,
            }),
            makeEntry({
              rank: 2,
              sub: "auth0|u2",
              displayName: "John",
              score: 20,
            }),
            makeEntry({
              rank: 3,
              sub: "auth0|u3",
              displayName: "Ana",
              score: 18,
            }),
            makeEntry({
              rank: 4,
              sub: "auth0|u4",
              displayName: "Lee",
              score: 15,
            }),
          ]),
        ),
      ),
    );

    render(<PlayoffLeaderboard currentUserSub={null} />, {
      wrapper: makeWrapper(),
    });

    expect(await screen.findByText("Paul")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Lee")).toBeInTheDocument();

    // Medal emojis for top 3
    expect(screen.getByText("🥇")).toBeInTheDocument();
    expect(screen.getByText("🥈")).toBeInTheDocument();
    expect(screen.getByText("🥉")).toBeInTheDocument();

    // Rank 4 shown as a number, not a medal
    expect(screen.getByText("4")).toBeInTheDocument();

    // Score chip
    expect(screen.getAllByText("24 / 52 pts")[0]).toBeInTheDocument();

    // Round breakdown badges visible
    expect(screen.getAllByText("R1 6/8")[0]).toBeInTheDocument();
  });

  it("highlights the current user's row", async () => {
    server.use(
      http.get("/api/nba/playoffs/leaderboard", () =>
        HttpResponse.json(
          makeResponse([
            makeEntry({ rank: 1, sub: "auth0|me", displayName: "Me" }),
            makeEntry({ rank: 2, sub: "auth0|other", displayName: "Other" }),
          ]),
        ),
      ),
    );

    render(<PlayoffLeaderboard currentUserSub="auth0|me" />, {
      wrapper: makeWrapper(),
    });

    await screen.findByText("Me");

    const rows = screen.getAllByRole("row");
    const myRow = rows.find((r) => within(r).queryByText("Me"));
    const otherRow = rows.find((r) => within(r).queryByText("Other"));

    expect(myRow).toHaveAttribute("data-current-user", "true");
    expect(otherRow).not.toHaveAttribute("data-current-user");
  });

  it("shows empty state message when entries array is empty", async () => {
    server.use(
      http.get("/api/nba/playoffs/leaderboard", () =>
        HttpResponse.json(makeResponse([])),
      ),
    );

    render(<PlayoffLeaderboard currentUserSub={null} />, {
      wrapper: makeWrapper(),
    });

    expect(
      await screen.findByText("No brackets submitted yet."),
    ).toBeInTheDocument();
  });

  it("shows skeleton while loading", async () => {
    server.use(
      http.get("/api/nba/playoffs/leaderboard", async () => {
        await delay("infinite");
        return HttpResponse.json(makeResponse([]));
      }),
    );

    render(<PlayoffLeaderboard currentUserSub={null} />, {
      wrapper: makeWrapper(),
    });

    expect(screen.getByTestId("leaderboard-skeleton")).toBeInTheDocument();
  });

  it("says so, rather than showing an empty table, when the leaderboard can't be loaded", async () => {
    server.use(
      http.get("/api/nba/playoffs/leaderboard", () =>
        HttpResponse.json({ error: "nope" }, { status: 500 }),
      ),
    );

    render(<PlayoffLeaderboard currentUserSub={null} />, {
      wrapper: makeWrapper(),
    });

    expect(await screen.findByText(/leaderboard/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("No brackets submitted yet.")).not.toBeInTheDocument();
  });

  it("links each row to that bracket, by username and otherwise by bracket id", async () => {
    server.use(
      http.get("/api/nba/playoffs/leaderboard", () =>
        HttpResponse.json(
          makeResponse([
            makeEntry({ rank: 1, sub: "auth0|u1", displayName: "Paul", username: "paul s" }),
            makeEntry({
              rank: 2,
              sub: "auth0|u2",
              displayName: "Anon",
              username: null,
              bracketId: "00000000-0000-0000-0000-0000000000aa",
            }),
          ]),
        ),
      ),
    );

    render(<PlayoffLeaderboard currentUserSub={null} />, {
      wrapper: makeWrapper(),
    });

    await screen.findByText("Paul");
    expect(screen.getByRole("link", { name: "View Paul's bracket" })).toHaveAttribute(
      "href",
      "/fantasy/nba/playoffs?view=paul%20s",
    );
    expect(screen.getByRole("link", { name: "View Anon's bracket" })).toHaveAttribute(
      "href",
      "/fantasy/nba/playoffs?view=00000000-0000-0000-0000-0000000000aa",
    );
  });

  it("styles the bracket being viewed differently from the signed-in user's own row", async () => {
    server.use(
      http.get("/api/nba/playoffs/leaderboard", () =>
        HttpResponse.json(
          makeResponse([
            makeEntry({ rank: 1, sub: "auth0|me", displayName: "Me", username: "me" }),
            makeEntry({ rank: 2, sub: "auth0|v", displayName: "Viewed", username: "viewed" }),
            makeEntry({ rank: 3, sub: "auth0|o", displayName: "Other", username: "other" }),
          ]),
        ),
      ),
    );

    render(<PlayoffLeaderboard currentUserSub="auth0|me" viewSub="viewed" />, {
      wrapper: makeWrapper(),
    });

    await screen.findByText("Me");
    const rowOf = (name: string) =>
      screen.getAllByRole("row").find((r) => within(r).queryByText(name)) as HTMLElement;
    const [currentUserTint] = LEADERBOARD_ROW_STATES.currentUser.row.split(" ");
    const [viewedTint] = LEADERBOARD_ROW_STATES.viewedUser.row.split(" ");

    expect(rowOf("Me")).toHaveClass(currentUserTint);
    expect(rowOf("Me")).not.toHaveClass(viewedTint);
    expect(rowOf("Viewed")).toHaveClass(viewedTint);
    expect(rowOf("Viewed")).not.toHaveClass(currentUserTint);
    expect(rowOf("Other")).not.toHaveClass(currentUserTint, viewedTint);
  });
});
