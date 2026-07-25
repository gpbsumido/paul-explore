import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { ComponentType } from "react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { ThemeProvider } from "@/components/ThemeProvider";

import SlidingWindow from "@/app/learn/sliding-window/SlidingWindowContent";
import BinarySearch from "@/app/learn/binary-search/BinarySearchContent";
import DynamicProgramming from "@/app/learn/dynamic-programming/DPContent";
import RecursionBacktracking from "@/app/learn/recursion-backtracking/RecursionBacktrackingContent";
import TreesGraphs from "@/app/learn/trees-graphs/TreesGraphsContent";
import TwoPointers from "@/app/learn/two-pointers/TwoPointersContent";
import HashMaps from "@/app/learn/hash-maps/HashMapsContent";
import StacksQueues from "@/app/learn/stacks-queues/StacksQueuesContent";
import AsyncPatterns from "@/app/learn/async-patterns/AsyncContent";

/**
 * Every learn page hosts one or two "steppers": a Play/Pause, Step, and Reset
 * control over a fixed list of algorithm steps, with an `n/total` counter that
 * sits outside the animated region (so it tracks state directly). These lock in
 * that contract across all the pages: stepping advances the counter, reset
 * returns to the start, and play runs to the last step and stops there.
 *
 * The counter is 1-indexed on most pages (`1/6`) and 0-indexed on the async
 * page (`0/7`), but in both the last step reads `den/den`, so the assertions
 * are written against that instead of a fixed start value.
 */

const PAGES: ReadonlyArray<readonly [string, ComponentType]> = [
  ["sliding-window", SlidingWindow],
  ["binary-search", BinarySearch],
  ["dynamic-programming", DynamicProgramming],
  ["recursion-backtracking", RecursionBacktracking],
  ["trees-graphs", TreesGraphs],
  ["two-pointers", TwoPointers],
  ["hash-maps", HashMaps],
  ["stacks-queues", StacksQueues],
  ["async-patterns", AsyncPatterns],
];

beforeAll(() => {
  // the page header issues a /api/me query; answer it so MSW doesn't error
  server.use(
    http.get("*/api/me", () => HttpResponse.json({ sub: null, name: null })),
  );
});

afterEach(() => vi.useRealTimers());

function renderPage(Comp: ComponentType) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <Comp />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

/** First stepper's `n/total` counter, as [numerator, denominator]. */
function firstCounter(): [number, number] {
  const text = screen.getAllByText(/^\d+\/\d+$/)[0].textContent ?? "";
  const [n, d] = text.split("/").map(Number);
  return [n, d];
}
function clickFirst(name: string) {
  fireEvent.click(screen.getAllByRole("button", { name })[0]);
}

describe("learn page steppers", () => {
  describe.each(PAGES)("%s", (_name, Comp) => {
    it("advances on Step and returns on Reset", () => {
      renderPage(Comp);
      const [start, den] = firstCounter();
      expect(den).toBeGreaterThan(start);

      clickFirst("Step");
      expect(firstCounter()).toEqual([start + 1, den]);

      clickFirst("Reset");
      expect(firstCounter()).toEqual([start, den]);
    });

    it("plays to the last step and stops there", () => {
      vi.useFakeTimers();
      renderPage(Comp);
      const [, den] = firstCounter();

      clickFirst("Play");
      expect(screen.getAllByRole("button", { name: "Pause" })[0]).toBeInTheDocument();

      // the interval ticks every 800ms; run well past the total
      act(() => vi.advanceTimersByTime(800 * (den + 3)));

      expect(firstCounter()[0]).toBe(den); // reached the last step
      // stopped at the end: the control is back to Play
      expect(screen.getAllByRole("button", { name: "Play" })[0]).toBeInTheDocument();
    });
  });
});
