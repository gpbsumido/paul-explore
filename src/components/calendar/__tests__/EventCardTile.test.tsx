import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EventCardTile from "../EventCardTile";
import type { EventCard } from "@/types/calendar";

const card = (overrides: Partial<EventCard> = {}): EventCard => ({
  id: "c1",
  eventId: "e1",
  cardId: "base1-4",
  cardName: "Charizard",
  quantity: 1,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("EventCardTile", () => {
  it("shows the card's low-resolution image under its name", () => {
    render(<EventCardTile card={card({ cardImageUrl: "https://assets.example/base1/4" })} />);
    expect(screen.getByRole("img", { name: "Charizard" })).toHaveAttribute(
      "src",
      "https://assets.example/base1/4/low.webp",
    );
  });

  it("holds the space with a placeholder, and no image, when there is none", () => {
    render(<EventCardTile card={card()} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Charizard")).toBeInTheDocument();
  });

  it("shows a quantity badge only for more than one copy", () => {
    const { rerender } = render(<EventCardTile card={card({ quantity: 1 })} />);
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();

    rerender(<EventCardTile card={card({ quantity: 3 })} />);
    expect(screen.getByText("×3")).toBeInTheDocument();
  });

  it("shows the set name and notes when it has them, and neither when it does not", () => {
    const { container, rerender } = render(<EventCardTile card={card()} />);
    // Just the name: no empty set or notes lines holding space.
    expect(container.querySelectorAll("p")).toHaveLength(1);

    rerender(<EventCardTile card={card({ cardSetName: "Base Set", notes: "Holo, light wear" })} />);
    expect(screen.getByText("Base Set")).toBeInTheDocument();
    expect(screen.getByText("Holo, light wear")).toBeInTheDocument();
  });
});
