import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CardLabContent from "./CardLabContent";
import type { GeneratedCard } from "@/lib/fantasy-cards";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ usePathname: () => "/fantasy/nba/cards" }));

const card = (o: Partial<GeneratedCard> = {}): GeneratedCard => ({
  id: "nba-1-2026-04-17",
  playerId: 1,
  playerName: "Test Player",
  points: 20,
  periodId: "2026-04-17",
  sport: "nba",
  rarity: "common",
  title: "Test Player · 20 PTS",
  subtitle: "Apr 17 vs PHX",
  imageUrl: "https://a.espncdn.com/i/headshots/nba/players/full/1.png",
  opponent: "PHX",
  home: true,
  boosts: [],
  ...o,
});

const base = { sport: "nba" as const, mode: "nightly" as const, season: "2026", date: "2026-04-17" };

describe("CardLabContent", () => {
  it("renders one card per performance, each with an accessible player image", () => {
    render(
      <CardLabContent
        {...base}
        cards={[
          card({ playerId: 1, playerName: "Victor Wembanyama", title: "Victor Wembanyama · 50 PTS", rarity: "sir" }),
          card({ playerId: 2, playerName: "Bench Guy", title: "Bench Guy · 2 PTS" }),
        ]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("img", { name: /Victor Wembanyama/ })).toBeInTheDocument();
  });

  it("shows the opponent and date on a nightly card", () => {
    render(<CardLabContent {...base} cards={[card({ subtitle: "Apr 17 vs PHX" })]} />);
    expect(screen.getByText("Apr 17 vs PHX")).toBeInTheDocument();
  });

  it("shows boost badges on a card that earned them", () => {
    render(
      <CardLabContent
        {...base}
        cards={[card({ boosts: ["Won", "Playoffs", "Team Paul"] })]}
      />,
    );
    const article = screen.getByRole("article");
    expect(within(article).getByText("Won")).toBeInTheDocument();
    expect(within(article).getByText("Playoffs")).toBeInTheDocument();
    expect(within(article).getByText("Team Paul")).toBeInTheDocument();
  });

  it("offers a sport toggle linking to NBA and WNBA", () => {
    render(<CardLabContent {...base} cards={[card()]} />);
    const wnba = screen.getByRole("link", { name: /WNBA/i });
    expect(wnba.getAttribute("href")).toContain("sport=wnba");
  });

  it("shows an empty state when no cards were generated", () => {
    render(<CardLabContent {...base} cards={[]} />);
    expect(screen.getByText(/no games/i)).toBeInTheDocument();
  });

  it("shows an error state when the data couldn't be reached", () => {
    render(<CardLabContent {...base} cards={[]} error />);
    expect(screen.getByText(/couldn.t reach/i)).toBeInTheDocument();
  });

  it("filters the grid to a rarity when its pill is pressed", async () => {
    render(
      <CardLabContent
        {...base}
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
