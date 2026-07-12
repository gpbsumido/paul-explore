import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import { ApprovalGate } from "./ApprovalGate";

const defaultProps = {
  action: "delete_file",
  description: "Delete config.json from the project root",
  status: "pending" as const,
  onApprove: vi.fn(),
  onDeny: vi.fn(),
};

describe("ApprovalGate", () => {
  it("renders the action name", () => {
    render(<ApprovalGate {...defaultProps} />);

    expect(screen.getByText("delete_file")).toBeInTheDocument();
  });

  it("renders the action description", () => {
    render(<ApprovalGate {...defaultProps} />);

    expect(
      screen.getByText("Delete config.json from the project root"),
    ).toBeInTheDocument();
  });

  it("renders Approve and Deny buttons when pending", () => {
    render(<ApprovalGate {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /approve/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /deny/i })).toBeInTheDocument();
  });

  it("clicking Approve calls onApprove", async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    render(<ApprovalGate {...defaultProps} onApprove={onApprove} />);

    await user.click(screen.getByRole("button", { name: /approve/i }));

    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("clicking Deny calls onDeny", async () => {
    const onDeny = vi.fn();
    const user = userEvent.setup();
    render(<ApprovalGate {...defaultProps} onDeny={onDeny} />);

    await user.click(screen.getByRole("button", { name: /deny/i }));

    expect(onDeny).toHaveBeenCalledOnce();
  });

  it("has role='alertdialog' on the root element", () => {
    render(<ApprovalGate {...defaultProps} />);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("has aria-labelledby pointing to the action name element", () => {
    render(<ApprovalGate {...defaultProps} />);

    const dialog = screen.getByRole("alertdialog");
    const labelId = dialog.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();

    const label = document.getElementById(labelId!);
    expect(label).toBeInTheDocument();
    expect(label?.textContent).toBe("delete_file");
  });

  it("has aria-describedby pointing to the description element", () => {
    render(<ApprovalGate {...defaultProps} />);

    const dialog = screen.getByRole("alertdialog");
    const descId = dialog.getAttribute("aria-describedby");
    expect(descId).toBeTruthy();

    const desc = document.getElementById(descId!);
    expect(desc).toBeInTheDocument();
    expect(desc?.textContent).toBe("Delete config.json from the project root");
  });

  it("Approve button is keyboard accessible", async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    render(<ApprovalGate {...defaultProps} onApprove={onApprove} />);

    const approveBtn = screen.getByRole("button", { name: /approve/i });
    approveBtn.focus();
    await user.keyboard("{Enter}");

    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("shows status label instead of buttons when approved", () => {
    render(<ApprovalGate {...defaultProps} status="approved" />);

    expect(
      screen.queryByRole("button", { name: /approve/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /deny/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/approved/i)).toBeInTheDocument();
  });

  it("shows status label instead of buttons when denied", () => {
    render(<ApprovalGate {...defaultProps} status="denied" />);

    expect(
      screen.queryByRole("button", { name: /approve/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /deny/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/denied/i)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<ApprovalGate {...defaultProps} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
