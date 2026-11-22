import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CodebaseAuditContent from "./CodebaseAuditContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("CodebaseAuditContent", () => {
  it("renders the write-up heading", () => {
    render(<CodebaseAuditContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Thirteen bugs that looked fine",
      }),
    ).toBeInTheDocument();
  });

  it("links out to every feature write-up that carries one of the fixes", () => {
    render(<CodebaseAuditContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    for (const href of [
      "/thoughts/operator-dashboard",
      "/thoughts/calendar",
      "/thoughts/playoffs",
      "/thoughts/zeroproof",
      "/thoughts/fantasy-tcg",
    ]) {
      expect(links).toContain(href);
    }
  });

  it("pastes the real artifact for the bugs that cut across the site", () => {
    render(<CodebaseAuditContent />);
    const pasted = Array.from(document.querySelectorAll("pre")).map(
      (pre) => pre.textContent ?? "",
    );
    expect(pasted.some((text) => text.includes('canonical: "/"'))).toBe(true);
    expect(pasted.some((text) => text.includes("encodeURIComponent(id)"))).toBe(
      true,
    );
    expect(pasted.some((text) => text.includes("#2d8f66"))).toBe(true);
  });

  it("carries the second pass as a dated update with its artifacts", () => {
    render(<CodebaseAuditContent />);
    expect(
      document.getElementById("update-2026-11-19-second-pass"),
    ).not.toBeNull();
    const pasted = Array.from(document.querySelectorAll("pre")).map(
      (pre) => pre.textContent ?? "",
    );
    expect(pasted.some((text) => text.includes("initialData: initialMe"))).toBe(
      true,
    );
    expect(pasted.some((text) => text.includes("getMonth() >= 9"))).toBe(true);
  });

  it("carries the API half as a dated update with its artifacts", () => {
    render(<CodebaseAuditContent />);
    expect(
      document.getElementById("update-2026-11-20-api-half"),
    ).not.toBeNull();
    const pasted = Array.from(document.querySelectorAll("pre")).map(
      (pre) => pre.textContent ?? "",
    );
    expect(
      pasted.some((text) => text.includes("const service = new CalendarService();")),
    ).toBe(true);
    expect(
      pasted.some((text) => text.includes("Expected 5 bindings, saw 0")),
    ).toBe(true);
  });

  it("carries the first redesign stack as a dated update with its artifacts", () => {
    render(<CodebaseAuditContent />);
    expect(
      document.getElementById("update-2026-11-22-one-way-in"),
    ).not.toBeNull();
    const pasted = Array.from(document.querySelectorAll("pre")).map(
      (pre) => pre.textContent ?? "",
    );
    expect(
      pasted.some((text) => text.includes('throw new Error("Failed to create event")')),
    ).toBe(true);
    expect(
      pasted.some((text) => text.includes("Invalid response status code 204")),
    ).toBe(true);
    expect(pasted.some((text) => text.includes("this.context?.refresh()"))).toBe(
      true,
    );
  });
});
