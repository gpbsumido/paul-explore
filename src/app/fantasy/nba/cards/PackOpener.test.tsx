import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PackOpener from "./PackOpener";
import type { GeneratedCard } from "@/lib/fantasy-cards";

const card = (o: Partial<GeneratedCard> = {}): GeneratedCard => ({
  id: "nba-1-2026-04-17",
  playerId: 1,
  playerName: "Victor Wembanyama",
  points: 41,
  periodId: "2026-04-17",
  sport: "nba",
  rarity: "sir",
  title: "Victor Wembanyama · 41 PTS",
  subtitle: "Apr 17 vs PHX",
  imageUrl: "https://a.espncdn.com/i/headshots/nba/players/full/1.png",
  boosts: [],
  ...o,
});

/** Emulate prefers-reduced-motion: reduce for a test. */
function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("PackOpener", () => {
  it("is a labelled modal dialog", () => {
    render(<PackOpener cards={[card()]} onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: /opening a pack/i })).toHaveAttribute("aria-modal", "true");
  });

  it("goes straight to the reveal under reduced motion, showing each card", () => {
    stubReducedMotion(true);
    render(
      <PackOpener
        cards={[card({ playerId: 1, playerName: "Wemby" }), card({ id: "nba-2", playerId: 2, playerName: "Chet" })]}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("You pulled")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Wemby/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Chet/ })).toBeInTheDocument();
  });

  it("clicks through pick a pack → rip → reveal", async () => {
    stubReducedMotion(false);
    render(<PackOpener cards={[card()]} onClose={() => {}} />);
    expect(screen.getByText("Pick a pack")).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: /open the .* pack/i })[0]);
    await userEvent.click(screen.getByRole("button", { name: /^Rip open$/i }));

    expect(screen.getByText("You pulled")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Wembanyama/ })).toBeInTheDocument();
  });

  it("closes on the Close button and on Escape", async () => {
    const onClose = vi.fn();
    render(<PackOpener cards={[card()]} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /^Close$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
