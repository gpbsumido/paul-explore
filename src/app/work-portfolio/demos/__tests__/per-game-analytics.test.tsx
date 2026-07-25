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

  it("compares two titles with per-metric deltas", () => {
    render(<PerGameAnalyticsDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "compare" }));

    expect(screen.getByLabelText("Left title")).toBeInTheDocument();
    expect(screen.getByLabelText("Right title")).toBeInTheDocument();
    // a delta column with signed percentages
    const deltas = screen.getAllByText(/[▲▼]\s*\d+%/);
    expect(deltas.length).toBe(4); // one per metric
  });

  it("recomputes the diff when the right title changes", () => {
    render(<PerGameAnalyticsDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "compare" }));
    const before = screen
      .getAllByText(/[▲▼]\s*\d+%/)
      .map((el) => el.textContent);
    fireEvent.change(screen.getByLabelText("Right title"), {
      target: { value: "c" },
    });
    const after = screen
      .getAllByText(/[▲▼]\s*\d+%/)
      .map((el) => el.textContent);
    expect(after).not.toEqual(before);
  });
});
