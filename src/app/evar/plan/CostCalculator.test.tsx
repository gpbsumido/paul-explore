import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import type { ReactElement } from "react";
import CostCalculator from "./CostCalculator";
import { ResidentTimeProvider } from "./ResidentTime";

/** The calculator with the resident's time counted, the way the page shows it once the switch is on. */
const counted = (ui: ReactElement) => render(<ResidentTimeProvider initiallyOn>{ui}</ResidentTimeProvider>);
const slider = (name: RegExp) => screen.getByRole("slider", { name });
const move = (name: RegExp, value: number) => fireEvent.change(slider(name), { target: { value: String(value) } });
const toTop = (name: RegExp) => fireEvent.change(slider(name), { target: { value: slider(name).getAttribute("max") } });
const total = () => screen.getByRole("status");
const row = (name: RegExp) =>
  within(screen.getByRole("table", { name: /what the total is made of/i })).getByRole("row", { name });

describe("CostCalculator", () => {
  it("leaves the resident's time out until the switch counts it", () => {
    render(<CostCalculator />);
    expect(screen.getAllByRole("slider")).toHaveLength(4);
    expect(screen.queryByRole("slider", { name: /resident's rate/i })).toBeNull();
    expect(total()).toHaveTextContent("$108.83");
    expect(within(screen.getByRole("table", { name: /what the total is made of/i })).queryByRole("row", { name: /^a resident's time/i })).toBeNull();
  });

  it("says the domain line depends on the name chosen", () => {
    render(<CostCalculator />);
    expect(row(/domain/i)).toHaveTextContent(/regular \.com/i);
    expect(row(/domain/i)).toHaveTextContent(/other names and endings cost more or less/i);
  });

  it("opens on the middle case for a year", () => {
    counted(<CostCalculator />);
    expect(total()).toHaveTextContent("$1,358.83");
    expect(total()).toHaveTextContent(/1 year/);
    expect(row(/my fee/i)).toHaveTextContent("$9.89");
    expect(row(/my fee/i)).toHaveTextContent(/upkeep, new scans and admin access/i);
    expect(row(/^a resident's time/i)).toHaveTextContent("$1,250.00");
    expect(row(/railway/i)).toHaveTextContent("$84.00");
    expect(row(/domain/i)).toHaveTextContent("$14.64");
  });

  it("shows the biggest case with every usage slider at the top", () => {
    counted(<CostCalculator />);
    toTop(/scans in the library/i);
    toTop(/people a day/i);
    toTop(/scans each a day/i);
    toTop(/how long/i);
    expect(total()).toHaveTextContent("$13,281.57");
    expect(total()).toHaveTextContent(/2 years/);
    expect(row(/cloudfront/i)).toHaveTextContent("$503.76");
    expect(screen.getByText(/300,000 scan opens a month/i)).toBeInTheDocument();
  });

  it("moves only the resident's line with the rate and the minutes", () => {
    counted(<CostCalculator />);
    move(/resident's rate/i, 100);
    expect(row(/^a resident's time/i)).toHaveTextContent("$2,500.00");
    expect(row(/railway/i)).toHaveTextContent("$84.00");
    expect(total()).toHaveTextContent("$2,608.83");
    move(/minutes a scan/i, 30);
    expect(row(/^a resident's time/i)).toHaveTextContent("$5,000.00");
  });

  it("steps the library in tens up to 100, then in bigger steps to 1,000", () => {
    counted(<CostCalculator />);
    const scans = slider(/scans in the library/i);
    const at = (position: number) => {
      fireEvent.change(scans, { target: { value: String(position) } });
      return scans.getAttribute("aria-valuetext");
    };
    expect(at(0)).toBe("10 scans");
    expect(at(4)).toBe("50 scans");
    expect(at(9)).toBe("100 scans");
    // Ten stops for the first hundred, so 10 and 50 aren't a few pixels apart.
    expect(Number(scans.getAttribute("max"))).toBeLessThan(30);
    expect(at(Number(scans.getAttribute("max")))).toBe("1,000 scans");
  });

  it("labels every slider and says its value in words", () => {
    counted(<CostCalculator />);
    expect(screen.getAllByRole("slider")).toHaveLength(6);
    expect(slider(/scans in the library/i)).toHaveAttribute("aria-valuetext", "100 scans");
    expect(slider(/people a day/i)).toHaveAttribute("aria-valuetext", "50 people a day");
    expect(slider(/resident's rate/i)).toHaveAttribute("aria-valuetext", "$50 an hour");
    expect(slider(/how long/i)).toHaveAttribute("aria-valuetext", "1 year");
    move(/how long/i, 18);
    expect(slider(/how long/i)).toHaveAttribute("aria-valuetext", "1 year and 6 months");
    move(/how long/i, 1);
    expect(slider(/how long/i)).toHaveAttribute("aria-valuetext", "1 month");
  });

  it("puts the total in an output, so a change is announced without moving focus", () => {
    counted(<CostCalculator />);
    expect(total().tagName).toBe("OUTPUT");
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = counted(<CostCalculator />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
