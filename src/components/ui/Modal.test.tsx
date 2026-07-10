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

  it("marks background content as inert when open", () => {
    renderModal();
    const bg = screen.getByText("Background content");
    const wrapper = bg.closest("[aria-hidden]") ?? bg.closest("[inert]");
    expect(wrapper).toBeTruthy();
  });
});
