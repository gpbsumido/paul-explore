import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageContent from "./LandingPageContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("LandingPageContent", () => {
  it("renders the write-up heading", () => {
    render(<LandingPageContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("keeps its sections in order after the split", () => {
    render(<LandingPageContent />);
    const body = document.body.textContent ?? "";
    // One heading from each half, in document order.
    const first = body.indexOf("Zero-dependency first");
    const later = body.indexOf("Predictions panel");
    expect(first).toBeGreaterThan(-1);
    expect(later).toBeGreaterThan(first);
  });
});
