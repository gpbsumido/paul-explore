import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StylingContent from "./StylingContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("StylingContent", () => {
  it("renders the write-up heading", () => {
    render(<StylingContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("records the chat stylesheet relocation and the ordering that made it cheap", () => {
    render(<StylingContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/chat.module.css/);
    expect(body).toMatch(/ChatThread/);
    expect(body).toMatch(/one-import change instead of a forty-file rename/);
  });

  it("links the update section to the refactor write-up", () => {
    const { container } = render(<StylingContent />);
    const section = container.querySelector("#update-2026-08-05-chat-css-move");
    expect(section).not.toBeNull();
    const hrefs = [...(section?.querySelectorAll("a") ?? [])].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/thoughts/refactor-pass");
  });
});
