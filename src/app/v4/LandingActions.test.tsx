import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import LandingActions from "./LandingActions";

// HeaderMenu re-checks auth on route change via usePathname; the landing never
// navigates in these tests, so a fixed path is enough.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

const renderActions = (loggedIn: boolean) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LandingActions loggedIn={loggedIn} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe("LandingActions", () => {
  it("renders the settings menu trigger", () => {
    renderActions(false);
    expect(
      screen.getByRole("button", { name: /open menu/i }),
    ).toBeInTheDocument();
  });

  it("keeps the Settings link hidden until the menu is opened", () => {
    renderActions(true);
    expect(
      screen.queryByRole("link", { name: /settings/i }),
    ).not.toBeInTheDocument();
  });

  it("reveals a Settings link to /settings once a signed-in visitor opens the menu", () => {
    renderActions(true);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    const settings = screen.getByRole("link", { name: /settings/i });
    expect(settings).toHaveAttribute("href", "/settings");
  });

  it("offers a guest no Settings link, since /settings would only bounce them to login", () => {
    renderActions(false);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(
      screen.queryByRole("link", { name: /settings/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the Log in CTA when logged out", () => {
    renderActions(false);
    const cta = screen.getByRole("link", { name: /log in/i });
    expect(cta).toHaveAttribute("href", "/auth/login");
  });

  it("shows the Log out CTA when logged in", () => {
    renderActions(true);
    const cta = screen.getByRole("link", { name: /log out/i });
    expect(cta).toHaveAttribute("href", "/auth/logout");
  });

  it("renders the menu trigger and auth CTA as matching pills", () => {
    renderActions(false);
    const trigger = screen.getByRole("button", { name: /open menu/i });
    const cta = screen.getByRole("link", { name: /log in/i });
    // The v4 header treats every control as the same rounded pill on the same
    // surface; the trigger and CTA must both carry that shared treatment.
    for (const el of [trigger, cta]) {
      expect(el.className).toContain("rounded-full");
      expect(el.className).toContain("border-border");
      expect(el.className).toContain("bg-surface/70");
      // Content height differs between icon-only and text pills, so the
      // uniform height has to be explicit, not derived from padding.
      expect(el.className).toContain("h-9");
    }
  });
});
