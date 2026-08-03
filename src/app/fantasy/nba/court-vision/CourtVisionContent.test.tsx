import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", preference: "system", setPreference: vi.fn() }),
}));

import CourtVisionContent from "./CourtVisionContent";

function renderWithQuery() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CourtVisionContent />
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.unstubAllGlobals());

describe("Court Vision while teams are loading", () => {
  it("says it is loading rather than offering an empty team list", async () => {
    // The bug this pins: a hung upstream left the selector reading
    // "Select a team…" with nothing in it, which is indistinguishable from a
    // league that has no teams. Loading is not absence.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    renderWithQuery();

    // Both the selector and the main panel say so, which is the point: there is
    // no surface left that reads as "no teams".
    expect((await screen.findAllByText("Loading teams…")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Select a team…")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Team")).toBeDisabled();
  });
});

describe("Court Vision when the teams request fails", () => {
  it("says so and offers a retry instead of an empty selector", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("nope", { status: 504 }))),
    );

    renderWithQuery();

    await waitFor(() =>
      expect(screen.getByText("Failed to load teams")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /retry/i }),
    ).toBeInTheDocument();
  });
});
