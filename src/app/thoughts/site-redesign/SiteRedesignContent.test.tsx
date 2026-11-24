import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SiteRedesignContent from "./SiteRedesignContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import {
  groupThoughts,
  DEPRECATED_GROUP,
} from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

const HREF = "/thoughts/site-redesign";

describe("Site redesign write-up", () => {
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
    expect(group?.name).not.toBe(DEPRECATED_GROUP);
  });

  it("renders the heading and keeps the rejected cyan in the story", () => {
    render(<SiteRedesignContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "One mockup, the whole site" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /the build said no/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/uses no stock Tailwind colour utilities/)).toBeInTheDocument();
  });
});
