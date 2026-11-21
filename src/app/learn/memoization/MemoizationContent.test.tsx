import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import MemoizationContent from "./MemoizationContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});
afterEach(() => vi.useRealTimers());

const compute = (n: number) =>
  fireEvent.click(screen.getByRole("button", { name: `compute(${n})` }));
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
/** The status line under the buttons, with its inline code spans flattened. */
const status = () =>
  document.body.textContent?.match(/(Cache hit!|Cache miss|Done\.)[^\n]*/)?.[0] ?? "";

describe("MemoizationContent cache demo", () => {
  it("computes a new input slowly, then caches the answer", () => {
    render(<MemoizationContent />);
    compute(2);
    expect(status()).toMatch(/Cache miss/);

    wait(999);
    expect(status()).toMatch(/Cache miss/);
    wait(1);
    expect(status()).toMatch(/Done\. compute\(2\) = 97\. Cached\./);
  });

  it("answers a repeated input straight from the cache", () => {
    render(<MemoizationContent />);
    compute(3);
    wait(1000);

    compute(3);

    expect(status()).toMatch(/Cache hit! compute\(3\) = 256/);
  });

  it("ignores another click while it is still computing", () => {
    render(<MemoizationContent />);
    compute(1);
    wait(500);
    compute(2);
    wait(500);

    // Only compute(1) ran; compute(2) was refused rather than queued.
    expect(status()).toMatch(/Done\. compute\(1\) = 42/);
    wait(2000);
    expect(status()).toMatch(/Done\. compute\(1\) = 42/);
  });

  it("forgets everything on Clear cache, including a computation in flight", () => {
    render(<MemoizationContent />);
    compute(1);
    wait(1000);
    compute(2);
    wait(300);

    fireEvent.click(screen.getByRole("button", { name: "Clear cache" }));
    wait(2000);

    expect(status()).toBe("");
    // With the cache gone, 1 is a miss again, not a hit.
    compute(1);
    expect(status()).toMatch(/Cache miss/);
  });
});
