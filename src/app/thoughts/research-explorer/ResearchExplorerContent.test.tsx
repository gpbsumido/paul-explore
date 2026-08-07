import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { groupThoughts } from "@/app/_shared/thoughtCategories";
import { THOUGHTS } from "@/app/_shared/featureData.data";
import ResearchExplorerContent from "./ResearchExplorerContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("ResearchExplorerContent", () => {
  it("renders the write-up heading", () => {
    render(<ResearchExplorerContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("is registered as a Features write-up, not an uncategorized leftover", () => {
    const group = groupThoughts(THOUGHTS).find((g) =>
      g.items.some((t) => t.href === "/thoughts/research-explorer"),
    );
    expect(group?.name).toBe("Features");
  });
});
