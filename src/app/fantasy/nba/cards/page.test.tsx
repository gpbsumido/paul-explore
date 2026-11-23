import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import type { GeneratedCard } from "@/lib/fantasy-cards";

vi.mock("@/lib/espn-nightly", () => ({ loadNightlySlate: vi.fn() }));
vi.mock("@/lib/espn-nfl", () => ({ loadNflWeek: vi.fn(), loadNflSeason: vi.fn() }));
vi.mock("@/lib/card-lab-pool", () => ({
  CARD_LAB_DEFAULT_SEASON: "2025",
  loadNbaSeasonCards: vi.fn(),
}));
vi.mock("./CardLabContent", () => ({ default: () => null }));

import { loadNightlySlate } from "@/lib/espn-nightly";
import { loadNbaSeasonCards } from "@/lib/card-lab-pool";
import CardLabPage from "./page";

const seasonCard: GeneratedCard = {
  id: "nba-10-2025",
  playerId: 10,
  playerName: "Jayson Tatum",
  points: 2100,
  periodId: "2025",
  sport: "nba",
  rarity: "rare",
  title: "Jayson Tatum · 2100 PTS",
  subtitle: "2025 season",
  imageUrl: "https://a.espncdn.com/i/headshots/nba/players/full/10.png",
  boosts: [],
};

type ShownProps = { cards: GeneratedCard[]; mode: string; error: boolean };

/** The props the page hands CardLabContent for a given query string. */
async function shown(params: Record<string, string> = {}): Promise<ShownProps> {
  const element = (await CardLabPage({ searchParams: Promise.resolve(params) })) as ReactElement<ShownProps>;
  return element.props;
}

beforeEach(() => {
  vi.mocked(loadNightlySlate).mockReset();
  vi.mocked(loadNbaSeasonCards).mockReset();
  vi.mocked(loadNbaSeasonCards).mockResolvedValue({ cards: [seasonCard], error: false });
});

describe("the NBA default view", () => {
  it("falls back to season cards when there's no night to show", async () => {
    vi.mocked(loadNightlySlate).mockResolvedValue({ cards: [], date: null, error: false });

    expect(await shown()).toMatchObject({ mode: "season", cards: [seasonCard], error: false });
  });

  // The season cards come from the league read, not the scoreboard, so an ESPN
  // scoreboard outage shouldn't leave the landing view with nothing on it.
  it("falls back to season cards when the nightly scoreboard can't be read", async () => {
    vi.mocked(loadNightlySlate).mockResolvedValue({ cards: [], date: null, error: true });

    expect(await shown()).toMatchObject({ mode: "season", cards: [seasonCard], error: false });
  });

  it("shows the error when the season cards can't be read either", async () => {
    vi.mocked(loadNightlySlate).mockResolvedValue({ cards: [], date: null, error: true });
    vi.mocked(loadNbaSeasonCards).mockResolvedValue({ cards: [], error: true });

    expect(await shown()).toMatchObject({ cards: [], error: true });
  });

  it("shows the error, not season cards, when a night was asked for", async () => {
    vi.mocked(loadNightlySlate).mockResolvedValue({ cards: [], date: "2026-04-20", error: true });

    expect(await shown({ date: "2026-04-20" })).toMatchObject({ mode: "nightly", error: true });
    expect(loadNbaSeasonCards).not.toHaveBeenCalled();
  });

  it("shows the error, not season cards, on the Nightly tab", async () => {
    vi.mocked(loadNightlySlate).mockResolvedValue({ cards: [], date: null, error: true });

    expect(await shown({ mode: "nightly" })).toMatchObject({ mode: "nightly", error: true });
    expect(loadNbaSeasonCards).not.toHaveBeenCalled();
  });
});
