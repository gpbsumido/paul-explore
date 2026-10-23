import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import EvarSizingContent from "./EvarSizingContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("EvarSizingContent", () => {
  it("renders the write-up heading", () => {
    render(<EvarSizingContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("links to the practice page it writes up", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getAllByRole("link", { name: /evar sizing/i })[0],
    ).toHaveAttribute("href", "/evar");
  });

  it("has a dated update on the difficulty levels", () => {
    render(<EvarSizingContent />);
    expect(screen.getAllByText(/update.*october 22, 2026/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { level: 2, name: /five minutes/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on picking the device", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /16 mm limb/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on recording attempts for the study", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /recorded once/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on correcting reference answers", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /without a deploy/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on downloading the study", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /one line per attempt/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on scoring practice", () => {
    render(<EvarSizingContent />);
    expect(screen.getAllByText(/update.*october 23, 2026/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { level: 2, name: /stars for the skill/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on undoing the forced dark stage", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /reading room/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on the new cases and the more realistic scan", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /has an IVC/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on the results page", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /practice has a memory/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on the admin results page", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /a spreadsheet i don.t have to open/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on zooming the viewer", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /two pixels is not a fair test/i }),
    ).toBeInTheDocument();
  });

  it("no longer lists zoom as missing", () => {
    render(<EvarSizingContent />);
    expect(screen.queryByText(/there is no zoom/i)).toBeNull();
  });

  it("opens with a timeline that jumps to every dated update, newest first", () => {
    const { container } = render(<EvarSizingContent />);
    const timeline = screen.getByRole("navigation", { name: /update timeline/i });
    const targets = within(timeline)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    const updates = [...container.querySelectorAll("section[id^='update-']")].map((s) => `#${s.id}`);

    expect(updates.length).toBeGreaterThan(0);
    expect(targets).toEqual([...updates].reverse());
  });

  it("closes with what shipped and what is next", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { name: /what I'd do now/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /next on this/i }),
    ).toBeInTheDocument();
  });
});
