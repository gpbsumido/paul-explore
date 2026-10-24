import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
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

  it("prints the range for every length of time asked about, without the resident's time at first", () => {
    render(<PlanContent />);
    const range = screen.getByRole("table", { name: /the range/i });
    const expected = [
      ["3 months", "$35.65", "$35.71", "$99.35"],
      ["6 months", "$56.65", "$56.79", "$184.06"],
      ["1 year", "$98.67", "$98.94", "$353.48"],
      ["2 years", "$197.34", "$197.87", "$710.52"],
    ];
    for (const [period, ...totals] of expected) {
      const row = within(range).getByRole("row", { name: new RegExp(`^${period}`) });
      for (const t of totals) expect(row).toHaveTextContent(t);
    }
  });

  it("counts a resident's time once the switch is on, everywhere it applies", () => {
    render(<PlanContent />);
    const toggle = screen.getByRole("switch", { name: /count a resident's time/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");

    const range = screen.getByRole("table", { name: /the range/i });
    expect(within(range).getByRole("row", { name: /^1 year/ })).toHaveTextContent("$1,348.94");
    expect(within(range).getByRole("row", { name: /^2 years/ })).toHaveTextContent("$13,210.52");
    const library = screen.getByRole("table", { name: /library/i });
    expect(within(library).getByRole("row", { name: /^1,000/ })).toHaveTextContent("$12,500.00");
    expect(screen.getByRole("slider", { name: /resident's rate/i })).toBeInTheDocument();
  });

  it("prints the library and usage tables at the steps asked about", () => {
    render(<PlanContent />);
    const library = screen.getByRole("table", { name: /library/i });
    for (const scans of ["10", "50", "100", "500", "1,000"]) {
      expect(within(library).getByRole("rowheader", { name: scans })).toBeInTheDocument();
    }
    expect(within(library).getByRole("row", { name: /^1,000/ })).toHaveTextContent("$2.96");
    expect(within(library).queryByRole("columnheader", { name: /resident/i })).toBeNull();

    const usage = screen.getByRole("table", { name: /people a day/i });
    for (const people of ["10", "50", "100"]) {
      expect(within(usage).getByRole("rowheader", { name: `${people} people a day` })).toBeInTheDocument();
    }
    for (const each of ["10", "30", "50", "100"]) {
      expect(within(usage).getByRole("columnheader", { name: `${each} scans each` })).toBeInTheDocument();
    }
    expect(within(usage).getByRole("row", { name: /^100 people a day/ })).toHaveTextContent("$20.99");
  });

  it("warns that the domain's cost depends on the name chosen", () => {
    render(<PlanContent />);
    const domain = screen.getByRole("region", { name: /a domain of its own/i });
    expect(domain).toHaveTextContent(/depends on the name/i);
    expect(domain).toHaveTextContent(/premium/i);
    expect(domain).toHaveTextContent(/renewal/i);
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
