import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
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

  it("shows no owned-count for a single copy or when no count is given", () => {
    const base = {
      playerName: "Star",
      points: 30,
      rarity: "rare" as const,
      subtitle: "2025 season",
      imageUrl: "x",
    };
    const { rerender } = render(<FantasyCard card={{ ...base, count: 1 }} />);
    expect(screen.queryByText("×1")).not.toBeInTheDocument();
    expect(screen.getByRole("article")).not.toHaveAccessibleName(/copies/);

    rerender(<FantasyCard card={base} />);
    expect(screen.queryByText(/^×/)).not.toBeInTheDocument();
  });

  it("rounds fractional points to the whole figure shown on the card", () => {
    render(
      <FantasyCard
        card={{ playerName: "Star", points: 40.6, rarity: "rare", subtitle: "s", imageUrl: "x" }}
      />,
    );
    const article = screen.getByRole("article");
    expect(within(article).getByText("41")).toBeInTheDocument();
    expect(article).toHaveAccessibleName(/41 points/);
  });

  it("falls back to the player's initials when the headshot fails to load", () => {
    render(
      <FantasyCard
        card={{ playerName: "Nikola Jokic", points: 52, rarity: "rare", subtitle: "s", imageUrl: "https://example.test/missing.png" }}
      />,
    );
    fireEvent.error(screen.getByRole("img", { name: /Nikola Jokic/ }));
    expect(screen.queryByRole("img", { name: /Nikola Jokic/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole("article")).getByText("NJ")).toBeInTheDocument();
  });

  it("lists the boosts a card earned, and none when it earned none", () => {
    const base = { playerName: "Star", points: 30, rarity: "rare" as const, subtitle: "s", imageUrl: "x" };
    const { rerender } = render(<FantasyCard card={{ ...base, boosts: ["Won", "Playoffs"] }} />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["Won", "Playoffs"]);

    rerender(<FantasyCard card={{ ...base, boosts: [] }} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("titles the card with an h2, since the card grids sit straight under the page's h1", () => {
    render(
      <FantasyCard
        card={{ playerName: "Nikola Jokic", points: 52, rarity: "rare", subtitle: "Apr 17 vs LAL", imageUrl: "https://a.espncdn.com/i/headshots/nba/players/full/3112335.png" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Nikola Jokic" })).toBeInTheDocument();
  });
});

