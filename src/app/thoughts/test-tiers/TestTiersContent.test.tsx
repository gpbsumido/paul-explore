import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TestTiersContent from "./TestTiersContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

describe("TestTiersContent", () => {
  it("renders the tiered testing strategy heading", () => {
    render(<TestTiersContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: /tiered testing strategy/i }),
    ).toBeInTheDocument();
  });

  it("documents each testing tier", () => {
    render(<TestTiersContent />);
    for (const tier of [
      /fast unit tests/i,
      /integration tests/i,
      /end-to-end tests/i,
      /flaky and slow tests/i,
    ]) {
      expect(
        screen.getByRole("heading", { name: tier }),
      ).toBeInTheDocument();
    }
  });
});

describe("test-tiers write-up registration", () => {
  it("is listed in the Testing & Quality category", () => {
    const group = groupThoughts(THOUGHTS).find(
      (g) => g.name === "Testing & Quality",
    );
    expect(group?.items.some((t) => t.href === "/thoughts/test-tiers")).toBe(
      true,
    );
  });
});
