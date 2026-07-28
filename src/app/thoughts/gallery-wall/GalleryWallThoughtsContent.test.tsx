import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GalleryWallThoughtsContent from "./GalleryWallThoughtsContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import {
  groupThoughts,
  DEPRECATED_GROUP,
} from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const HREF = "/thoughts/gallery-wall";

describe("Gallery Wall write-up", () => {
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
    render(<GalleryWallThoughtsContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Gallery Wall" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /auto-framing follows the photo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /centered rows/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /overlap is a hard stop/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /hang sheet/i }),
    ).toBeInTheDocument();
  });

  it("links to the feature it documents", () => {
    render(<GalleryWallThoughtsContent />);
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toContain("/gallery-wall");
  });
});
