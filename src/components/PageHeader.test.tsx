import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import PageHeader from "./PageHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => "/calendar",
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () =>
      new Response(JSON.stringify({ sub: null, name: null, email: null }), {
        status: 200,
      }),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  window.scrollY = 0;
});

function scrollTo(y: number) {
  act(() => {
    window.scrollY = y;
    window.dispatchEvent(new Event("scroll"));
  });
}

function renderHeader() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <PageHeader breadcrumbs={[{ label: "Home", href: "/" }, { label: "Calendar" }]} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("the shared page header", () => {
  it("sits full width at the top and turns into a floating pill once the page scrolls", () => {
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toHaveAttribute("data-floating", "false");

    scrollTo(200);
    expect(nav).toHaveAttribute("data-floating", "true");

    scrollTo(0);
    expect(nav).toHaveAttribute("data-floating", "false");
  });

  it("rounds the menu trigger so it nests inside the floating pill", () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: /open menu/i });
    expect(trigger.className).toContain("rounded-full");
    expect(trigger.className).not.toContain("rounded-lg");
  });

  it("drops the floating pill clear of the top edge without changing the header's height", () => {
    renderHeader();
    const pill = screen.getByRole("navigation", { name: "Breadcrumb" }).firstElementChild;
    // A vertical margin collapses through the frame and leaves the pill
    // flush with the top, so the gap is a relative offset instead.
    expect(pill?.className).toContain("group-data-[floating=true]/header:top-2");
    expect(pill?.className).not.toMatch(/header:my-/);
  });
});
