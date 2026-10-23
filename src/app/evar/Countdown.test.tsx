import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import Countdown from "./Countdown";

afterEach(() => {
  vi.useRealTimers();
});

const FIVE_MINUTES = 5 * 60 * 1000;

describe("Countdown", () => {
  it("runs down on its own, warning at a minute and at thirty seconds", () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    render(<Countdown startedAt={startedAt} limitMs={FIVE_MINUTES} finishedAt={null} onExpire={() => {}} />);
    expect(screen.getByRole("timer", { name: /time left/i })).toHaveTextContent("5:00");

    act(() => vi.advanceTimersByTime(4 * 60 * 1000));
    expect(screen.getByRole("timer", { name: /time left/i })).toHaveTextContent("1:00");
    expect(screen.getByText("1 minute left.")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(31_000));
    expect(screen.getByText("30 seconds left.")).toBeInTheDocument();
  });

  it("hands in once when it reaches zero, at the moment the time ran out", () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    const onExpire = vi.fn();
    render(<Countdown startedAt={startedAt} limitMs={FIVE_MINUTES} finishedAt={null} onExpire={onExpire} />);
    act(() => vi.advanceTimersByTime(FIVE_MINUTES + 2000));
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(onExpire).toHaveBeenCalledWith(startedAt + FIVE_MINUTES);
  });

  it("stops at the time an attempt finished", () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    render(<Countdown startedAt={startedAt} limitMs={FIVE_MINUTES} finishedAt={startedAt + 90_000} onExpire={() => {}} />);
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole("timer", { name: /time left/i })).toHaveTextContent("3:30");
  });
});
