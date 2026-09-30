import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import WorkPortfolioThoughtsContent from "./WorkPortfolioThoughtsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

/**
 * The counts come down as props from the server page, so what is worth
 * checking is that they reach the reader.
 *
 * Rendering with deliberately wrong numbers is the half that matters. Passing
 * the real ones and asserting they appear would pass just as happily against
 * the hardcoded prose this replaced, which is the whole bug.
 */
const textOf = (element: HTMLElement): string =>
  (element.textContent ?? "").replace(/\s+/g, " ");

describe("WorkPortfolioThoughtsContent", () => {
  it("shows the counts it is given, not ones of its own", () => {
    const { container } = render(
      <WorkPortfolioThoughtsContent counts={{ features: 7, projects: 3 }} />,
    );
    const text = textOf(container);

    expect(text).toContain("7 feature demos drawn from 3 projects");
    expect(text).toContain("turned 3 old jobs into a single interactive page");
    expect(text).toContain("never all 7 at once");
  });

  it("keeps the launch figures literal, because they are history", () => {
    const { container } = render(
      <WorkPortfolioThoughtsContent counts={{ features: 7, projects: 3 }} />,
    );

    expect(textOf(container)).toContain("It launched with 24 across 11");
  });

  it("reads without numbers when the catalog couldn't be fetched", () => {
    // The counts come from the remote's catalog.json now. If that fetch fails
    // the page still renders, just without figures it can't vouch for.
    const { container } = render(<WorkPortfolioThoughtsContent counts={null} />);
    const text = textOf(container);

    expect(text).toContain("feature demos drawn from past projects");
    expect(text).toContain("turned my old jobs into a single interactive page");
    expect(text).toContain("never all of them at once");
    expect(text).not.toMatch(/\bundefined\b|\bNaN\b/);
  });
});
