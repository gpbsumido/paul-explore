import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorMessagesContent from "./ErrorMessagesContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("ErrorMessagesContent", () => {
  it("renders the write-up heading", () => {
    render(<ErrorMessagesContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Errors people can read" }),
    ).toBeInTheDocument();
  });

  it("pastes the real error a person was shown", () => {
    const { container } = render(<ErrorMessagesContent />);
    expect(container.textContent).toContain('"code": "invalid_value"');
    expect(container.textContent).toContain("row.role ?? undefined");
  });

  it("has a section on what to watch for when an AI is writing the code", () => {
    render(<ErrorMessagesContent />);
    expect(
      screen.getByRole("heading", {
        name: /watch for this when an ai is writing the code/i,
      }),
    ).toBeInTheDocument();
  });

  it("describes the AI generically, without naming a product", () => {
    const { container } = render(<ErrorMessagesContent />);
    expect(container.textContent).not.toMatch(/claude|anthropic|copilot|chatgpt|openai/i);
  });
});
