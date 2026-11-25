import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FieldOpsContent from "./FieldOpsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("FieldOpsContent", () => {
  it("renders the write-up heading", () => {
    render(<FieldOpsContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "A Field Console That Tells the Truth" }),
    ).toBeInTheDocument();
  });

  it("closes with what shipped and what is next", () => {
    render(<FieldOpsContent />);
    expect(screen.getByRole("heading", { name: /what I'd do now/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /next on this/i })).toBeInTheDocument();
  });
});
