import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GraphQLSkeleton from "./GraphQLSkeleton";
import { POKEMON_TYPES } from "@/types/graphql";

/**
 * The Suspense fallback used to reserve only the search bar and the grid, so
 * when the real content streamed in — search, the full type-filter row, the
 * results-meta line, then the grid — the grid jumped down by the two rows the
 * skeleton never accounted for. That jump is the page's Cumulative Layout
 * Shift. The skeleton must reserve the same filter row.
 */
describe("GraphQLSkeleton", () => {
  it("reserves the type-filter row so the grid doesn't shift when content loads", () => {
    render(<GraphQLSkeleton />);

    // the real header renders an "All" pill plus one per Pokémon type
    expect(screen.getByText("All")).toBeInTheDocument();
    for (const type of POKEMON_TYPES) {
      expect(screen.getByText(type)).toBeInTheDocument();
    }
  });
});
