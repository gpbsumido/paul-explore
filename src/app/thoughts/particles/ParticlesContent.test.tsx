import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ParticlesContent from "./ParticlesContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("ParticlesContent", () => {
  it("renders the write-up heading", () => {
    render(<ParticlesContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("closes with what shipped and what is next", () => {
    render(<ParticlesContent />);
    expect(
      screen.getByRole("heading", { name: /what I'd do now/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /next on this/i }),
    ).toBeInTheDocument();
  });
});
