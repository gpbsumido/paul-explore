import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * The sets list renders during `next build` because of its `revalidate`, so an
 * unguarded read here does not produce a broken page — it ends the export and
 * fails the whole build. It already caught a failing *fetch*; what it did not
 * survive was a fetch that succeeds and returns a series with parts missing.
 */
const serieList = vi.hoisted(() => vi.fn());
const serieGet = vi.hoisted(() => vi.fn());

vi.mock("@tcgdex/sdk", () => ({
  default: class {
    serie = { list: serieList, get: serieGet };
  },
}));

vi.mock("@/components/PageHeader", () => ({
  default: () => <div data-testid="page-header" />,
}));

import SetsPage, { withTimeout } from "./page";

const complete = {
  id: "sv",
  name: "Scarlet & Violet",
  logo: null,
  sets: [
    { id: "sv1", name: "Base", logo: null, cardCount: { official: 198 } },
  ],
};

async function renderPage() {
  return render(await SetsPage());
}

beforeEach(() => {
  vi.clearAllMocks();
  serieList.mockResolvedValue([{ id: "sv" }]);
  serieGet.mockResolvedValue(complete);
});

describe("sets list with incomplete upstream data", () => {
  it("renders a series that has no sets array yet", async () => {
    serieGet.mockResolvedValue({ ...complete, sets: undefined });
    await renderPage();
    expect(screen.getByText("Scarlet & Violet")).toBeInTheDocument();
    expect(screen.getByText(/0 sets/)).toBeInTheDocument();
  });

  it("renders a set that has no card count yet", async () => {
    serieGet.mockResolvedValue({
      ...complete,
      sets: [{ id: "sv1", name: "Base", logo: null, cardCount: undefined }],
    });
    await renderPage();
    // A dash rather than a crash: the set is real, the count is not known yet.
    expect(screen.getByText("Base")).toBeInTheDocument();
  });

  it("still renders when the upstream fetch fails outright", async () => {
    serieList.mockRejectedValue(new Error("upstream down"));
    await renderPage();
    expect(screen.getByTestId("page-header")).toBeInTheDocument();
  });
});

describe("the build-time budget", () => {
  it("gives up on a fan-out that outlives its budget", async () => {
    vi.useFakeTimers();
    try {
      const hanging = new Promise(() => {});
      const raced = withTimeout(hanging, 20_000);
      const settled = raced.then(
        () => "resolved",
        () => "gave up",
      );
      await vi.advanceTimersByTimeAsync(20_001);
      await expect(settled).resolves.toBe("gave up");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not delay work that finishes in time", async () => {
    vi.useFakeTimers();
    try {
      await expect(withTimeout(Promise.resolve("done"), 20_000)).resolves.toBe(
        "done",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders the page rather than throwing when the fan-out is too slow", async () => {
    vi.useFakeTimers();
    try {
      serieList.mockReturnValue(new Promise(() => {}));
      const pending = SetsPage();
      await vi.advanceTimersByTimeAsync(20_001);
      // An empty list is the right degradation: ISR fills it in later, and a
      // build that finishes beats a page that is momentarily bare.
      render(await pending);
      expect(screen.getByTestId("page-header")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
