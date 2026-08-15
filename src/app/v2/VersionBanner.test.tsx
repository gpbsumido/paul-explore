import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import VersionBanner from "./VersionBanner";

describe("VersionBanner", () => {
  it("names the version being viewed and offers the way back", () => {
    render(<VersionBanner version="v2" />);
    expect(screen.getByText(/You're viewing v2/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /switch to current/i }),
    ).toHaveAttribute("href", "/");
  });

  it("still reads sensibly with no version to name", () => {
    render(<VersionBanner />);
    expect(screen.getByText(/an older version/)).toBeInTheDocument();
  });

  it("takes a label when the default sentence is the wrong one", () => {
    // /discover became the archive of every landing page, current one included,
    // so the banner there is a caption rather than a warning about staleness.
    render(
      <VersionBanner version="v4" label="Landing-page history: v4" />,
    );
    expect(screen.getByText(/Landing-page history: v4/)).toBeInTheDocument();
    expect(screen.queryByText(/You're viewing/)).not.toBeInTheDocument();
  });

  it("keeps the way back to the current landing under a custom label", () => {
    render(
      <VersionBanner version="v4" label="Landing-page history: v4" />,
    );
    expect(
      screen.getByRole("link", { name: /switch to current/i }),
    ).toHaveAttribute("href", "/");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <VersionBanner version="v3" label="Landing-page history: v3" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
