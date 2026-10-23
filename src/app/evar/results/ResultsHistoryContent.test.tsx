import { describe, it, expect, vi, afterEach } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import ResultsHistoryContent from "./ResultsHistoryContent";
import { recordAttempt, type HistoryEntry } from "@/lib/evar/history";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

/** The page names real scans from the manifest, which it fetches through react-query. */
const render = (ui: ReactElement) =>
  rtlRender(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

afterEach(() => {
  window.localStorage.clear();
});

const entry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: "a1",
  levelId: "medium",
  caseId: "long-neck",
  finishedAt: Date.UTC(2026, 9, 23, 9, 0),
  within: 4,
  stars: 2,
  total: 600,
  timedOut: false,
  deltas: {},
  ...overrides,
});

describe("ResultsHistoryContent", () => {
  it("says there's nothing yet and links back to the practice", () => {
    render(<ResultsHistoryContent />);
    expect(screen.getByRole("heading", { level: 1, name: /your evar results/i })).toBeInTheDocument();
    expect(screen.getByText(/haven.t finished a case on this device/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to the practice/i })).toHaveAttribute("href", "/evar");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("sums up each level played and lists every attempt", () => {
    recordAttempt(entry({ id: "1", levelId: "medium", within: 3, total: 400 }));
    recordAttempt(entry({ id: "2", levelId: "medium", within: 5, stars: 3, total: 900 }));
    recordAttempt(entry({ id: "3", levelId: "hard", caseId: "hostile-neck", within: 2, stars: 0, total: 250, timedOut: true }));
    render(<ResultsHistoryContent />);

    const medium = screen.getByRole("region", { name: /medium/i });
    expect(within(medium).getByText("2")).toBeInTheDocument();
    expect(within(medium).getByText("4.0 of 5")).toBeInTheDocument();
    expect(within(medium).getByText("900")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /easy/i })).toBeNull();

    const table = screen.getByRole("table", { name: /every attempt/i });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent(/hostile neck/i);
    expect(rows[0]).toHaveTextContent(/timed out/i);
    expect(rows[2]).toHaveTextContent(/long straight neck/i);
  });

  it("names a real scan by its title, not its id", async () => {
    recordAttempt(entry({ id: "r6", caseId: "avt-r6" }));
    render(<ResultsHistoryContent />);
    expect(await screen.findByText(/real ct: aneurysm with thrombus/i)).toBeInTheDocument();
    expect(screen.queryByText("avt-r6")).toBeNull();
  });

  it("describes the chart, and leaves the numbers to the table", () => {
    recordAttempt(entry({ id: "1" }));
    recordAttempt(entry({ id: "2" }));
    render(<ResultsHistoryContent />);
    const figure = screen.getByRole("figure", { name: /within tolerance over time/i });
    expect(figure).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    recordAttempt(entry({ id: "1" }));
    recordAttempt(entry({ id: "2" }));
    const { container } = render(<ResultsHistoryContent />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
