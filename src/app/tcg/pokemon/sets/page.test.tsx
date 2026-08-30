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

import SetsPage from "./page";

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
