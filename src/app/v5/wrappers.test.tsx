import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import LandingContentV5 from "./LandingContentV5";
import FeatureHubV5 from "./FeatureHubV5";

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
 * greetings. Everything below the greeting is the same component, so these
 * tests only pin the split.
 */
describe("the v5 landing wrappers", () => {
  it("offers a guest the log in call to action", () => {
    withProviders(<LandingContentV5 />);
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });

  it("shows a guest no personal quick links", () => {
    withProviders(<LandingContentV5 />);
    expect(hrefs()).not.toContain("/to-do");
  });

  it("greets a signed-in visitor by first name", () => {
    withProviders(
      <FeatureHubV5
        initialMe={{ name: "Paul Sumido", email: "psumido@gmail.com" }}
      />,
    );
    expect(screen.getByText(/Back again, Paul/)).toBeInTheDocument();
  });

  it("offers a signed-in visitor the log out call to action", () => {
    withProviders(<FeatureHubV5 initialMe={{ name: null, email: null }} />);
    expect(screen.getByRole("link", { name: /log out/i })).toHaveAttribute(
      "href",
      "/auth/logout",
    );
  });

  it("greets a session with no name without printing an empty gap", () => {
    withProviders(<FeatureHubV5 initialMe={{ name: null, email: null }} />);
    expect(screen.getByText(/Back again\b/)).toBeInTheDocument();
    expect(screen.queryByText(/Back again, \./)).not.toBeInTheDocument();
  });

  it("gives a signed-in visitor their own routes", () => {
    withProviders(
      <FeatureHubV5
        initialMe={{ name: "Paul Sumido", email: "psumido@gmail.com" }}
      />,
    );
    const rendered = hrefs();
    for (const href of ["/settings", "/calendar", "/to-do"]) {
      expect(rendered).toContain(href);
    }
  });
});
