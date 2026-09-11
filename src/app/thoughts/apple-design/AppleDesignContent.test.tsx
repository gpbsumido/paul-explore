import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AppleDesignContent from "./AppleDesignContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("AppleDesignContent", () => {
  it("renders the write-up heading", () => {
    render(<AppleDesignContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "An Apple-design pass across the whole app",
      }),
    ).toBeInTheDocument();
  });

  it("links to a feature it cites as already-good", () => {
    render(<AppleDesignContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/gallery-wall");
  });
});
