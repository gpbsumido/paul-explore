import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import GameDemoFrame from "../game-demo";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("game-demo")!];

afterEach(() => vi.useRealTimers());

describe("game demo", () => {
  it("loads the booth build to completion instead of hanging", () => {
    vi.useFakeTimers();
    render(<GameDemoFrame feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "▶ Start demo" }));
    // it shows a compiling progress, not a permanent spinner
    expect(screen.getByText(/compiling booth build/i)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    // once loaded, the playable target is present
    expect(
      screen.getByRole("button", { name: "Hit target" }),
    ).toBeInTheDocument();
  });

  it("scores when a target is hit", () => {
    vi.useFakeTimers();
    render(<GameDemoFrame feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "▶ Start demo" }));
    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByText("Score: 0")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hit target" }));
    expect(screen.getByText("Score: 1")).toBeInTheDocument();
  });
});
