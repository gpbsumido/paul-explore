import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Pokemon } from "@/types/graphql";
import PokemonCard from "./PokemonCard";

const pokemon = (overrides: Partial<Pokemon> = {}): Pokemon => ({
  id: 25,
  name: "pikachu",
  pokemon_v2_pokemontypes: [{ pokemon_v2_type: { name: "electric" } }],
  pokemon_v2_pokemonstats: [
    { base_stat: 35, pokemon_v2_stat: { name: "hp" } },
    { base_stat: 55, pokemon_v2_stat: { name: "attack" } },
  ],
  ...overrides,
});

/** The filled part of the bar under a label, as the width it was given. */
const barWidth = (label: string): string => {
  const row = screen.getByText(label).closest("div")!.parentElement!;
  return (row.querySelector("[style]") as HTMLElement).style.width;
};

describe("PokemonCard", () => {
  it("shows the dex number, a readable name, the sprite and every type", () => {
    render(
      <PokemonCard
        pokemon={pokemon({
          id: 3,
          name: "mr-mime",
          pokemon_v2_pokemontypes: [
            { pokemon_v2_type: { name: "psychic" } },
            { pokemon_v2_type: { name: "fairy" } },
          ],
        })}
      />,
    );
    expect(screen.getByText("#003")).toBeInTheDocument();
    expect(screen.getByText("Mr mime")).toBeInTheDocument();
    expect(screen.getByText("psychic")).toBeInTheDocument();
    expect(screen.getByText("fairy")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "mr-mime" })).toHaveAttribute(
      "src",
      expect.stringMatching(/\/pokemon\/3\.png$/),
    );
  });

  it("scales HP against 255 and Attack against 190, so a bar means something", () => {
    render(<PokemonCard pokemon={pokemon()} />);
    expect(screen.getByText("35")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
    expect(barWidth("HP")).toBe("14%"); // 35 / 255
    expect(barWidth("ATK")).toBe("29%"); // 55 / 190
  });

  it("never draws a bar longer than the box, however large the stat", () => {
    render(
      <PokemonCard
        pokemon={pokemon({
          pokemon_v2_pokemonstats: [
            { base_stat: 400, pokemon_v2_stat: { name: "hp" } },
            { base_stat: 255, pokemon_v2_stat: { name: "attack" } },
          ],
        })}
      />,
    );
    expect(barWidth("HP")).toBe("100%");
    expect(barWidth("ATK")).toBe("100%");
  });

  it("shows zero, not a blank or NaN, for a stat the record does not carry", () => {
    render(<PokemonCard pokemon={pokemon({ pokemon_v2_pokemonstats: [] })} />);
    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(barWidth("HP")).toBe("0%");
  });
});
