import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import VitalsContent from "./VitalsContent";
import type { PageVitals, VersionMetrics } from "@/types/vitals";

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
