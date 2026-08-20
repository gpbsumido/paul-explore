import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { server } from "@/test/server";
import LandingContentV5 from "./LandingContentV5";
import { HERO_TAGLINES } from "./taglines";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

const withProviders = (ui: React.ReactNode) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>{ui}</ThemeProvider>
    </QueryClientProvider>,
  );
};

const hrefs = () =>
  screen.getAllByRole("link").map((a) => a.getAttribute("href"));

/**
 * There used to be two wrappers here, one per auth state, because the page
 * learned the session from the server. It renders statically now and the
 * header CTA resolves its own state from /api/me, so one wrapper serves
 * everyone and these tests drive the auth state through the network.
 */
describe("the v5 landing", () => {
  it("offers a guest the log in call to action", async () => {
    withProviders(<LandingContentV5 />);
    expect(
      await screen.findByRole("link", { name: /log in/i }),
    ).toHaveAttribute("href", "/auth/login");
  });

  it("shows a guest no personal routes outside the menu", () => {
    withProviders(<LandingContentV5 />);
    expect(hrefs()).not.toContain("/to-do");
  });

  it("offers a signed-in visitor the log out call to action", async () => {
    server.use(
      http.get("/api/me", () => HttpResponse.json({ sub: "auth0|paul" })),
    );
    withProviders(<LandingContentV5 />);
    expect(
      await screen.findByRole("link", { name: /log out/i }),
    ).toHaveAttribute("href", "/auth/logout");
  });

  it("adds no second bar for a signed-in visitor", async () => {
    server.use(
      http.get("/api/me", () => HttpResponse.json({ sub: "auth0|paul" })),
    );
    withProviders(<LandingContentV5 />);
    await screen.findByRole("link", { name: /log out/i });
    expect(screen.queryByText(/Back again/)).not.toBeInTheDocument();
  });

  it("passes the tagline choice through to the hero", () => {
    withProviders(<LandingContentV5 taglineIndex={1} />);
    expect(screen.getByText(HERO_TAGLINES[1])).toBeInTheDocument();
  });
});
