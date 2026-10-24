import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import PlanContent from "./PlanContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("PlanContent", () => {
  it("says what EVAR Sizing is for before any numbers, and links to the practice", () => {
    render(<PlanContent />);
    expect(screen.getByRole("heading", { level: 1, name: /the plan for evar sizing/i })).toBeInTheDocument();
    const aims = screen.getByRole("heading", { level: 2, name: /what i.m trying to do/i });
    const costs = screen.getByRole("heading", { level: 2, name: /what it costs/i });
    expect(aims.compareDocumentPosition(costs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(/stent graft/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === "/evar")).toBe(true);
  });

  it("says the prices are Canadian dollars, at which rate, on which date", () => {
    render(<PlanContent />);
    expect(screen.getAllByText(/canadian dollars/i).length).toBeGreaterThan(0);
    expect(document.body).toHaveTextContent("US$1 = $1.3993");
    expect(document.body).toHaveTextContent("October 23, 2026");
  });

  it("prints the range for every length of time asked about", () => {
    render(<PlanContent />);
    const range = screen.getByRole("table", { name: /the range/i });
    const expected = [
      ["3 months", "$160.65", "$1,285.71", "$12,599.35"],
      ["6 months", "$181.65", "$1,306.79", "$12,684.06"],
      ["1 year", "$223.67", "$1,348.94", "$12,853.48"],
      ["2 years", "$322.34", "$1,447.87", "$13,210.52"],
    ];
    for (const [period, ...totals] of expected) {
      const row = within(range).getByRole("row", { name: new RegExp(`^${period}`) });
      for (const t of totals) expect(row).toHaveTextContent(t);
    }
  });

  it("prints the library and usage tables at the steps asked about", () => {
    render(<PlanContent />);
    const library = screen.getByRole("table", { name: /library/i });
    for (const scans of ["10", "50", "100", "500", "1,000"]) {
      expect(within(library).getByRole("rowheader", { name: scans })).toBeInTheDocument();
    }
    expect(within(library).getByRole("row", { name: /^1,000/ })).toHaveTextContent("$12,500.00");

    const usage = screen.getByRole("table", { name: /people a day/i });
    for (const people of ["10", "50", "100"]) {
      expect(within(usage).getByRole("rowheader", { name: `${people} people a day` })).toBeInTheDocument();
    }
    for (const each of ["10", "30", "50", "100"]) {
      expect(within(usage).getByRole("columnheader", { name: `${each} scans each` })).toBeInTheDocument();
    }
    expect(within(usage).getByRole("row", { name: /^100 people a day/ })).toHaveTextContent("$20.99");
  });

  it("captions every table", () => {
    render(<PlanContent />);
    const tables = screen.getAllByRole("table");
    expect(tables.length).toBeGreaterThanOrEqual(6);
    for (const table of tables) expect(table.querySelector("caption")?.textContent?.trim()).toBeTruthy();
  });

  it("uses no em or en dashes anywhere in its text", () => {
    const { container } = render(<PlanContent />);
    expect(container.textContent).not.toMatch(/[–—]/);
  });

  it("lists its sources as links", () => {
    render(<PlanContent />);
    const links = within(screen.getByRole("list", { name: /sources/i })).getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(10);
    expect(links.some((a) => a.getAttribute("href")?.startsWith("https://www.bankofcanada.ca/"))).toBe(true);
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = render(<PlanContent />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
