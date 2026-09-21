import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DesignDetoxContent from "./DesignDetoxContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import {
  groupThoughts,
  DEPRECATED_GROUP,
} from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

const HREF = "/thoughts/design-detox";

describe("Design detox write-up", () => {
  it("is registered in THOUGHTS with a preview and colour", () => {
    const entry = THOUGHTS.find((t) => t.href === HREF);
    expect(entry).toBeDefined();
    expect(entry?.preview).toBeTruthy();
    expect(entry?.color).toBeTruthy();
    expect(entry?.deprecated).toBeFalsy();
  });

  it("lands in Design & UI, not the More or Deprecated buckets", () => {
    const group = groupThoughts(THOUGHTS).find((g) =>
      g.items.some((t) => t.href === HREF),
    );
    expect(group?.name).toBe("Design & UI");
    expect(group?.name).not.toBe("More");
    expect(group?.name).not.toBe(DEPRECATED_GROUP);
  });

  it("renders the heading and keeps the wrong turns in the story", () => {
    render(<DesignDetoxContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Design detox" }),
    ).toBeInTheDocument();
    // the arrow section keeps the wrong first fix and the real cause
    expect(
      screen.getByRole("heading", { name: /missed why/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/"block"/)).toBeInTheDocument();
    // the rejected film grain is documented, not hidden
    expect(
      screen.getByRole("heading", { name: /grain that didn.t help/i }),
    ).toBeInTheDocument();
  });
});
