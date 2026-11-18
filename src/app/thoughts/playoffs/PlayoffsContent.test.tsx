import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PlayoffsContent from "./PlayoffsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("PlayoffsContent", () => {
  it("carries the failed-save update, linked from the timeline", () => {
    render(<PlayoffsContent />);
    expect(
      document.getElementById("update-2026-11-18-failed-save"),
    ).not.toBeNull();
    expect(
      screen.getByRole("link", { name: /a save indicator that could only say yes/i }),
    ).toHaveAttribute("href", "#update-2026-11-18-failed-save");
  });
});
