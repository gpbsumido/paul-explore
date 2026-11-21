import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import Modal from "./Modal";

function renderModal(props: { open?: boolean; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn();
  return {
    onClose,
    ...render(
      <div>
        <p>Background content</p>
        <Modal
          open={props.open ?? true}
          onClose={onClose}
          aria-label="Test modal"
        >
          <h2 id="modal-title">Title</h2>
          <button type="button">First</button>
          <button type="button">Second</button>
        </Modal>
      </div>,
    ),
  };
}

describe("Modal accessibility", () => {
  it("reports no axe violations when open", async () => {
    const { container } = renderModal();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has role=dialog and aria-modal=true", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("moves focus to the first focusable element on open", async () => {
    renderModal();
    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    });
  });

  it("traps focus within the modal on Tab", async () => {
    const user = userEvent.setup();
    renderModal();

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    });

    await user.tab();
    expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("marks background content as inert when open, and not when closed", () => {
    const { rerender, onClose } = renderModal({ open: false });
    const background = () => screen.getByText("Background content");
    expect(background().closest("[aria-hidden='true'], [inert]")).toBeNull();

    rerender(
      <div>
        <p>Background content</p>
        <Modal open onClose={onClose} aria-label="Test modal">
          <button type="button">First</button>
        </Modal>
      </div>,
    );
    expect(background().closest("[aria-hidden='true'], [inert]")).not.toBeNull();
  });

  it("renders no dialog while closed", () => {
    renderModal({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("names the dialog from the label it is given", () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "Test modal" })).toBeInTheDocument();
  });

  it("names the dialog from the element aria-labelledby points at", () => {
    render(
      <Modal open onClose={() => {}} aria-labelledby="heading">
        <h2 id="heading">Delete this?</h2>
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Delete this?" })).toBeInTheDocument();
  });

  it("describes the dialog from the element aria-describedby points at", () => {
    render(
      <Modal open onClose={() => {}} aria-label="Confirm" aria-describedby="why">
        <p id="why">This cannot be undone.</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "This cannot be undone.",
    );
  });

  it("puts a caller's class on the panel", () => {
    render(
      <Modal open onClose={() => {}} aria-label="Wide" className="max-w-3xl">
        <p>body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("max-w-3xl");
  });

  it("exposes Header, Body and Footer slots that render their content", () => {
    render(
      <Modal open onClose={() => {}} aria-label="Slots">
        <Modal.Header>Heading text</Modal.Header>
        <Modal.Body>Body text</Modal.Body>
        <Modal.Footer>Footer text</Modal.Footer>
      </Modal>,
    );
    expect(screen.getByText("Heading text")).toHaveClass("modal__header");
    expect(screen.getByText("Body text")).toHaveClass("modal__body");
    expect(screen.getByText("Footer text")).toHaveClass("modal__footer");
  });

  it("gives focus back to what opened it when it closes", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Modal open={open} onClose={() => setOpen(false)} aria-label="Test">
            <button type="button">Inside</button>
          </Modal>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await vi.waitFor(() =>
      expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus(),
    );
    await user.keyboard("{Escape}");
    await vi.waitFor(() =>
      expect(screen.getByRole("button", { name: "Open" })).toHaveFocus(),
    );
  });
});
