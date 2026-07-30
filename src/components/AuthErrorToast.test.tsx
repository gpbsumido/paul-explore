import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthErrorToast from "./AuthErrorToast";

const params = vi.hoisted(() => vi.fn(() => new URLSearchParams()));

vi.mock("next/navigation", () => ({ useSearchParams: () => params() }));

describe("AuthErrorToast", () => {
  it("stays silent when there is no auth error in the URL", () => {
    params.mockReturnValue(new URLSearchParams());
    render(<AuthErrorToast />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains you can't log in without granting permissions", () => {
    params.mockReturnValue(new URLSearchParams("authError=permissions"));
    render(<AuthErrorToast />);
    expect(screen.getByRole("alert")).toHaveTextContent(/permission/i);
  });

  it("tells you when the session timed out", () => {
    params.mockReturnValue(new URLSearchParams("authError=timeout"));
    render(<AuthErrorToast />);
    expect(screen.getByRole("alert")).toHaveTextContent(/timed out/i);
  });

  it("ignores auth error codes it doesn't recognise", () => {
    params.mockReturnValue(new URLSearchParams("authError=whatever"));
    render(<AuthErrorToast />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("dismisses when the reader clicks it away", async () => {
    params.mockReturnValue(new URLSearchParams("authError=permissions"));
    render(<AuthErrorToast />);
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
