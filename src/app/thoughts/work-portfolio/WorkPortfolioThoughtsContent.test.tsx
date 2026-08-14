import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { PROJECTS, FEATURES } from "@/app/work-portfolio/_data/catalog";
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
      <WorkPortfolioThoughtsContent featureCount={7} projectCount={3} />,
    );
    const text = textOf(container);

    expect(text).toContain("7 feature demos drawn from 3 projects");
    expect(text).toContain("turned 3 old jobs into a single interactive page");
    expect(text).toContain("never all 7 at once");
  });

  it("keeps the launch figures literal, because they are history", () => {
    const { container } = render(
      <WorkPortfolioThoughtsContent featureCount={7} projectCount={3} />,
    );

    expect(textOf(container)).toContain("It launched with 24 across 11");
  });

  it("states the real catalog size when handed it", () => {
    const { container } = render(
      <WorkPortfolioThoughtsContent
        featureCount={FEATURES.length}
        projectCount={PROJECTS.length}
      />,
    );

    expect(textOf(container)).toContain(
      `${FEATURES.length} feature demos drawn from ${PROJECTS.length} projects`,
    );
  });
});
