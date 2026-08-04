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

  it("says why a clean log is worth the effort", () => {
    render(<TestTiersContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/Noise is not a category of output/);
    expect(body).toMatch(/the next unexpected line is worth looking at/);
  });

  it("records the four ways a suite measured the wrong thing", () => {
    render(<TestTiersContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/the same mistake keeps arriving in different clothes/);
    expect(body).toMatch(/A partial fix and a complete one produce identical\s+test output/);
    expect(body).toMatch(/a guard nobody has seen fail is just another\s+claim/);
  });

  it("warns that a tier can be green for the wrong reason", () => {
    render(<TestTiersContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /test that cannot fail\s+when the thing it covers is broken is not a test/,
    );
    expect(body).toMatch(/a passing tier is a claim/);
  });

  it("records the suite that reported routes it had stopped scanning", () => {
    render(<TestTiersContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/never actually\s+run the scan/);
    expect(body).toMatch(/reported those routes as covered/);
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

  it("describes the implemented smoke and nightly cadence", () => {
    render(<TestTiersContent />);
    expect(screen.getByText(/e2e-smoke/)).toBeInTheDocument();
    expect(screen.getByText(/e2e-full/)).toBeInTheDocument();
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/nightly/i);
    expect(body).toMatch(/@smoke/);
  });

  it("describes the carved-out integration tier", () => {
    render(<TestTiersContent />);
    expect(screen.getAllByText(/pnpm test:integration/).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByText(/\.integration\.test\.tsx/),
    ).toBeInTheDocument();
  });

  it("notes keeping the fast integration tier on every PR as a deliberate deviation", () => {
    render(<TestTiersContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/deliberate deviation/i);
    expect(body).toMatch(/every push and PR/i);
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
