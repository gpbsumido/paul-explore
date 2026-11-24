import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DebounceThrottleContent from "./DebounceThrottleContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});
afterEach(() => vi.useRealTimers());

/** How many dots sit on a timeline row, found by the row's label. */
const dotsOn = (label: string) => {
  const row = screen.getByText(label).parentElement!;
  return row.querySelectorAll(".absolute").length;
};

const click = () =>
  fireEvent.click(screen.getByRole("button", { name: "Click me rapidly" }));
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("DebounceThrottleContent live timeline", () => {
  it("puts every click on the raw row, and lets the others hold back", () => {
    render(<DebounceThrottleContent />);
    click();
    wait(50);
    click();
    wait(50);
    click();

    expect(dotsOn("Raw")).toBe(3);
    expect(dotsOn("Debounced (300ms)")).toBe(0);
    // Only the first click got through a 300ms throttle.
    expect(dotsOn("Throttled (300ms)")).toBe(1);
  });

  it("debounces to a single fire once clicking has been quiet for 300ms", () => {
    render(<DebounceThrottleContent />);
    click();
    wait(100);
    click();
    wait(299);
    expect(dotsOn("Debounced (300ms)")).toBe(0);

    wait(1);
    expect(dotsOn("Debounced (300ms)")).toBe(1);
  });

  it("lets a throttled click through again after 300ms", () => {
    render(<DebounceThrottleContent />);
    click();
    wait(299);
    click();
    expect(dotsOn("Throttled (300ms)")).toBe(1);

    wait(1);
    click();
    expect(dotsOn("Throttled (300ms)")).toBe(2);
    expect(dotsOn("Raw")).toBe(3);
  });

  it("clears every row, cancels a pending debounce, and starts the clock afresh", () => {
    render(<DebounceThrottleContent />);
    click();
    wait(100);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    wait(1000);

    expect(dotsOn("Raw")).toBe(0);
    expect(dotsOn("Debounced (300ms)")).toBe(0);
    expect(dotsOn("Throttled (300ms)")).toBe(0);

    // The throttle forgets its last pass, so the next click goes straight through.
    click();
    expect(dotsOn("Throttled (300ms)")).toBe(1);
  });
});
