import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import ZeroProofContent from "./ZeroProofContent";

const TOUR_KEY = "zeroproof-tour-seen";

function renderLobby(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>{ui}</ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("ZeroProof guided tour", () => {
  beforeEach(() => window.localStorage.clear());

  it("auto-opens the consent step on a first visit and asks before touring", () => {
    renderLobby(<ZeroProofContent />);
    const tour = screen.getByRole("dialog", { name: /tour/i });
    expect(within(tour).getByText(/tour/i)).toBeInTheDocument();
    expect(
      within(tour).getByRole("button", { name: /^next$/i }),
    ).toBeInTheDocument();
    expect(
      within(tour).getByRole("button", { name: /^skip$/i }),
    ).toBeInTheDocument();
  });

  it("does not auto-open once the tour has been seen, but a button reopens it", () => {
    window.localStorage.setItem(TOUR_KEY, "true");
    renderLobby(<ZeroProofContent />);
    expect(screen.queryByRole("dialog", { name: /tour/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /take the tour/i }));
    expect(screen.getByRole("dialog", { name: /tour/i })).toBeInTheDocument();
  });

  it("walks through the steps and switches tabs, then finishes", () => {
    window.localStorage.setItem(TOUR_KEY, "true");
    renderLobby(<ZeroProofContent />);
    fireEvent.click(screen.getByRole("button", { name: /take the tour/i }));

    const tour = () => screen.getByRole("dialog", { name: /tour/i });
    fireEvent.click(
      within(tour()).getByRole("button", { name: /^next$/i }),
    );

    // Intro
    expect(within(tour()).getByText(/loss/i)).toBeInTheDocument();

    // Step onto Leagues — the tour should select that tab
    fireEvent.click(within(tour()).getByRole("button", { name: /next/i })); // board
    fireEvent.click(within(tour()).getByRole("button", { name: /next/i })); // leagues
    expect(
      screen.getByRole("tab", { name: "Leagues" }),
    ).toHaveAttribute("aria-selected", "true");

    // Walk to the last step and finish
    fireEvent.click(within(tour()).getByRole("button", { name: /next/i })); // leaderboard
    fireEvent.click(within(tour()).getByRole("button", { name: /next/i })); // record
    fireEvent.click(within(tour()).getByRole("button", { name: /finish/i }));
    expect(screen.queryByRole("dialog", { name: /tour/i })).toBeNull();
  });

  it("closes immediately when the visitor declines", () => {
    renderLobby(<ZeroProofContent />);
    fireEvent.click(screen.getByRole("button", { name: /^skip$/i }));
    expect(screen.queryByRole("dialog", { name: /tour/i })).toBeNull();
  });
});
