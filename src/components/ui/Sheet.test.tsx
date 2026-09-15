import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sheet from "./Sheet";

function renderSheet(
  props: { open?: boolean; onClose?: () => void } = {},
) {
  const onClose = props.onClose ?? vi.fn();
  return {
    onClose,
    ...render(
      <Sheet open={props.open ?? true} onClose={onClose} label="Test sheet">
        <p>Sheet body</p>
      </Sheet>,
    ),
  };
}

afterEach(() => {
  document.body.style.overflow = "";
});

describe("Sheet", () => {
  it("renders a labelled dialog when open", () => {
    renderSheet();
    expect(
      screen.getByRole("dialog", { name: "Test sheet" }),
    ).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderSheet({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    const { onClose } = renderSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on a backdrop click but not a panel click", () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByTestId("sheet-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll while open", () => {
    renderSheet();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("keeps focus on a child input when re-rendered with a fresh onClose", () => {
    // Parents pass a new onClose every render. When it was an effect dependency
    // the effect re-ran and re-focused the panel, blurring the field mid-type —
    // which on mobile dismissed the keyboard. Focus must survive a re-render.
    const { rerender } = render(
      <Sheet open onClose={() => {}} label="Test sheet">
        <input aria-label="field" />
      </Sheet>,
    );
    const input = screen.getByLabelText("field");
    input.focus();
    expect(input).toHaveFocus();

    rerender(
      <Sheet open onClose={() => {}} label="Test sheet">
        <input aria-label="field" />
      </Sheet>,
    );
    expect(input).toHaveFocus();
  });
});
