import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import { StopButton } from "./StopButton";

describe("StopButton", () => {
  it("renders a button with text Stop", () => {
    render(<StopButton onStop={vi.fn()} />);

    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    expect(screen.getByText("Stop")).toBeInTheDocument();
  });

  it("clicking it calls the onStop callback", async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();
    render(<StopButton onStop={onStop} />);

    await user.click(screen.getByRole("button", { name: /stop/i }));

    expect(onStop).toHaveBeenCalledOnce();
  });

  it("does not call onStop while disabled", async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();
    render(<StopButton onStop={onStop} disabled />);

    const button = screen.getByRole("button", { name: /stop/i });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(onStop).not.toHaveBeenCalled();
  });

  it("has aria-label='Stop generation'", () => {
    render(<StopButton onStop={vi.fn()} />);

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Stop generation",
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(<StopButton onStop={vi.fn()} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
