import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";
import { CRAFT_TRAITS } from "@/lib/craft";
import { FEATURES, THOUGHTS } from "@/app/_shared/featureData.data";
import { TEST_COUNT } from "@/app/_shared/testCount.generated";
import V5Content from "./V5Content";

// HeaderMenu re-checks auth on route change via usePathname; the landing never
// navigates in these tests, so a fixed path is enough.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

const renderPage = (me?: { name: string | null; email: string | null }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <V5Content me={me} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

const hrefs = () =>
  screen.getAllByRole("link").map((a) => a.getAttribute("href"));

describe("V5Content", () => {
  it("names its subject in the only h1 on the page", () => {
    renderPage();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Paul Sumido");
  });

  it("states the lead frontend positioning, which is the job the page is for", () => {
    renderPage();
    expect(screen.getByText(/Lead Frontend Developer/i)).toBeInTheDocument();
  });

  it("renders a main landmark, since layout.tsx only supplies the skip target", () => {
    renderPage();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("argues the whole craft matrix, not a curated subset of it", () => {
    renderPage();
    for (const trait of CRAFT_TRAITS) {
      expect(
        screen.getByRole("heading", { name: trait.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(trait.principle)).toBeInTheDocument();
    }
  });

  it("keeps every craft evidence link, because the proof is the argument", () => {
    renderPage();
    const rendered = hrefs();
    const evidence = CRAFT_TRAITS.flatMap((t) => t.evidence.map((e) => e.href));
    for (const href of new Set(evidence)) {
      expect(rendered).toContain(href);
    }
  });

  it("reads the test count from the generated module rather than a literal", () => {
    renderPage();
    // Asserting against the import is what makes a stale hardcoded figure fail:
    // the number changes on every prebuild, the assertion follows it.
    expect(
      screen.getByText(TEST_COUNT.toLocaleString("en-US")),
    ).toBeInTheDocument();
  });

  it("counts the features it has rather than a number typed by hand", () => {
    renderPage();
    expect(screen.getAllByText(String(FEATURES.length)).length).toBeGreaterThan(
      0,
    );
  });

  it("offers the resume and a route into the work from the hero", () => {
    renderPage();
    const hero = screen.getByRole("region", { name: /Paul Sumido/ });
    const heroHrefs = within(hero)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(heroHrefs).toContain("/resume");
    expect(heroHrefs).toContain("#work");
  });

  it("links out to every place the page owes the reader", () => {
    renderPage();
    const rendered = hrefs();
    for (const href of [
      "/resume",
      "/craft",
      "/vitals",
      "/thoughts",
      "/discover",
    ]) {
      expect(rendered).toContain(href);
    }
  });

  it("features the six curated apps by their real routes", () => {
    renderPage();
    const rendered = hrefs();
    for (const id of [
      "world",
      "work-portfolio",
      "operator",
      "learn",
      "design-system",
      "vitals",
    ]) {
      const feature = FEATURES.find((f) => f.id === id);
      expect(feature).toBeDefined();
      expect(rendered).toContain(feature?.href);
    }
  });

  it("teases three write-ups that exist in the registry", () => {
    renderPage();
    const rendered = hrefs();
    for (const href of [
      "/thoughts/craft",
      "/thoughts/test-tiers",
      "/thoughts/render-perf",
    ]) {
      expect(THOUGHTS.some((t) => t.href === href)).toBe(true);
      expect(rendered).toContain(href);
    }
  });

  it("gives a hiring manager both resume formats, an inbox and a GitHub", () => {
    renderPage();
    const rendered = hrefs();
    expect(rendered).toContain("/resume/Resume-Developer-Sumido.pdf");
    expect(rendered).toContain("/resume/Resume-Developer-Sumido.docx");
    expect(rendered).toContain("mailto:psumido@gmail.com");
    expect(rendered).toContain("https://github.com/gpbsumido");
  });

  it("claims no LinkedIn, because no verified URL for one exists here", () => {
    renderPage();
    expect(
      hrefs().some((href) => href?.includes("linkedin.com")),
    ).toBe(false);
  });

  it("greets a signed-in visitor by first name and shows their quick links", () => {
    renderPage({ name: "Paul Sumido", email: "psumido@gmail.com" });
    expect(screen.getByText(/Back again, Paul/)).toBeInTheDocument();
    const rendered = hrefs();
    for (const href of ["/settings", "/calendar", "/to-do"]) {
      expect(rendered).toContain(href);
    }
  });

  it("shows no signed-in quick links to a guest", () => {
    renderPage();
    expect(hrefs()).not.toContain("/to-do");
  });

  it("has no axe violations as a guest", async () => {
    const { container } = renderPage();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations signed in", async () => {
    const { container } = renderPage({
      name: "Paul Sumido",
      email: "psumido@gmail.com",
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
