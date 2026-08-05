import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CalendarAboutContent from "./CalendarAboutContent";
import { CalendarChat } from "./sections/CalendarChat";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("CalendarAboutContent", () => {
  it("renders the write-up heading and summary", () => {
    render(<CalendarAboutContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(document.body.textContent ?? "").toContain("Architecture overview");
  });

  it("composes the chat thread parts in order after the split", () => {
    render(<CalendarChat />);
    const body = document.body.textContent ?? "";
    const part1 = body.indexOf("so what did you actually build here");
    const part2 = body.indexOf(
      "what about the event detail page at /calendar/events/:id",
    );
    expect(part1).toBeGreaterThan(-1);
    expect(part2).toBeGreaterThan(part1);
  });
});
