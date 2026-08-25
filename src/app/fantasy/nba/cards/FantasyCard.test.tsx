import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import FantasyCard from "./FantasyCard";

// Reduced motion makes the count-up points render their final value at once,
// the same way AnimatedNumber's own test pins it, so the figure is assertable.
vi.mock("@/app/providers", () => ({ useHubReducedMotion: () => true }));

describe("FantasyCard", () => {
  it("spells out the rarity, shows the points, and the player image", () => {
    render(
      <FantasyCard
        card={{
          playerName: "Victor Wembanyama",
          points: 41,
          rarity: "sir",
          subtitle: "Apr 17 vs PHX",
          imageUrl: "https://a.espncdn.com/i/headshots/nba/players/full/1.png",
        }}
      />,
    );
    const article = screen.getByRole("article");
    // Rarity is spelled out (not colour-only) and the points are up front.
    expect(within(article).getByText("SIR")).toBeInTheDocument();
    expect(within(article).getByText("41")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Victor Wembanyama/ })).toBeInTheDocument();
  });

  it("shows an owned-count when more than one copy", () => {
    render(
      <FantasyCard
        card={{
          playerName: "Star",
          points: 30,
          rarity: "rare",
          subtitle: "2025 season",
          imageUrl: "x",
          count: 4,
        }}
      />,
    );
    expect(screen.getByText("×4")).toBeInTheDocument();
  });
});
