import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import StoreHeader from "../StoreHeader";
import ConnectionQuality from "../ConnectionQuality";
import { buildStore } from "@/test/factories/operator";

const NOW = new Date("2026-03-01T12:00:00.000Z");
const minutesAgo = (minutes: number) =>
  new Date(NOW.getTime() - minutes * 60_000).toISOString();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe("StoreHeader", () => {
  it("names the store, where it is, and its status", () => {
    render(
      <StoreHeader
        store={buildStore({ name: "Lobby Fridge", location: "Main Lobby", status: "degraded", lastPing: minutesAgo(1) })}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Lobby Fridge" })).toBeInTheDocument();
    expect(screen.getByText("Main Lobby")).toBeInTheDocument();
    expect(screen.getByText("Degraded")).toBeInTheDocument();
  });

  it("shows uptime to one decimal place", () => {
    render(<StoreHeader store={buildStore({ uptime: 99.25, lastPing: minutesAgo(1) })} />);
    expect(screen.getByText("99.3% uptime")).toBeInTheDocument();
  });

  it("shows the connection quality derived from the last ping", () => {
    render(<StoreHeader store={buildStore({ lastPing: minutesAgo(30) })} />);
    expect(screen.getByText("Offline", { selector: "span.text-xs" })).toBeInTheDocument();
  });
});

describe("ConnectionQuality", () => {
  it.each([
    [1, "Strong signal"],
    [3, "Weak signal"],
    [7, "Poor signal"],
    [15, "Offline"],
  ])("a ping %i minutes ago reads %s", (minutes, label) => {
    render(<ConnectionQuality lastPing={minutesAgo(minutes)} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByTitle(label)).toBeInTheDocument();
  });

  it("changes its icon between a strong and an offline signal", () => {
    const { container, rerender } = render(<ConnectionQuality lastPing={minutesAgo(1)} />);
    const strongIcon = container.querySelector("svg")?.outerHTML;
    rerender(<ConnectionQuality lastPing={minutesAgo(15)} />);
    expect(container.querySelector("svg")?.outerHTML).not.toBe(strongIcon);
  });
});
