import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import LandingContentV5 from "./LandingContentV5";
import FeatureHubV5 from "./FeatureHubV5";
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
 * The two wrappers exist for the same reason the v4 pair does: one page, two
 * header states. Everything below the header is the same component, so these
 * tests only pin the split and the pass-through.
 */
describe("the v5 landing wrappers", () => {
  it("offers a guest the log in call to action", () => {
    withProviders(<LandingContentV5 />);
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });

  it("shows a guest no personal routes outside the menu", () => {
    withProviders(<LandingContentV5 />);
    expect(hrefs()).not.toContain("/to-do");
  });

  it("offers a signed-in visitor the log out call to action", () => {
    withProviders(<FeatureHubV5 initialMe={{ name: null, email: null }} />);
    expect(screen.getByRole("link", { name: /log out/i })).toHaveAttribute(
      "href",
      "/auth/logout",
    );
  });

  it("adds no second bar for a signed-in visitor", () => {
    withProviders(
      <FeatureHubV5
        initialMe={{ name: "Paul Sumido", email: "psumido@gmail.com" }}
      />,
    );
    expect(screen.queryByText(/Back again/)).not.toBeInTheDocument();
  });

  it("passes the tagline choice through to the hero", () => {
    withProviders(<LandingContentV5 taglineIndex={1} />);
    expect(screen.getByText(HERO_TAGLINES[1])).toBeInTheDocument();
  });

  it("passes the tagline choice through for the signed-in page too", () => {
    withProviders(
      <FeatureHubV5 initialMe={{ name: null, email: null }} taglineIndex={3} />,
    );
    expect(screen.getByText(HERO_TAGLINES[3])).toBeInTheDocument();
  });
});
