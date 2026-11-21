import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RenderPerfContent from "./RenderPerfContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("RenderPerfContent", () => {
  it("renders the write-up heading", () => {
    render(<RenderPerfContent />);
    expect(screen.getByRole("heading", { level: 1, name: "Render Performance" })).toBeInTheDocument();
  });

  it("keeps its summary sections in order after the split", () => {
    render(<RenderPerfContent />);
    const body = document.body.textContent ?? "";
    const first = body.indexOf("WeatherContext value instability");
    const later = body.indexOf("Learn pages code-split with dynamic imports");
    expect(first).toBeGreaterThan(-1);
    expect(later).toBeGreaterThan(first);
  });
});
