import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import GameDemoFrame from "../game-demo";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("game-demo")!];

// best score persists to localStorage; isolate each test
beforeEach(() => window.localStorage.clear());
afterEach(() => vi.useRealTimers());

function startAndLoad() {
  fireEvent.click(screen.getByRole("button", { name: "▶ Start demo" }));
  act(() => vi.advanceTimersByTime(3000));
}

describe("game demo", () => {
  it("loads the booth build to completion instead of hanging", () => {
    vi.useFakeTimers();
    render(<GameDemoFrame feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "▶ Start demo" }));
    expect(screen.getByText(/compiling booth build/i)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(
      screen.getByRole("button", { name: "Hit target" }),
    ).toBeInTheDocument();
  });

  it("scores when a target is hit", () => {
    vi.useFakeTimers();
    render(<GameDemoFrame feature={feature} />);
    startAndLoad();
    expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hit target" }));
    expect(screen.getByText(/Score: 1/)).toBeInTheDocument();
  });

  it("ends the round after the timer and records the best score", () => {
    vi.useFakeTimers();
    render(<GameDemoFrame feature={feature} />);
    startAndLoad();
    fireEvent.click(screen.getByRole("button", { name: "Hit target" }));

    // run out the 20s round
    act(() => vi.advanceTimersByTime(21_000));

    expect(screen.getByText(/Score 1 · Best 1/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "▶ Play again" }),
    ).toBeInTheDocument();
  });
});
