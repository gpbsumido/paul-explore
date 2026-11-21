import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
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

/**
 * The toast is raised a frame after mount, so "nothing showed up" is only
 * meaningful once that frame has gone by. Without this the silent cases pass
 * simply because they look before the toast could have appeared.
 */
const afterNextFrame = () =>
  act(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );

describe("AuthErrorToast", () => {
  it("stays silent when there is no auth error in the URL", async () => {
    params.mockReturnValue(new URLSearchParams());
    render(<AuthErrorToast />);
    await afterNextFrame();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("explains you can't log in without granting permissions", async () => {
    params.mockReturnValue(new URLSearchParams("authError=permissions"));
    render(<AuthErrorToast />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/permission/i);
  });

  it("tells you when the session timed out", async () => {
    params.mockReturnValue(new URLSearchParams("authError=timeout"));
    render(<AuthErrorToast />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/timed out/i);
  });

  it("ignores auth error codes it doesn't recognise", async () => {
    params.mockReturnValue(new URLSearchParams("authError=whatever"));
    render(<AuthErrorToast />);
    await afterNextFrame();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("strips authError from the URL so it doesn't re-fire on return", async () => {
    params.mockReturnValue(new URLSearchParams("authError=timeout"));
    render(<AuthErrorToast />);
    // The message still shows...
    expect(await screen.findByRole("alert")).toHaveTextContent(/timed out/i);
    // ...but the URL is cleaned (replace, not push) so returning here is silent.
    expect(replace).toHaveBeenCalledWith("/", expect.objectContaining({ scroll: false }));
  });

  it("keeps other query params when it strips authError", async () => {
    params.mockReturnValue(new URLSearchParams("tab=board&authError=timeout"));
    render(<AuthErrorToast />);
    await screen.findByRole("alert");
    expect(replace).toHaveBeenCalledWith("/?tab=board", expect.objectContaining({ scroll: false }));
  });

  it("dismisses when the reader clicks it away", async () => {
    params.mockReturnValue(new URLSearchParams("authError=permissions"));
    render(<AuthErrorToast />);
    await userEvent.click(await screen.findByRole("button", { name: /dismiss/i }));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });

  it("clears itself after a few seconds if nobody dismisses it", async () => {
    // Only setTimeout is faked, so the frame that raises the toast and the exit
    // animation still run on real frames.
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      params.mockReturnValue(new URLSearchParams("authError=timeout"));
      render(<AuthErrorToast />);
      await afterNextFrame();
      expect(screen.getByRole("alert")).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(5_000));
      await afterNextFrame();
      expect(screen.getByRole("alert")).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(2_000));
      for (let frame = 0; frame < 60; frame += 1) {
        if (!screen.queryByRole("alert")) break;
        await afterNextFrame();
      }
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
