import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import WorkPortfolioContent from "../WorkPortfolioContent";
import RealtimeMetricsDemo from "../demos/realtime-metrics";
import ComingSoonDemo from "../demos/ComingSoonDemo";
import DemoStage from "../DemoStage";
import { FEATURES, PROJECTS, projectFor, featureIndexBySlug } from "../_data/catalog";

beforeEach(() => window.history.replaceState(null, "", "/work-portfolio"));
afterEach(() => vi.useRealTimers());

describe("demo stage", () => {
  it("the coming-soon placeholder renders for unwired features", () => {
    // decoupled from which slugs are wired, tests the placeholder itself
    render(<ComingSoonDemo feature={FEATURES[0]} />);
    expect(screen.getByText("Demo in progress")).toBeInTheDocument();
  });

  it("the reference demo is wired through the registry", async () => {
    window.history.replaceState(
      null,
      "",
      "/work-portfolio?feature=realtime-metrics",
    );
    render(<WorkPortfolioContent />);
    // next/dynamic resolves async, so wait for the real demo
    expect(await screen.findByTestId("signup-count")).toBeInTheDocument();
  });

  it("the stage surface carries the project accent theme", () => {
    const feature = FEATURES[featureIndexBySlug("streaming-ops")!];
    const project = projectFor(feature);
    render(<DemoStage feature={feature} project={project} />);
    const stage = screen.getByTestId("demo-stage");
    // ops console is the mono-flavored project
    expect(project.accent.font).toBe("mono");
    expect(stage.className).toContain("font-mono");
    expect(stage.style.backgroundColor).not.toBe("");
  });
});

describe("realtime metrics reference demo", () => {
  it("ticks the signup count on an interval", () => {
    vi.useFakeTimers();
    const feature = FEATURES[featureIndexBySlug("realtime-metrics")!];
    render(<RealtimeMetricsDemo feature={feature} />);
    const before = Number(
      screen.getByTestId("signup-count").textContent!.replace(/,/g, ""),
    );
    act(() => vi.advanceTimersByTime(1600));
    const after = Number(
      screen.getByTestId("signup-count").textContent!.replace(/,/g, ""),
    );
    expect(after).toBeGreaterThan(before);
  });

  it("every project has a usable accent for the stage", () => {
    for (const project of PROJECTS) {
      expect(project.accent.accent).toMatch(/^#/);
      expect(project.accent.surface.length).toBeGreaterThan(0);
    }
  });
});
