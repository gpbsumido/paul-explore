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

  it("moves focus into the panel when it opens", () => {
    renderSheet();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("gives scroll and focus back when it closes", () => {
    document.body.style.overflow = "auto";
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();

    const { rerender } = render(
      <Sheet open onClose={() => {}} label="Test sheet">
        <p>Sheet body</p>
      </Sheet>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    rerender(
      <Sheet open={false} onClose={() => {}} label="Test sheet">
        <p>Sheet body</p>
      </Sheet>,
    );

    expect(document.body.style.overflow).toBe("auto");
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it("stops listening for Escape once it has closed", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Sheet open onClose={onClose} label="Test sheet">
        <p>Sheet body</p>
      </Sheet>,
    );
    rerender(
      <Sheet open={false} onClose={onClose} label="Test sheet">
        <p>Sheet body</p>
      </Sheet>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls the latest onClose, not the one it opened with", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <Sheet open onClose={first} label="Test sheet">
        <p>Sheet body</p>
      </Sheet>,
    );
    rerender(
      <Sheet open onClose={second} label="Test sheet">
        <p>Sheet body</p>
      </Sheet>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("ignores keys other than Escape", () => {
    const { onClose } = renderSheet();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
