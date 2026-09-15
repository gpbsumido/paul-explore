import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Sharing from "./Sharing";

const noop = () => {};

const base = {
  visibility: "private" as const,
  ownerEmail: undefined,
  joinRequests: [],
  meEmail: "me@example.com",
  onSetVisibility: noop,
  onRequestJoin: noop,
  onApprove: noop,
  onDeny: noop,
};

describe("Sharing", () => {
  it("toggles the budget public", () => {
    const onSetVisibility = vi.fn();
    render(<Sharing {...base} onSetVisibility={onSetVisibility} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /make this budget public/i }));
    expect(onSetVisibility).toHaveBeenCalledWith("public");
  });

  it("shows the email others use once public", () => {
    render(<Sharing {...base} visibility="public" ownerEmail="me@example.com" />);
    expect(screen.getByText(/me@example.com/)).toBeInTheDocument();
  });

  it("lists pending requests and approves one", () => {
    const onApprove = vi.fn();
    render(
      <Sharing
        {...base}
        joinRequests={[
          { id: "r-1", name: "Sam", email: "sam@example.com", createdAt: "2026-09-14T00:00:00Z" },
        ]}
        onApprove={onApprove}
      />,
    );
    const requests = screen.getByRole("list", { name: /join requests/i });
    expect(within(requests).getByText("Sam")).toBeInTheDocument();
    fireEvent.click(within(requests).getByRole("button", { name: /approve/i }));
    expect(onApprove).toHaveBeenCalledWith("r-1");
  });

  it("submits an ask to join another budget", () => {
    const onRequestJoin = vi.fn();
    render(<Sharing {...base} onRequestJoin={onRequestJoin} />);
    fireEvent.change(screen.getByLabelText(/owner.?s email/i), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Sam" } });
    fireEvent.click(screen.getByRole("button", { name: /ask to join/i }));
    expect(onRequestJoin).toHaveBeenCalledWith({
      name: "Sam",
      email: "owner@example.com",
    });
  });
});
