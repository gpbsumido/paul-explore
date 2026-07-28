import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MotionComponentsContent from "./MotionComponentsContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import {
  groupThoughts,
  DEPRECATED_GROUP,
} from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

const HREF = "/thoughts/motion-components";

describe("Motion Components write-up", () => {
  it("is registered in THOUGHTS with a preview and colour", () => {
    const entry = THOUGHTS.find((t) => t.href === HREF);
    expect(entry).toBeDefined();
    expect(entry?.preview).toBeTruthy();
    expect(entry?.color).toBeTruthy();
    expect(entry?.deprecated).toBeFalsy();
  });

  it("lands in a real category, not the More or Deprecated buckets", () => {
    const group = groupThoughts(THOUGHTS).find((g) =>
      g.items.some((t) => t.href === HREF),
    );
    expect(group).toBeDefined();
    expect(group?.name).not.toBe("More");
    expect(group?.name).not.toBe(DEPRECATED_GROUP);
  });

  it("renders the heading and the sections that document the work", () => {
    render(<MotionComponentsContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Motion Components" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /reduced motion is the default/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /one hook, shared/i }),
    ).toBeInTheDocument();
  });
});
