import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthErrorToast from "./AuthErrorToast";

const params = vi.hoisted(() => vi.fn(() => new URLSearchParams()));
const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => params(),
  useRouter: () => ({ replace }),
  usePathname: () => "/",
}));

beforeEach(() => replace.mockClear());

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

  it("strips authError from the URL so it doesn't re-fire on return", () => {
    params.mockReturnValue(new URLSearchParams("authError=timeout"));
    render(<AuthErrorToast />);
    // The message still shows...
    expect(screen.getByRole("alert")).toHaveTextContent(/timed out/i);
    // ...but the URL is cleaned (replace, not push) so returning here is silent.
    expect(replace).toHaveBeenCalledWith("/", expect.objectContaining({ scroll: false }));
  });

  it("keeps other query params when it strips authError", () => {
    params.mockReturnValue(new URLSearchParams("tab=board&authError=timeout"));
    render(<AuthErrorToast />);
    expect(replace).toHaveBeenCalledWith("/?tab=board", expect.objectContaining({ scroll: false }));
  });

  it("dismisses when the reader clicks it away", async () => {
    params.mockReturnValue(new URLSearchParams("authError=permissions"));
    render(<AuthErrorToast />);
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
