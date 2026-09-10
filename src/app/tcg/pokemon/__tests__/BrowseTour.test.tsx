import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BrowseContent from "../BrowseContent";

vi.mock("next/navigation", () => ({
  usePathname: () => "/tcg/pokemon",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderBrowse() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <BrowseContent initialCards={[]} />
    </QueryClientProvider>,
  );
}

describe("Pokémon TCG guided tour", () => {
  beforeEach(() => window.localStorage.clear());

  it("exposes a tour button and the anchors it points at", () => {
    window.localStorage.setItem("tcg-tour-seen", "true");
    renderBrowse();
    expect(screen.getByRole("button", { name: /tour/i })).toBeInTheDocument();
    expect(document.getElementById("tcg-filter-bar")).not.toBeNull();
    expect(document.getElementById("tcg-search")).not.toBeNull();
    expect(document.getElementById("tcg-type-filters")).not.toBeNull();
  });

  it("opens the tour and walks into it", () => {
    window.localStorage.setItem("tcg-tour-seen", "true");
    renderBrowse();
    fireEvent.click(screen.getByRole("button", { name: /^tour$/i }));
    const tour = () => screen.getByRole("dialog", { name: /tour/i });
    fireEvent.click(
      within(tour()).getByRole("button", { name: /^next$/i }),
    );
    expect(within(tour()).getByText(/browse the catalog/i)).toBeInTheDocument();
  });
});
