import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import SlotMachine from "./SlotMachine";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: (href: string) => push(href) }),
}));

vi.mock("next/font/google", () => ({
  Fraunces: () => ({ className: "font-fraunces", style: {} }),
}));

const renderMachine = () =>
  render(
    <SlotMachine greeting="Hello there" action={<button>Log in</button>} />,
  );

describe("SlotMachine reels", () => {
  it("keeps each reel an accessible region named for its column", () => {
    renderMachine();
    // Apps is the default landed category, so the middle reel names an app link.
    expect(
      screen.getByRole("listbox", { name: "Category" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listbox", { name: "App link" }),
    ).toBeInTheDocument();
    // The Write-up reel is a listbox when it has options and a plain group when
    // the landed app has no write-up yet; either way it's present and labelled.
    const writeup =
      screen.queryByRole("listbox", { name: "Write-up" }) ??
      screen.getByRole("group", { name: "Write-up" });
    expect(writeup).toBeInTheDocument();
  });

  it("drops the numbered column headers above the reels", () => {
    renderMachine();
    expect(screen.queryByText("01")).not.toBeInTheDocument();
    expect(screen.queryByText("02")).not.toBeInTheDocument();
    expect(screen.queryByText("03")).not.toBeInTheDocument();
  });

  it("puts one continuous magnifier lens across the reels", () => {
    renderMachine();
    // The loupe is a single glass bar spanning all three columns now, not a
    // separate bar per reel.
    expect(screen.getAllByTestId("reel-lens")).toHaveLength(1);
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

  it("opens the landed row when its label is clicked", () => {
    push.mockClear();
    const { container } = renderMachine();
    // The middle reel has landed on an app; its big label is the obvious thing
    // to click, and it used to just re-select the row it was already on.
    const optReel = screen.getByRole("listbox", { name: "App link" });
    const landed = within(optReel).getByText(/\S/, {
      selector: ".font-fraunces",
    });
    fireEvent.click(landed.closest("div.group") as HTMLElement);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toMatch(/^\//);
    expect(container).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = renderMachine();
    expect(await axe(container)).toHaveNoViolations();
  });
});
