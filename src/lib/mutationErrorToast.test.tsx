import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Toaster } from "@paul-portfolio/react";
import { notifyMutationError } from "./mutationErrorToast";

// The Toaster store is a module-level singleton, so clear anything a test raised.
afterEach(() => {
  document.querySelectorAll(".toast__dismiss").forEach((btn) => {
    act(() => fireEvent.click(btn));
  });
});

describe("notifyMutationError", () => {
  it("toasts the error's own message", () => {
    render(<Toaster />);
    act(() =>
      notifyMutationError(
        new Error("You already have an active season wallet"),
      ),
    );
    expect(
      screen.getByText(/already have an active season wallet/i),
    ).toBeInTheDocument();
  });

  it("stays silent when the mutation opts out", () => {
    render(<Toaster />);
    act(() => notifyMutationError(new Error("Boom"), { silent: true }));
    expect(screen.queryByText("Boom")).not.toBeInTheDocument();
  });

  it("falls back to a plain message when there's no usable one", () => {
    render(<Toaster />);
    act(() => notifyMutationError("weird"));
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
