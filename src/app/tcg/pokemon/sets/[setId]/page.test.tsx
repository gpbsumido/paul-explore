import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * The nightly production build died exporting `/tcg/pokemon/sets/me02`, which
 * took the whole E2E job with it because Playwright's webServer never came up.
 *
 * The cause is upstream data, not the route: a set that has just been announced
 * appears in the set list with parts of its record still missing. The page
 * guarded `!set` and then read `set.serie.name`, `set.cardCount.official` and
 * `set.legal.*` unguarded, so an incomplete set threw during static export.
 *
 * These render the page against exactly that shape. The point is not which
 * field `me02` happened to be missing -- it is that no single missing field
 * from a third party should be able to fail a build.
 */
const setGet = vi.hoisted(() => vi.fn());

vi.mock("@tcgdex/sdk", () => ({
  default: class {
    set = { get: setGet, list: vi.fn().mockResolvedValue([]) };
  },
}));

vi.mock("./SetCardsGrid", () => ({
  default: () => <div data-testid="cards-grid" />,
}));

// Neither the grid nor the header is what these pin; both drag in providers
// this test has no reason to stand up.
vi.mock("@/components/PageHeader", () => ({
  default: () => <div data-testid="page-header" />,
}));

const notFound = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  notFound,
  usePathname: () => "/tcg/pokemon/sets/me02",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import SetDetailPage, { generateStaticParams } from "./page";

const complete = {
  id: "me02",
  name: "Mega Evolution",
  logo: null,
  symbol: null,
  releaseDate: "2026-08-28",
  serie: { name: "Scarlet & Violet" },
  cardCount: { official: 120 },
  legal: { standard: true, expanded: true },
};

/** Renders the async server component. */
async function renderPage() {
  const ui = await SetDetailPage({ params: Promise.resolve({ setId: "me02" }) });
  return render(ui);
}

beforeEach(() => {
  vi.clearAllMocks();
  setGet.mockResolvedValue(complete);
});

describe("set detail page with incomplete upstream data", () => {
  it("renders a set that is missing its series", async () => {
    setGet.mockResolvedValue({ ...complete, serie: undefined });
    await renderPage();
    expect(screen.getByText("Mega Evolution")).toBeInTheDocument();
  });

  it("renders a set that is missing its card count", async () => {
    setGet.mockResolvedValue({ ...complete, cardCount: undefined });
    await renderPage();
    expect(screen.getByText("Mega Evolution")).toBeInTheDocument();
  });

  it("renders a set that has no legality block yet", async () => {
    // The likeliest shape for a just-announced set: named and dated, with no
    // format legality decided.
    setGet.mockResolvedValue({ ...complete, legal: undefined });
    await renderPage();
    expect(screen.getByText("Mega Evolution")).toBeInTheDocument();
  });

  it("renders a set carrying nothing but an id and a name", async () => {
    setGet.mockResolvedValue({ id: "me02", name: "Mega Evolution" });
    await renderPage();
    expect(screen.getByText("Mega Evolution")).toBeInTheDocument();
  });

  it("omits the card count rather than printing a broken one", async () => {
    setGet.mockResolvedValue({ ...complete, cardCount: undefined });
    await renderPage();
    expect(screen.queryByText(/cards/)).not.toBeInTheDocument();
  });

  it("still 404s a set that genuinely is not there", async () => {
    setGet.mockRejectedValue(new Error("upstream 404"));
    await renderPage().catch(() => undefined);
    expect(notFound).toHaveBeenCalled();
  });
});

describe("build-time independence", () => {
  it("pre-renders nothing, so a third party cannot fail the build", async () => {
    // Pre-rendering meant fetching each set during `next build`, and one set
    // that did not come back cleanly ended the export. Guarding fields chases
    // that one set at a time; not calling the API during the build removes the
    // whole class.
    await expect(generateStaticParams()).resolves.toEqual([]);
    expect(setGet).not.toHaveBeenCalled();
  });
});
