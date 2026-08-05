import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TcgContent from "./TcgContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("TcgContent", () => {
  it("renders the write-up heading", () => {
    render(<TcgContent />);
    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toBeInTheDocument();
  });

  it("documents the serveTcg convergence and what it left alone", () => {
    render(<TcgContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/serveTcg/);
    expect(body).toMatch(/server-only/);
    expect(body).toMatch(/detail.*routes.*404|404 on a miss/i);
    expect(body).toMatch(/behaviour-preserving/);
  });

  it("links the update section to the refactor write-up", () => {
    const { container } = render(<TcgContent />);
    const section = container.querySelector("#update-2026-08-05-serve-tcg");
    expect(section).not.toBeNull();
    const hrefs = [...(section?.querySelectorAll("a") ?? [])].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/thoughts/refactor-pass");
  });
});
