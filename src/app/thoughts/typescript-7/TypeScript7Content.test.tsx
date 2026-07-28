import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TypeScript7Content from "./TypeScript7Content";
import { THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("TypeScript7Content", () => {
  it("renders the write-up heading", () => {
    render(<TypeScript7Content />);
    expect(
      screen.getByRole("heading", { level: 1, name: /typescript 7/i }),
    ).toBeInTheDocument();
  });

  it("names the blocker and the measurement that made it moot", () => {
    render(<TypeScript7Content />);
    const body = document.body.textContent ?? "";
    // The peer range is the whole reason the upgrade fails.
    expect(body).toMatch(/typescript-eslint/);
    expect(body).toMatch(/<6\.1\.0/);
    // And the local timing is what makes the speedup not worth the trade.
    expect(body).toMatch(/4\.05s/);
    expect(body).toMatch(/725/);
  });

  it("points at the release that actually unblocks it", () => {
    render(<TypeScript7Content />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/7\.1/);
    expect(body).toMatch(/native-preview/);
  });

  it("is listed in the thoughts data and sorted into a category", () => {
    const thought = THOUGHTS.find((t) => t.href === "/thoughts/typescript-7");
    expect(thought).toBeDefined();
    const grouped = groupThoughts(THOUGHTS);
    const category = grouped.find((g) =>
      g.items.some((t) => t.href === "/thoughts/typescript-7"),
    );
    expect(category?.name).toBe("Build & Tooling");
  });
});
