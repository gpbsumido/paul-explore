import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MicroFrontendsContent from "./MicroFrontendsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("MicroFrontendsContent", () => {
  it("renders the write-up heading", () => {
    render(<MicroFrontendsContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Splitting the work portfolio into its own app",
      }),
    ).toBeInTheDocument();
  });

  it("links to the page it describes and to the remote's repo", () => {
    render(<MicroFrontendsContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/work-portfolio");
    expect(links).toContain("https://github.com/gpbsumido/work-portfolio-mfe");
  });
});
