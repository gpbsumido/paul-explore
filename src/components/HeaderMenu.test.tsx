import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import HeaderMenu from "./HeaderMenu";

// HeaderMenu re-checks auth on route change via usePathname; these tests never
// navigate, so a fixed path is enough.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

const renderMenu = (props?: { triggerClassName?: string }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <HeaderMenu {...props} />
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

describe("HeaderMenu trigger styling", () => {
  it("keeps the standard trigger look when no override is given", () => {
    renderMenu();
    const trigger = screen.getByRole("button", { name: /open menu/i });
    // Every page that renders the menu without an override (PageHeader, the
    // v1 hero, the v2 nav) relies on this default staying put.
    expect(trigger.className).toContain("rounded-lg");
    expect(trigger.className).toContain("border-border");
  });

  it("lets a caller restyle the trigger without touching the default", () => {
    renderMenu({ triggerClassName: "rounded-full custom-pill" });
    const trigger = screen.getByRole("button", { name: /open menu/i });
    expect(trigger.className).toContain("rounded-full");
    expect(trigger.className).toContain("custom-pill");
    expect(trigger.className).not.toContain("rounded-lg");
  });
});
