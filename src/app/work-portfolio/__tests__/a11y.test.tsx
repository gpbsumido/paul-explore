import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import WorkPortfolioContent from "../WorkPortfolioContent";
import { FEATURES, projectFor } from "../_data/catalog";

beforeEach(() => window.history.replaceState(null, "", "/work-portfolio"));

describe("work-portfolio accessibility", () => {
  it("has no axe violations on the intro state", async () => {
    const { container } = render(<WorkPortfolioContent />);
    expect(await axe(container)).toHaveNoViolations();
  }, 30000);

  it("has no axe violations with a demo selected", async () => {
    window.history.replaceState(
      null,
      "",
      "/work-portfolio?feature=realtime-metrics",
    );
    const { container } = render(<WorkPortfolioContent />);
    expect(await axe(container)).toHaveNoViolations();
  }, 30000);

  it("announces selection changes through a live region", () => {
    render(<WorkPortfolioContent />);
    fireEvent.click(screen.getByRole("button", { name: "Next feature" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      `Showing ${FEATURES[0].title} from ${projectFor(FEATURES[0]).name}`,
    );
  });
});
