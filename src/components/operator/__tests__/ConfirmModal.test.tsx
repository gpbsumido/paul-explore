import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmModal from "../ConfirmModal";

function renderModal(props: Partial<React.ComponentProps<typeof ConfirmModal>> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ConfirmModal
      open
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete store?"
      message="This cannot be undone."
      {...props}
    />,
  );
  return { onClose, onConfirm, user: userEvent.setup() };
}

describe("ConfirmModal", () => {
  it("is a dialog named by its title that shows the message", () => {
    renderModal();
    const dialog = screen.getByRole("dialog", { name: "Delete store?" });
    expect(dialog).toHaveTextContent("This cannot be undone.");
  });

  it("renders nothing while closed", () => {
    renderModal({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirms with the default label, and calls only onConfirm", async () => {
    const { onConfirm, onClose, user } = renderModal();
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("uses the label it is given for the confirm button", () => {
    renderModal({ confirmLabel: "Delete" });
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("cancels with onClose and never confirms", async () => {
    const { onConfirm, onClose, user } = renderModal();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows progress and locks both buttons while loading", async () => {
    const { onConfirm, onClose, user } = renderModal({ loading: true });
    const confirm = screen.getByRole("button", { name: "Processing..." });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(confirm).toBeDisabled();
    expect(cancel).toBeDisabled();
    await user.click(confirm);
    await user.click(cancel);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
