import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PerGameAnalyticsDemo from "../per-game-analytics";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("per-game-analytics")!];

describe("per-game analytics demo", () => {
  it("reskins the dashboard when a different game is picked", () => {
    render(<PerGameAnalyticsDemo feature={feature} />);
    expect(screen.getByText(/Game A · RPG/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Game C" }));
    expect(screen.getByText(/Game C · Strategy/)).toBeInTheDocument();
    expect(screen.queryByText(/Game A · RPG/)).toBeNull();
  });
});
