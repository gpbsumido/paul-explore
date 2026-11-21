import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import QueryError from "./QueryError";

describe("QueryError", () => {
  it("shows the message and calls onRetry when Try again is clicked", () => {
    const onRetry = vi.fn();
    render(
      <QueryError message="The board is unavailable right now." onRetry={onRetry} />,
    );
    expect(
      screen.getByText("The board is unavailable right now."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("surfaces the server detail when given", () => {
    render(
      <QueryError
        message="Couldn't load your profile right now."
        detail="Request failed: 503"
        onRetry={() => {}}
      />,
    );
    expect(screen.getByText("Request failed: 503")).toBeInTheDocument();
  });

  it("shows no detail line when the server gave none", () => {
    const { rerender } = render(
      <QueryError message="Down." onRetry={() => {}} />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.querySelectorAll("p")).toHaveLength(1);

    rerender(<QueryError message="Down." detail={null} onRetry={() => {}} />);
    expect(alert.querySelectorAll("p")).toHaveLength(1);
    expect(alert).not.toHaveTextContent(/null|undefined/);
  });

  it("is announced as an alert", () => {
    render(<QueryError message="Down." onRetry={() => {}} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
