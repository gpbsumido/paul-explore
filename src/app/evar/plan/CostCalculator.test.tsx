import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import CostCalculator from "./CostCalculator";

const slider = (name: RegExp) => screen.getByRole("slider", { name });
const move = (name: RegExp, value: number) => fireEvent.change(slider(name), { target: { value: String(value) } });
const total = () => screen.getByRole("status");
const row = (name: RegExp) =>
  within(screen.getByRole("table", { name: /what the total is made of/i })).getByRole("row", { name });

describe("CostCalculator", () => {
  it("opens on the middle case for a year", () => {
    render(<CostCalculator />);
    expect(total()).toHaveTextContent("$1,348.94");
    expect(total()).toHaveTextContent(/1 year/);
    expect(row(/resident/i)).toHaveTextContent("$1,250.00");
    expect(row(/railway/i)).toHaveTextContent("$84.00");
    expect(row(/domain/i)).toHaveTextContent("$14.64");
  });

  it("shows the biggest case with every usage slider at the top", () => {
    render(<CostCalculator />);
    move(/scans in the library/i, 1000);
    move(/people a day/i, 100);
    move(/scans each a day/i, 100);
    move(/how long/i, 24);
    expect(total()).toHaveTextContent("$13,210.52");
    expect(total()).toHaveTextContent(/2 years/);
    expect(row(/cloudfront/i)).toHaveTextContent("$503.76");
    expect(screen.getByText(/300,000 scan opens a month/i)).toBeInTheDocument();
  });

  it("moves only the resident's line with the rate and the minutes", () => {
    render(<CostCalculator />);
    move(/resident's rate/i, 100);
    expect(row(/resident/i)).toHaveTextContent("$2,500.00");
    expect(row(/railway/i)).toHaveTextContent("$84.00");
    expect(total()).toHaveTextContent("$2,598.94");
    move(/minutes a scan/i, 30);
    expect(row(/resident/i)).toHaveTextContent("$5,000.00");
  });

  it("labels every slider and says its value in words", () => {
    render(<CostCalculator />);
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
    render(<CostCalculator />);
    expect(total().tagName).toBe("OUTPUT");
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = render(<CostCalculator />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
