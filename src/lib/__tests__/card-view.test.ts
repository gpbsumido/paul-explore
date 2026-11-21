import { describe, it, expect } from "vitest";
import { RARITY_ORDER, sortCards } from "../card-view";
import type { Rarity } from "../fantasy-cards";

const c = (playerName: string, points: number, rarity: Rarity) => ({ playerName, points, rarity });

describe("sortCards", () => {
  const cards = [
    c("Bench", 8, "common"),
    c("Star", 40, "sir"),
    c("Role", 22, "rare"),
    c("Mid", 40, "uncommon"),
  ];

  it("sorts by points, highest first", () => {
    expect(sortCards(cards, "points").map((x) => x.playerName)).toEqual(["Star", "Mid", "Role", "Bench"]);
  });

  it("sorts by rarity, rarest first, ties broken by points", () => {
    expect(sortCards(cards, "rarity").map((x) => x.playerName)).toEqual(["Star", "Role", "Mid", "Bench"]);
  });

  it("breaks a rarity tie with the higher points first", () => {
    const tied = [c("Low", 10, "rare"), c("High", 30, "rare"), c("Top", 5, "sir")];
    expect(sortCards(tied, "rarity").map((x) => x.playerName)).toEqual(["Top", "High", "Low"]);
  });

  it("agrees with RARITY_ORDER about which rarity is rarest", () => {
    const oneOfEach = [...RARITY_ORDER].reverse().map((rarity) => c(rarity, 1, rarity));
    expect(sortCards(oneOfEach, "rarity").map((x) => x.rarity)).toEqual(RARITY_ORDER);
  });

  it("sorts by name, A to Z", () => {
    expect(sortCards(cards, "name").map((x) => x.playerName)).toEqual(["Bench", "Mid", "Role", "Star"]);
  });

  it("does not mutate the input", () => {
    const input = [c("A", 1, "common"), c("B", 2, "sir")];
    sortCards(input, "points");
    expect(input.map((x) => x.playerName)).toEqual(["A", "B"]);
  });
});
