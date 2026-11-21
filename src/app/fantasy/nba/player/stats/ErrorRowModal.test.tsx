import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorRowModal from "./ErrorRowModal";

describe("ErrorRowModal", () => {
  it("explains the rate limit while open, and closes from OK and from Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ErrorRowModal open onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Stats error info" })).toHaveTextContent(/rate-limited/i);

    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders nothing while closed", () => {
    render(<ErrorRowModal open={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
