import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "@/test/a11y";
import VitalsContent from "./VitalsContent";
import type {
  MetricName,
  MetricSummary,
  PageVitals,
  VersionMetrics,
} from "@/types/vitals";

// The header pulls in the session menu and its providers, which none of these
// assertions are about. Same stub the other content tests use.
vi.mock("@/components/PageHeader", () => ({ default: () => null }));

/** Props for a dashboard the backend answered normally. */
function reachableProps(overrides: Partial<Parameters<typeof VitalsContent>[0]> = {}) {
  return {
    summary: {},
    byPage: [] as PageVitals[],
    versions: [] as string[],
    selectedVersion: "",
    byVersion: [] as VersionMetrics[],
    ...overrides,
  };
}

describe("VitalsContent when the backend is unreachable", () => {
  it("says the API could not be reached instead of showing an empty dashboard", () => {
    render(<VitalsContent {...reachableProps({ unreachable: true })} />);

    expect(
      screen.getByText(/couldn't reach the vitals api/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/visit a few pages and check back/i)).toBeNull();
    expect(screen.queryAllByText("No data yet")).toEqual([]);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("announces the outage to screen readers rather than a version filter", () => {
    render(
      <VitalsContent
        {...reachableProps({ unreachable: true, selectedVersion: "major:0" })}
      />,
    );

    expect(screen.queryByText(/showing web vitals for version/i)).toBeNull();
    expect(
      screen.getByText("Web Vitals are unavailable right now"),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <VitalsContent {...reachableProps({ unreachable: true })} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  }, 30000);
});

describe("VitalsContent when the backend answers with no data", () => {
  it("keeps the empty state, which is a different thing from an outage", () => {
    render(<VitalsContent {...reachableProps()} />);

    expect(
      screen.getByText(/visit a few pages and check back/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/couldn't reach the vitals api/i)).toBeNull();
  });

  it("still renders the by-page table when there are rows", () => {
    const row: PageVitals = {
      page: "/vitals",
      total: 12,
      metrics: { LCP: { p75: 1200, count: 12 } },
    };

    render(<VitalsContent {...reachableProps({ byPage: [row] })} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText(/couldn't reach the vitals api/i)).toBeNull();
  });
});

/** A summary entry with only the fields the card reads filled in sensibly. */
const summaryOf = (p75: number, total = 10): MetricSummary => ({
  p75,
  total,
  good: 0,
  needsImprovement: 0,
  poor: 0,
});

/** The card for one metric, found inside the summary strip so the improvement notes cannot answer for it. */
const cardFor = (metric: MetricName): HTMLElement => {
  const strip = document.getElementById("vitals-summary-cards") as HTMLElement;
  const card = within(strip).getByText(metric).closest(".glass-card");
  if (!(card instanceof HTMLElement)) throw new Error(`no card for ${metric}`);
  return card;
};

describe("VitalsContent summary cards", () => {
  it.each([
    ["LCP", 2500, "Good", "2.5s"],
    ["LCP", 2501, "Needs work", "2.5s"],
    ["LCP", 4000, "Needs work", "4.0s"],
    ["LCP", 4001, "Poor", "4.0s"],
    ["INP", 200, "Good", "200ms"],
    ["INP", 501, "Poor", "501ms"],
    ["CLS", 0.1, "Good", "0.100"],
    ["CLS", 0.26, "Poor", "0.260"],
  ] as const)(
    "rates %s at %s as %s and shows %s",
    (metric, p75, rating, shown) => {
      render(
        <VitalsContent
          {...reachableProps({ summary: { [metric]: summaryOf(p75) } })}
        />,
      );

      const card = within(cardFor(metric));
      expect(card.getByText(rating)).toBeInTheDocument();
      expect(card.getByText(shown)).toBeInTheDocument();
    },
  );

  it("shows a dash and no rating for a metric nobody has reported", () => {
    render(
      <VitalsContent
        {...reachableProps({ summary: { LCP: summaryOf(1000) } })}
      />,
    );

    const fcp = within(cardFor("FCP"));
    expect(fcp.getByText("--")).toBeInTheDocument();
    expect(fcp.getByText("No data yet")).toBeInTheDocument();
    expect(fcp.queryByText(/^(Good|Needs work|Poor)$/)).toBeNull();
  });

  it("counts samples in the local number format, and says sample for exactly one", () => {
    render(
      <VitalsContent
        {...reachableProps({
          summary: { LCP: summaryOf(1000, 1), FCP: summaryOf(1000, 1234) },
        })}
      />,
    );

    expect(within(cardFor("LCP")).getByText("P75 · 1 sample")).toBeInTheDocument();
    expect(within(cardFor("FCP")).getByText(`P75 · ${(1234).toLocaleString()} samples`)).toBeInTheDocument();
  });
});

describe("VitalsContent by-page table", () => {
  const row: PageVitals = {
    page: "/thoughts",
    total: 2048,
    metrics: {
      LCP: { p75: 1200, count: 30 },
      INP: { p75: 900, count: 30 },
    },
  };

  it("lists the page, its measured values, a dash for the rest, and its sample total", () => {
    render(<VitalsContent {...reachableProps({ byPage: [row] })} />);

    const tableRow = within(
      screen.getByRole("row", { name: /\/thoughts/ }),
    );
    expect(tableRow.getByText("1.2s")).toBeInTheDocument();
    expect(tableRow.getByText("900ms")).toBeInTheDocument();
    // FCP, CLS and TTFB were never reported for this page.
    expect(tableRow.getAllByText("--")).toHaveLength(3);
    expect(tableRow.getByText((2048).toLocaleString())).toBeInTheDocument();
  });

  it("colours a cell by its rating, so a poor score does not read as a good one", () => {
    render(<VitalsContent {...reachableProps({ byPage: [row] })} />);

    const tableRow = within(
      screen.getByRole("row", { name: /\/thoughts/ }),
    );
    expect(tableRow.getByText("1.2s").className).toContain("text-success");
    expect(tableRow.getByText("900ms").className).toContain("text-error");
  });
});

describe("VitalsContent version scope and trend", () => {
  const version = (name: string): VersionMetrics => ({
    version: name,
    metrics: { LCP: { p75: 1500, total: 20 } },
  });

  it("shows the trend only once there are two versions to compare", () => {
    const { unmount } = render(
      <VitalsContent {...reachableProps({ byVersion: [version("4.5.8")] })} />,
    );
    expect(screen.queryByText("Trend across versions")).toBeNull();
    unmount();

    render(
      <VitalsContent
        {...reachableProps({ byVersion: [version("4.5.8"), version("4.5.9")] })}
      />,
    );
    expect(screen.getByText("Trend across versions")).toBeInTheDocument();
  });

  it("announces which version the numbers are for, or all of them", () => {
    const { unmount } = render(
      <VitalsContent {...reachableProps({ selectedVersion: "major:4" })} />,
    );
    expect(
      screen.getByText("Showing Web Vitals for version major:4"),
    ).toBeInTheDocument();
    unmount();

    render(<VitalsContent {...reachableProps()} />);
    expect(
      screen.getByText("Showing Web Vitals for all versions"),
    ).toBeInTheDocument();
  });
});

describe("VitalsContent guided tour", () => {
  beforeEach(() => window.localStorage.clear());

  it("exposes a Take the tour button and the anchors it points at", () => {
    window.localStorage.setItem("vitals-tour-seen", "true");
    render(<VitalsContent {...reachableProps()} />);
    expect(
      screen.getByRole("button", { name: /take the tour/i }),
    ).toBeInTheDocument();
    expect(document.getElementById("vitals-heading")).not.toBeNull();
    expect(document.getElementById("vitals-summary-cards")).not.toBeNull();
    expect(document.getElementById("vitals-improvements")).not.toBeNull();
  });

  it("opens the tour and walks into it", () => {
    window.localStorage.setItem("vitals-tour-seen", "true");
    render(<VitalsContent {...reachableProps()} />);
    fireEvent.click(screen.getByRole("button", { name: /take the tour/i }));
    const tour = () => screen.getByRole("dialog", { name: /tour/i });
    fireEvent.click(
      within(tour()).getByRole("button", { name: /^next$/i }),
    );
    expect(within(tour()).getByText(/real-user vitals/i)).toBeInTheDocument();
  });
});
