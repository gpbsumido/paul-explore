import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UpdatesThoughtsContent from "./UpdatesThoughtsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("UpdatesThoughtsContent", () => {
  it("renders the write-up heading", () => {
    render(<UpdatesThoughtsContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "A changelog people would actually read",
      }),
    ).toBeInTheDocument();
  });

  it("links to both halves of the feature it documents", () => {
    render(<UpdatesThoughtsContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/updates");
    expect(links).toContain("/updates/tickets");
  });
});
