import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "@/test/a11y";
import UpdatesContent from "./UpdatesContent";
import { UPDATE_ENTRIES } from "@/lib/updates/entries.data";
import { filterEntriesByCategory } from "@/lib/updates/query";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("UpdatesContent", () => {
  it("renders one article per update by default", () => {
    render(<UpdatesContent />);
    expect(screen.getAllByRole("article")).toHaveLength(UPDATE_ENTRIES.length);
  });

  it("shows an empty message and no articles when nothing matches the search", () => {
    render(<UpdatesContent />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzzznomatch" },
    });
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByText(/no updates match/i)).toBeInTheDocument();
  });

  it("narrows to a single category when its chip is clicked", () => {
    render(<UpdatesContent />);
    const featureCount = filterEntriesByCategory(UPDATE_ENTRIES, "feature").length;
    expect(featureCount).toBeGreaterThan(0);
    expect(featureCount).toBeLessThan(UPDATE_ENTRIES.length);

    fireEvent.click(screen.getByRole("button", { name: "Feature" }));
    expect(screen.getAllByRole("article")).toHaveLength(featureCount);
  });

  it("expands an update to reveal its body", () => {
    render(<UpdatesContent />);
    const first = UPDATE_ENTRIES[0];
    const toggle = screen.getByRole("button", {
      name: new RegExp(first.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(first.body[0])).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<UpdatesContent />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
