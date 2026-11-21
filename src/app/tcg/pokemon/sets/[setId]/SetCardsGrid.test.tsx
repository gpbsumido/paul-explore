import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import type { CardResume } from "@/lib/tcg";
import SetCardsGrid from "./SetCardsGrid";

const replace = vi.hoisted(() => vi.fn());
const search = vi.hoisted(() => ({ value: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search.value),
}));

const PER_PAGE = 20;

/** `count` cards whose ids carry their page, so a test can see which one it got. */
const cards = (page: number, count: number): CardResume[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${page}-${i + 1}`,
    name: `Card ${page}.${i + 1}`,
    localId: String(i + 1),
    image: `https://assets.tcgdex.net/en/me02/p${page}-${i + 1}`,
  }));

/** Answers the cards route, recording which pages were asked for. */
function serveCards(respond: (page: number) => CardResume[]) {
  const pages: string[] = [];
  server.use(
    http.get("/api/tcg/cards", ({ request }) => {
      const params = new URL(request.url).searchParams;
      pages.push(`${params.get("setId")}:${params.get("page")}`);
      return HttpResponse.json(respond(Number(params.get("page"))));
    }),
  );
  return pages;
}

/** The page keeps one observer on its sentinel; this fires the latest by hand. */
function captureObserver() {
  const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  return () => callbacks.at(-1)?.([{ isIntersecting: true }]);
}

function renderGrid() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SetCardsGrid setId="me02" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  replace.mockReset();
  search.value = "";
});
afterEach(() => vi.unstubAllGlobals());

describe("SetCardsGrid", () => {
  it("links each card to its page, with the low-resolution image", async () => {
    serveCards((page) => cards(page, 2));
    renderGrid();

    const link = await screen.findByRole("link", { name: "Card 1.1" });
    expect(link).toHaveAttribute("href", "/tcg/pokemon/card/p1-1");
    expect(screen.getByRole("img", { name: "Card 1.1" })).toHaveAttribute(
      "src",
      "https://assets.tcgdex.net/en/me02/p1-1/low.webp",
    );
  });

  it("still shows a card that has no image yet, as a blank slot that links through", async () => {
    serveCards(() => [{ id: "me02-9", name: "Unrevealed", localId: "9" }]);
    renderGrid();

    const links = await screen.findAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/tcg/pokemon/card/me02-9");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("starts at the page named in the address, and a nonsense page means the first", async () => {
    search.value = "page=3";
    const pages = serveCards((page) => cards(page, 2));
    const first = renderGrid();
    await screen.findByRole("link", { name: "Card 3.1" });
    expect(pages).toEqual(["me02:3"]);
    first.unmount();

    search.value = "page=banana";
    pages.length = 0;
    renderGrid();
    await screen.findByRole("link", { name: "Card 1.1" });
    expect(pages).toEqual(["me02:1"]);
  });

  it("loads the next page when the end scrolls into view, and records it in the address", async () => {
    const scrollToEnd = captureObserver();
    const pages = serveCards((page) => cards(page, PER_PAGE));
    renderGrid();
    await screen.findByRole("link", { name: "Card 1.1" });
    expect(replace).toHaveBeenLastCalledWith("/tcg/pokemon/sets/me02", { scroll: false });

    scrollToEnd();

    expect(await screen.findByRole("link", { name: "Card 2.1" })).toBeInTheDocument();
    expect(pages).toEqual(["me02:1", "me02:2"]);
    await vi.waitFor(() =>
      expect(replace).toHaveBeenLastCalledWith("/tcg/pokemon/sets/me02?page=2", {
        scroll: false,
      }),
    );
  });

  it("stops asking once a page comes back short", async () => {
    const scrollToEnd = captureObserver();
    const pages = serveCards((page) => cards(page, PER_PAGE - 1));
    renderGrid();
    await screen.findByRole("link", { name: "Card 1.1" });

    scrollToEnd();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(pages).toEqual(["me02:1"]);
  });

  it("says there are no cards rather than showing an empty grid", async () => {
    serveCards(() => []);
    renderGrid();
    expect(await screen.findByText("No cards available")).toBeInTheDocument();
  });

  it("offers a retry when the cards fail to load, and recovers", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/tcg/cards", () => HttpResponse.json({}, { status: 500 })),
    );
    renderGrid();
    expect(await screen.findByText("Failed to load cards.")).toBeInTheDocument();

    serveCards((page) => cards(page, 2));
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("link", { name: "Card 1.1" })).toBeInTheDocument();
    expect(screen.queryByText("Failed to load cards.")).not.toBeInTheDocument();
  });
});
