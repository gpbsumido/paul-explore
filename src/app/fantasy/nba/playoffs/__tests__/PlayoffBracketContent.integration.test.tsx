import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse, delay } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import PlayoffBracketContent from "../PlayoffBracketContent";
import type { PlayoffBracket } from "@/types/nba";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

vi.mock("../FantasyNav", () => ({
  default: () => null,
}));

// ---- Factories ----

function makeBracket(): PlayoffBracket {
  return {
    season: 2026,
    matchups: [
      {
        id: "E_R1_M1",
        round: 1,
        conference: "East",
        topTeam: {
          seed: 1,
          teamId: "8",
          abbreviation: "DET",
          name: "Detroit Pistons",
          conference: "East",
        },
        bottomTeam: {
          seed: 8,
          teamId: "20",
          abbreviation: "PHI",
          name: "Philadelphia 76ers",
          conference: "East",
        },
      },
    ],
  };
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function setupDefaultHandlers() {
  server.use(
    http.get("/api/me", () => HttpResponse.json({ sub: "auth0|me" })),
    http.get("/api/nba/playoffs/bracket", () =>
      HttpResponse.json(makeBracket()),
    ),
    http.get("/api/nba/playoffs/picks", () => HttpResponse.json({ picks: {} })),
    http.get("/api/nba/playoffs/leaderboard", () =>
      HttpResponse.json({ entries: [] }),
    ),
    http.put("/api/nba/playoffs/picks", () => HttpResponse.json({ ok: true })),
  );
}

// ---- Tests ----

describe("PlayoffBracketContent — submit button", () => {
  it("renders a Submit Bracket button once the bracket loads", async () => {
    setupDefaultHandlers();

    render(<PlayoffBracketContent />, { wrapper: makeWrapper() });

    expect(
      await screen.findByRole("button", { name: /submit bracket/i }),
    ).toBeInTheDocument();
  });

  it("sends the picks that were made when submit is clicked", async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    setupDefaultHandlers();
    server.use(
      http.put("/api/nba/playoffs/picks", async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ ok: true });
      }),
    );

    render(<PlayoffBracketContent />, { wrapper: makeWrapper() });

    await user.click(await screen.findByRole("button", { name: /DET/ }));
    await user.click(screen.getByRole("button", { name: /submit bracket/i }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({
      picks: { E_R1_M1: { winner: "DET" } },
    });
  });

  it("shows submitting state while PUT is in flight", async () => {
    const user = userEvent.setup();

    setupDefaultHandlers();
    server.use(
      http.put("/api/nba/playoffs/picks", async () => {
        await delay("infinite");
        return HttpResponse.json({ ok: true });
      }),
    );

    render(<PlayoffBracketContent />, { wrapper: makeWrapper() });

    await screen.findByRole("button", { name: /submit bracket/i });
    await user.click(screen.getByRole("button", { name: /submit bracket/i }));

    expect(
      await screen.findByRole("button", { name: /submitting/i }),
    ).toBeDisabled();
  });

  it("shows submitted state after a successful PUT", async () => {
    const user = userEvent.setup();

    setupDefaultHandlers();

    render(<PlayoffBracketContent />, { wrapper: makeWrapper() });

    await screen.findByRole("button", { name: /submit bracket/i });
    await user.click(screen.getByRole("button", { name: /submit bracket/i }));

    expect(
      await screen.findByRole("button", { name: /submitted!/i }),
    ).toBeInTheDocument();
  });

  it("clears a pending saving indicator when submit succeeds", async () => {
    const user = userEvent.setup();

    setupDefaultHandlers();

    render(<PlayoffBracketContent />, { wrapper: makeWrapper() });

    // Auto-save marks the pick as saving straight away. Turning it back off
    // before the debounce fires leaves "Saving…" up with nothing to resolve
    // it, which is exactly the state a manual submit has to clean up.
    await user.click(await screen.findByRole("checkbox", { name: /auto-save/i }));
    await user.click(screen.getByRole("button", { name: /DET/ }));
    expect(await screen.findByText("Saving…")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /auto-save/i }));

    await user.click(screen.getByRole("button", { name: /submit bracket/i }));

    await screen.findByRole("button", { name: "Submitted!" });
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("disables the submit button when auto-save is checked", async () => {
    const user = userEvent.setup();

    setupDefaultHandlers();

    render(<PlayoffBracketContent />, { wrapper: makeWrapper() });

    const submitBtn = await screen.findByRole("button", {
      name: /submit bracket/i,
    });
    expect(submitBtn).not.toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /auto-save/i }));

    expect(submitBtn).toBeDisabled();
  });
});

describe("PlayoffBracketContent — failed saves", () => {
  it("says an auto-save failed instead of sitting on Saving…", async () => {
    const user = userEvent.setup();
    setupDefaultHandlers();
    server.use(
      http.put("/api/nba/playoffs/picks", () =>
        HttpResponse.json({ error: "nope" }, { status: 500 }),
      ),
    );

    render(<PlayoffBracketContent />, { wrapper: makeWrapper() });

    await user.click(
      await screen.findByRole("checkbox", { name: /auto-save/i }),
    );
    await user.click(screen.getByRole("button", { name: /DET/ }));

    expect(
      await screen.findByText(/couldn.t save/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("says a submit failed and lets it be tried again", async () => {
    const user = userEvent.setup();
    setupDefaultHandlers();
    server.use(
      http.put("/api/nba/playoffs/picks", () =>
        HttpResponse.json({ error: "nope" }, { status: 500 }),
      ),
    );

    render(<PlayoffBracketContent />, { wrapper: makeWrapper() });

    await user.click(
      await screen.findByRole("button", { name: /submit bracket/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn.t submit/i,
    );
    expect(
      screen.getByRole("button", { name: /submit bracket/i }),
    ).toBeEnabled();
  });
});

describe("PlayoffBracketContent — signed out", () => {
  it("doesn't ask for picks without a session", async () => {
    setupDefaultHandlers();
    let pickReads = 0;
    server.use(
      http.get("/api/me", () =>
        HttpResponse.json({ name: null, email: null, sub: null, isFlagAdmin: false }),
      ),
      http.get("/api/nba/playoffs/picks", () => {
        pickReads += 1;
        return HttpResponse.json({ picks: {} });
      }),
    );

    render(<PlayoffBracketContent />, { wrapper: makeWrapper() });

    await screen.findByText(/Detroit Pistons|DET/);
    expect(pickReads).toBe(0);
  });
});
