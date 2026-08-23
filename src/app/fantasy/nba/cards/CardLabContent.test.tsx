import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CardLabContent from "./CardLabContent";
import type { GeneratedCard } from "@/lib/fantasy-cards";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ usePathname: () => "/fantasy/nba/cards" }));

const card = (o: Partial<GeneratedCard> = {}): GeneratedCard => ({
  id: "nba-1-2024-season",
  playerId: 1,
  playerName: "Test Player",
  points: 20,
  periodId: "2024-season",
  sport: "nba",
  rarity: "common",
  title: "Test Player · 20 PTS",
  subtitle: "2024-season",
  imageUrl: "https://a.espncdn.com/i/headshots/nba/players/full/1.png",
  ...o,
});

describe("CardLabContent", () => {
  it("renders one card per performance, each with an accessible player image", () => {
    render(
      <CardLabContent
        season="2024"
        cards={[
          card({
            playerId: 1,
            playerName: "Victor Wembanyama",
            title: "Victor Wembanyama · 50 PTS",
            rarity: "sir",
          }),
          card({ playerId: 2, playerName: "Bench Guy", title: "Bench Guy · 2 PTS" }),
        ]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByRole("img", { name: /Victor Wembanyama/ }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when no cards were generated", () => {
    render(<CardLabContent season="2024" cards={[]} />);
    expect(screen.getByText(/no performances/i)).toBeInTheDocument();
  });

  it("shows an error state when the league couldn't be reached", () => {
    render(<CardLabContent season="2024" cards={[]} error />);
    expect(screen.getByText(/couldn.t reach/i)).toBeInTheDocument();
  });

  it("filters the grid to a rarity when its pill is pressed", async () => {
    render(
      <CardLabContent
        season="2024"
        cards={[
          card({ playerId: 1, playerName: "Star", rarity: "sir", title: "Star · 50 PTS" }),
          card({ playerId: 2, playerName: "Role", rarity: "common", title: "Role · 5 PTS" }),
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /SIR/i }));
    expect(screen.getByRole("img", { name: /Star/ })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Role/ })).not.toBeInTheDocument();
  });
});
