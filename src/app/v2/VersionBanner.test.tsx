import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import VersionBanner from "./VersionBanner";

const LABEL = "Landing-page history: v4";

describe("VersionBanner", () => {
  it("captions the archived generation and offers the way back", () => {
    render(<VersionBanner label={LABEL} />);
    expect(screen.getByText(/Landing-page history: v4/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /switch to current/i }),
    ).toHaveAttribute("href", "/");
  });

  it("is a named landmark, since it sits outside the page's main region", () => {
    render(<VersionBanner label={LABEL} />);
    expect(screen.getByRole("region", { name: "Landing page version" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<VersionBanner label={LABEL} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
