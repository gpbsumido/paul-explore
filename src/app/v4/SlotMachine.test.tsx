import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import SlotMachine from "./SlotMachine";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/font/google", () => ({
  Fraunces: () => ({ className: "font-fraunces", style: {} }),
}));

const renderMachine = () =>
  render(
    <SlotMachine greeting="Hello there" action={<button>Log in</button>} />,
  );

describe("SlotMachine reels", () => {
  it("keeps each reel an accessible listbox named for its column", () => {
    renderMachine();
    // Apps is the default landed category, so the middle reel names an app link.
    for (const name of ["Category", "App link", "Write-up"]) {
      expect(screen.getByRole("listbox", { name })).toBeInTheDocument();
    }
  });

  it("drops the numbered column headers above the reels", () => {
    renderMachine();
    expect(screen.queryByText("01")).not.toBeInTheDocument();
    expect(screen.queryByText("02")).not.toBeInTheDocument();
    expect(screen.queryByText("03")).not.toBeInTheDocument();
  });

  it("puts a magnifier lens over the selected row of each populated reel", () => {
    renderMachine();
    // Category and Options always have items, so at least two lenses render.
    expect(screen.getAllByTestId("reel-lens").length).toBeGreaterThanOrEqual(2);
  });

  it("annotates the landed row with a drawn-in label pointing at it", () => {
    renderMachine();
    // The reel names now live in the annotation layer, not a static header.
    const annotations = screen.getAllByTestId("reel-annotation");
    expect(annotations.length).toBeGreaterThanOrEqual(2);
    expect(within(annotations[0]).getByText("Category")).toBeInTheDocument();
  });

  it("moves focus between reels with Left and Right arrows", () => {
    renderMachine();
    const category = screen.getByRole("listbox", { name: "Category" });
    const options = screen.getByRole("listbox", { name: "App link" });

    category.focus();
    expect(category).toHaveFocus();

    fireEvent.keyDown(category, { key: "ArrowRight" });
    expect(options).toHaveFocus();

    fireEvent.keyDown(options, { key: "ArrowLeft" });
    expect(category).toHaveFocus();
  });

  it("has no axe violations", async () => {
    const { container } = renderMachine();
    expect(await axe(container)).toHaveNoViolations();
  });
});
