import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PrScreenshotsContent from "./PrScreenshotsContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

describe("PrScreenshotsContent", () => {
  it("renders the write-up heading", () => {
    render(<PrScreenshotsContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /pr screenshots from an unattended agent/i,
      }),
    ).toBeInTheDocument();
  });

  it("documents each rejected hosting option and the one that works", () => {
    render(<PrScreenshotsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/user-attachments/);
    expect(body).toMatch(/gh gist create/);
    expect(body).toMatch(/gh release upload/);
    expect(body).toMatch(/raw\.githubusercontent\.com/);
  });

  it("documents the version/pr-number/feature path convention", () => {
    render(<PrScreenshotsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/docs\/pr-screenshots/);
    expect(body).toMatch(/<version>\/<pr-number>\/<feature>/);
  });

  it("explains why we do not prune the screenshots at release time", () => {
    render(<PrScreenshotsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/git history forever/i);
    expect(body).toMatch(/theater/i);
  });

  it("notes the dev-mode overlays are hidden before capture", () => {
    render(<PrScreenshotsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/Next\.js dev indicator/);
    expect(body).toMatch(/React Query devtools/);
  });
});

describe("pr-screenshots write-up registration", () => {
  it("is listed in the Build & Tooling category", () => {
    const group = groupThoughts(THOUGHTS).find(
      (g) => g.name === "Build & Tooling",
    );
    expect(
      group?.items.some((t) => t.href === "/thoughts/pr-screenshots"),
    ).toBe(true);
  });
});
