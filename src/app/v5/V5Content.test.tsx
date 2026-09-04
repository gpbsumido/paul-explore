import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";
import { CRAFT_TRAITS } from "@/lib/craft";
import { FEATURES, THOUGHTS } from "@/app/_shared/featureData.data";
import { TEST_COUNT } from "@/app/_shared/testCount.generated";
import V5Content from "./V5Content";
import Proof from "./sections/Proof";
import { HERO_TAGLINES } from "./taglines";
import { WRITING_POOL } from "./featured";

// HeaderMenu re-checks auth on route change via usePathname; the landing never
// navigates in these tests, so a fixed path is enough.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

const renderPage = (
  props: Parameters<typeof V5Content>[0] = {},
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <V5Content {...props} />
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

  it("paints the hero heading on the first frame instead of gating LCP behind a fade", () => {
    // The h1 is the page's LCP element. .reveal-up animates opacity from 0,
    // which Chrome does not count as painted, so under a busy main thread the
    // largest text lands seconds after first paint. .rise-in slides the same
    // distance on transform alone, opacity held at 1, so the heading is painted
    // immediately either way and LCP tracks FCP.
    renderPage();
    const heading = screen.getAllByRole("heading", { level: 1 })[0];
    expect(heading.className).toContain("rise-in");
    expect(heading.className).not.toContain("reveal-up");
  });

  it("defines rise-in as a transform-only entrance, so it never ships opacity:0", () => {
    // The className contract above only holds if the class itself doesn't touch
    // opacity. Read the real stylesheet and pin the keyframe: transform moves,
    // opacity is never animated to or from zero.
    const css = readFileSync(
      join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );
    const match = css.match(/@keyframes\s+rise-in\s*\{([\s\S]*?)\}\s*\}/);
    expect(match).not.toBeNull();
    const block = match?.[0] ?? "";
    expect(block).toContain("transform");
    expect(block).not.toContain("opacity");
  });

  it("composites the rise-in entrance so it doesn't jank on a busy main thread", () => {
    // The entrance fires while the page hydrates and the 3D hero chunk parses.
    // Without a compositor layer the transform runs on the main thread and drops
    // frames under that load — the choppy entrance. will-change promotes it.
    const css = readFileSync(
      join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );
    const rule = css.match(/\.rise-in\s*\{([\s\S]*?)\}/);
    expect(rule?.[1] ?? "").toMatch(/will-change:\s*transform/);
  });

  it("states the lead frontend positioning, which is the job the page is for", () => {
    renderPage();
    expect(screen.getByText(/Lead Frontend Developer/i)).toBeInTheDocument();
  });

  it("renders a main landmark, since layout.tsx only supplies the skip target", () => {
    renderPage();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("pins the header to the top of the viewport with its own surface", () => {
    // The settings, theme and auth controls live in this bar, and the ask is
    // that they stay reachable mid-page. Sticky needs a backdrop or the bar
    // collides with the proof figures the moment the page scrolls.
    renderPage();
    const banner = screen.getByRole("banner");
    expect(banner.className).toContain("sticky");
    expect(banner.className).toContain("top-0");
    expect(banner.className).toContain("backdrop-blur");
  });

  it("shows the first tagline by default and the indexed one when told", () => {
    const { unmount } = renderPage();
    expect(screen.getByText(HERO_TAGLINES[0])).toBeInTheDocument();
    unmount();

    renderPage({ taglineIndex: 2 });
    expect(screen.getByText(HERO_TAGLINES[2])).toBeInTheDocument();
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

  it("counts the traits in copy instead of hardcoding the word ten", () => {
    renderPage();
    expect(
      screen.getByText(new RegExp(`${CRAFT_TRAITS.length} traits`)),
    ).toBeInTheDocument();
  });

  it("gives evidence chips a thumb-sized touch target by default", () => {
    // Mobile-first: the chips are the most important links on the page and
    // 26px tall is stingy under a thumb. Desktop tightens back up at sm.
    renderPage();
    const chip = screen.getAllByRole("link", { name: "Web Vitals" })[0];
    expect(chip.className).toContain("py-2");
    expect(chip.className).toContain("sm:py-1");
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
    // The server HTML is the signal that matters here. AnimatedNumber counts up
    // from zero once the strip scrolls into view, so a client render mid-count
    // says nothing; what a crawler and a reader without JS get is the figure in
    // the markup. Asserting against the import is what makes a stale hardcoded
    // number fail, since the generated count moves on every build.
    const html = renderToStaticMarkup(<Proof />);
    expect(html).toContain(TEST_COUNT.toLocaleString("en-US"));
  });

  it("counts the features and write-ups it has rather than typing a number", () => {
    const html = renderToStaticMarkup(<Proof />);
    expect(html).toContain(`>${FEATURES.length}<`);
    expect(html).toContain(`>${THOUGHTS.length}<`);
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

  it("features the six curated apps in order of what they prove", () => {
    // The order is the argument: professional work first, then the number that
    // keeps it honest, then the system, the console, the release tooling, and
    // the showpiece to close. Learn is a fine feature and a weak pitch.
    renderPage();
    const work = document.getElementById("work");
    expect(work).not.toBeNull();
    const titles = within(work as HTMLElement)
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    const expected = [
      "work-portfolio",
      "vitals",
      "design-system",
      "operator",
      "flags",
      "world",
    ].map((id) => FEATURES.find((f) => f.id === id)?.title);
    expect(titles).toEqual(expected);
  });

  it("renders exactly the write-ups it is handed, all from the pool", () => {
    const picks = WRITING_POOL.slice(2, 6).map((p) => p.href);
    renderPage({ writingPicks: picks });
    const writing = document.getElementById("writing");
    const rendered = within(writing as HTMLElement)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"))
      .filter((href) => href?.startsWith("/thoughts/"));
    expect(rendered).toEqual(picks);
  });

  it("teases five pool write-ups when nobody picked, never a broken slug", () => {
    renderPage();
    const writing = document.getElementById("writing");
    const rendered = within(writing as HTMLElement)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"))
      .filter((href) => href?.startsWith("/thoughts/"));
    expect(rendered).toHaveLength(5);
    for (const href of rendered) {
      expect(THOUGHTS.some((t) => t.href === href)).toBe(true);
      expect(WRITING_POOL.some((p) => p.href === href)).toBe(true);
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

  it("keeps the signed-in state to the header instead of a second bar", async () => {
    // The account strip under the hero duplicated the header menu and pushed
    // the pitch down. Signed-in now only changes the header CTA; the personal
    // routes live in the menu where they already were. The page learns the
    // session from /api/me (it renders statically with no auth props), so the
    // signed-in state is driven through the network here.
    server.use(
      http.get("/api/me", () => HttpResponse.json({ sub: "auth0|paul" })),
    );
    renderPage();
    expect(
      await screen.findByRole("link", { name: /log out/i }),
    ).toHaveAttribute("href", "/auth/logout");
    expect(screen.queryByText(/Back again/)).not.toBeInTheDocument();
    expect(hrefs()).not.toContain("/to-do");
  });

  it("has no axe violations as a guest", async () => {
    const { container } = renderPage();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations signed in", async () => {
    server.use(
      http.get("/api/me", () => HttpResponse.json({ sub: "auth0|paul" })),
    );
    const { container } = renderPage();
    // Wait for the header CTA to settle in the signed-in state before scanning,
    // so axe sees the page a signed-in visitor actually gets.
    await screen.findByRole("link", { name: /log out/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
