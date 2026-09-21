import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import WorkPortfolioContent from "../WorkPortfolioContent";

describe("Work portfolio guided tour", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/work-portfolio");
  });

  it("exposes a Take the tour button and the anchors it points at", () => {
    window.localStorage.setItem("work-portfolio-tour-seen", "true");
    render(<WorkPortfolioContent />);
    expect(
      screen.getByRole("button", { name: /take the tour/i }),
    ).toBeInTheDocument();
    expect(document.getElementById("wp-hero")).not.toBeNull();
    expect(document.getElementById("wp-projects-ticker")).not.toBeNull();
    expect(document.getElementById("wp-features-ticker")).not.toBeNull();
  });

  it("opens the tour on the consent step and walks into it", () => {
    window.localStorage.setItem("work-portfolio-tour-seen", "true");
    render(<WorkPortfolioContent />);
    fireEvent.click(screen.getByRole("button", { name: /take the tour/i }));
    const tour = () => screen.getByRole("dialog", { name: /tour/i });
    expect(
      within(tour()).getByRole("button", { name: /^next$/i }),
    ).toBeInTheDocument();
    fireEvent.click(within(tour()).getByRole("button", { name: /^next$/i }));
    expect(within(tour()).getByText(/feature demos/i)).toBeInTheDocument();
  });
});
