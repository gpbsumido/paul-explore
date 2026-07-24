import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import ThoughtsIndexContent from "./ThoughtsIndexContent";
import { buildGraphData } from "@/app/v3/graph/graphData";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

describe("ThoughtsIndexContent deep-link anchors", () => {
  it("every landing category deep-link resolves to a real section on the index", () => {
    const { container } = render(<ThoughtsIndexContent />);
    const ids = new Set(
      Array.from(container.querySelectorAll("section[id]")).map((s) => s.id),
    );
    expect(ids.size).toBeGreaterThan(0);

    const categoryHrefs = buildGraphData()
      .nodes.filter((n) => n.kind === "category")
      .map((n) => n.href!);
    expect(categoryHrefs.length).toBeGreaterThan(0);

    for (const href of categoryHrefs) {
      const anchor = href.split("#")[1];
      expect(anchor, `${href} has a fragment`).toBeTruthy();
      expect(ids, `#${anchor} exists on the index`).toContain(anchor);
    }
  });
});
