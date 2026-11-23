import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FEATURES, THOUGHTS } from "@/app/_shared/featureData.data";
import { TEST_COUNT } from "@/app/_shared/testCount.generated";
import { STACK } from "../v6/stack";
import { WORK, EDUCATION } from "../v6/experience";
import { featureFor } from "../v6/picks";
import LandingContentV7 from "./LandingContentV7";
import { WORK_PICK_IDS, editorWorkLinks } from "./picks";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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
afterEach(() => vi.restoreAllMocks());

function renderLanding() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LandingContentV7 />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("the v7 landing", () => {
  it("has one header whose links jump to each part of the page", () => {
    renderLanding();
    const banner = screen.getByRole("banner");
    expect(within(banner).getByRole("link", { name: "Work" })).toHaveAttribute("href", "#work");
    expect(within(banner).getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");
    expect(within(banner).getByRole("link", { name: "Writing" })).toHaveAttribute("href", "/thoughts");
    expect(within(banner).getByRole("link", { name: "Contact" })).toHaveAttribute("href", "#contact");
  });

  it("leads with one headline, the editor panel and the resume", () => {
    renderLanding();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Ideas into interfaces.");
    expect(screen.getByRole("figure", { name: /typescript/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Resume/ })).toHaveAttribute("href", "/resume");
  });

  it("opens work.ts in the editor and links each project in it", async () => {
    const user = userEvent.setup();
    renderLanding();
    const editor = screen.getByRole("figure", { name: /typescript/i });
    const workTab = within(editor).getByRole("tab", { name: "work.ts" });
    expect(workTab).toHaveAttribute("aria-selected", "false");

    await user.click(workTab);

    expect(workTab).toHaveAttribute("aria-selected", "true");
    const panel = within(editor).getByRole("tabpanel", { name: "work.ts" });
    for (const { title, href, note } of editorWorkLinks()) {
      const link = within(panel).getByRole("link", { name: title });
      expect(link).toHaveAttribute("href", href);
      expect(link.closest("span[style]")).toHaveTextContent(`// ${note}`);
    }
  });

  it("moves between editor files with the arrow keys", async () => {
    const user = userEvent.setup();
    renderLanding();
    const editor = screen.getByRole("figure", { name: /typescript/i });
    const paulTab = within(editor).getByRole("tab", { name: "paul.ts" });
    expect(paulTab).toHaveAttribute("aria-selected", "true");

    paulTab.focus();
    await user.keyboard("{ArrowRight}");

    const workTab = within(editor).getByRole("tab", { name: "work.ts" });
    expect(workTab).toHaveFocus();
    expect(workTab).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(paulTab).toHaveFocus();
  });

  it("names every package in the stack marquee for screen readers", () => {
    renderLanding();
    const summary = screen.getByText(/^Built with/);
    for (const { label } of STACK) {
      expect(summary).toHaveTextContent(label);
    }
  });

  it("links each work tile to its app and counts every place to go", () => {
    renderLanding();
    const work = screen.getByRole("region", { name: /pick a rabbit hole/i });
    for (const id of WORK_PICK_IDS) {
      const feature = featureFor(id);
      expect(within(work).getByRole("link", { name: new RegExp(feature.title) })).toHaveAttribute("href", feature.href);
    }
    expect(within(work).getByText(String(FEATURES.length))).toBeInTheDocument();
  });

  it("lists every role and the degree on the timeline", () => {
    renderLanding();
    const about = screen.getByRole("region", { name: /web apps/i });
    for (const entry of [...WORK, ...EDUCATION]) {
      expect(within(about).getByRole("heading", { name: entry.title })).toBeInTheDocument();
    }
  });

  it("reads its figures from the build, not from typed-in numbers", () => {
    renderLanding();
    const proof = screen.getByRole("region", { name: /playful on the outside/i });
    expect(within(proof).getByText(TEST_COUNT.toLocaleString("en-US"))).toBeInTheDocument();
    expect(within(proof).getByText(String(FEATURES.length))).toBeInTheDocument();
    expect(within(proof).getByText(String(THOUGHTS.length))).toBeInTheDocument();
  });

  it("ends with a way to get in touch", () => {
    renderLanding();
    const contact = screen.getByRole("region", { name: /hiring a frontend dev/i });
    expect(within(contact).getByRole("link", { name: /Email me/ }).getAttribute("href")).toMatch(/^mailto:psumido@gmail\.com/);
    expect(within(contact).getByRole("link", { name: /Book a 30-min call/ })).toHaveAttribute("href", "https://calendly.com/psumido/30min");
  });

  it("keeps the old editions out of the footer", () => {
    renderLanding();
    const footer = screen.getByRole("contentinfo");
    const hrefs = within(footer).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs.some((href) => href?.startsWith("/discover"))).toBe(false);
  });
});
