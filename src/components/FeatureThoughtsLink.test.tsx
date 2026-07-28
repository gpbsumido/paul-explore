import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FeatureThoughtsLink from "./FeatureThoughtsLink";

const path = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => path() }));

describe("FeatureThoughtsLink", () => {
  it("offers the write-up when you're on the feature", () => {
    path.mockReturnValue("/gallery-wall");
    render(<FeatureThoughtsLink />);
    const link = screen.getByRole("link", { name: /write-up on Gallery Wall/i });
    expect(link).toHaveAttribute("href", "/thoughts/gallery-wall");
  });

  it("offers the app when you're on the write-up", () => {
    path.mockReturnValue("/thoughts/gallery-wall");
    render(<FeatureThoughtsLink />);
    const link = screen.getByRole("link", { name: /open the Gallery Wall app/i });
    expect(link).toHaveAttribute("href", "/gallery-wall");
  });

  it("renders nothing on a page that isn't half of a pair", () => {
    path.mockReturnValue("/settings");
    const { container } = render(<FeatureThoughtsLink />);
    expect(container).toBeEmptyDOMElement();
  });
});
