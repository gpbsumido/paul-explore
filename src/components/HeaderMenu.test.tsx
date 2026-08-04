import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import HeaderMenu from "@/components/HeaderMenu";

// The menu re-checks auth on route change; a fixed path is enough here. The
// /api/me handler in the test server answers signed-out, so this renders the
// logged-out menu.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

const renderMenu = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <HeaderMenu />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe("HeaderMenu — Web Vitals is public", () => {
  it("shows the Web Vitals link even when signed out", async () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    const vitals = await screen.findByRole("link", { name: /web vitals/i });
    expect(vitals).toHaveAttribute("href", "/vitals");
  });
});
