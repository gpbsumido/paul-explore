import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DesignSystemChartsContent from "./DesignSystemChartsContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("DesignSystemChartsContent", () => {
  it("renders the write-up heading", () => {
    render(<DesignSystemChartsContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /framework-agnostic charts/i,
      }),
    ).toBeInTheDocument();
  });

  it("names the three chart primitives and the shared geometry core", () => {
    render(<DesignSystemChartsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/chartGeometry/);
    expect(body).toMatch(/Sparkline/);
    expect(body).toMatch(/BarChart/);
    expect(body).toMatch(/DonutChart/);
  });

  it("explains why recharts and unovis could not be reused", () => {
    render(<DesignSystemChartsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/recharts/);
    expect(body).toMatch(/unovis/i);
    // Pure SVG is the reason both frameworks can render identical output.
    expect(body).toMatch(/SVG/);
  });

  it("records the accessibility contract every chart holds to", () => {
    render(<DesignSystemChartsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/role="img"/);
    expect(body).toMatch(/axe/i);
  });

  it("cites the green test counts that back the work", () => {
    render(<DesignSystemChartsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/184/);
    expect(body).toMatch(/20/);
  });

  it("is listed in the thoughts data and sorted into Design & UI", () => {
    const thought = THOUGHTS.find(
      (t) => t.href === "/thoughts/design-system-charts",
    );
    expect(thought).toBeDefined();
    const grouped = groupThoughts(THOUGHTS);
    const category = grouped.find((g) =>
      g.items.some((t) => t.href === "/thoughts/design-system-charts"),
    );
    expect(category?.name).toBe("Design & UI");
  });

  it("does not leave shipped work described as deferred", () => {
    render(<DesignSystemChartsContent />);
    const body = document.body.textContent ?? "";
    // The deferral list is period-accurate and stays, but the page must not
    // assert in the present tense that the package still lacks TestBed.
    expect(body).toMatch(/All of that has since landed/);
    expect(body).not.toMatch(/has no TestBed infrastructure yet/);
  });

  it("records the bug the deferred tests were hiding", () => {
    render(<DesignSystemChartsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /raw\s+decorators with no compiled component definitions/,
    );
    expect(body).toMatch(
      /it is the class of bug you left yourself\s+unable to see/,
    );
  });
});
