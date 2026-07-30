import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InterviewNotice from "./InterviewNotice";

const params = vi.hoisted(() => vi.fn(() => new URLSearchParams()));

vi.mock("next/navigation", () => ({ useSearchParams: () => params() }));

describe("InterviewNotice", () => {
  it("stays out of the way for anyone who just opened the resume", () => {
    params.mockReturnValue(new URLSearchParams());
    render(<InterviewNotice />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains where the email is when you arrive from the gate", () => {
    params.mockReturnValue(new URLSearchParams("from=interview"));
    render(<InterviewNotice />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/email/i);
    expect(
      screen.getByRole("link", { name: /psumido@gmail\.com/i }),
    ).toHaveAttribute("href", expect.stringContaining("mailto:"));
  });

  it("closes when the reader dismisses it", async () => {
    params.mockReturnValue(new URLSearchParams("from=interview"));
    render(<InterviewNotice />);
    await userEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
