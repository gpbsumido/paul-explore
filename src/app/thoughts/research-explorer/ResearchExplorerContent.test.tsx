import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

describe("ResearchExplorerContent updates", () => {
  it("carries a timeline that jumps to each dated update", () => {
    const { container } = render(<ResearchExplorerContent />);
    const nav = screen.getByRole("navigation", { name: /update timeline/i });
    const link = within(nav).getByRole("link", { name: /counts/i });
    expect(link).toHaveAttribute("href", "#update-2026-08-07-counts");
    expect(container.querySelector("#update-2026-08-07-counts")).not.toBeNull();
  });

  it("links each update by the topic it belongs to", () => {
    const { container } = render(<ResearchExplorerContent />);
    ["#update-2026-08-07-counts", "#update-2026-08-07-mobile"].forEach((id) => {
      expect(container.querySelector(id)).not.toBeNull();
      expect(container.querySelector(`a[href="${id}"]`)).not.toBeNull();
    });
  });

  it("keeps a note about the graph view I still want to build", () => {
    render(<ResearchExplorerContent />);
    expect(screen.getByText(/node graph/i)).toBeInTheDocument();
  });
});
