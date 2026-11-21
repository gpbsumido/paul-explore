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

  it("goes back to private when the public box is unticked", () => {
    const onSetVisibility = vi.fn();
    render(<Sharing {...base} visibility="public" onSetVisibility={onSetVisibility} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /make this budget public/i }));
    expect(onSetVisibility).toHaveBeenCalledWith("private");
  });

  it("shows the owner's email to ask on once public", () => {
    render(<Sharing {...base} visibility="public" ownerEmail="owner@example.com" />);
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.queryByText("me@example.com")).toBeNull();
  });

  it("falls back to the signed-in email when the budget has no owner email", () => {
    render(<Sharing {...base} visibility="public" ownerEmail={undefined} />);
    expect(screen.getByText("me@example.com")).toBeInTheDocument();
  });

  it("falls back to a generic phrase when no email is known at all", () => {
    render(<Sharing {...base} visibility="public" meEmail={undefined} />);
    expect(screen.getByText("your account email")).toBeInTheDocument();
  });

  it("does not advertise an email while the budget is private", () => {
    render(<Sharing {...base} visibility="private" ownerEmail="owner@example.com" />);
    expect(screen.queryByText("owner@example.com")).toBeNull();
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

  it("approves a request by its id, not just the first one", () => {
    const onApprove = vi.fn();
    render(
      <Sharing
        {...base}
        joinRequests={[
          { id: "r-1", name: "Sam", email: "sam@example.com", createdAt: "2026-09-14T00:00:00Z" },
          { id: "r-2", name: "Kim", email: "kim@example.com", createdAt: "2026-09-14T00:00:00Z" },
        ]}
        onApprove={onApprove}
      />,
    );
    const second = screen.getByText("Kim").closest("li") as HTMLElement;
    fireEvent.click(within(second).getByRole("button", { name: /approve/i }));
    expect(onApprove).toHaveBeenCalledWith("r-2");
  });

  it("denies a request by its id", () => {
    const onDeny = vi.fn();
    render(
      <Sharing
        {...base}
        joinRequests={[
          { id: "r-1", name: "Sam", email: "sam@example.com", createdAt: "2026-09-14T00:00:00Z" },
          { id: "r-2", name: "Kim", email: "kim@example.com", createdAt: "2026-09-14T00:00:00Z" },
        ]}
        onDeny={onDeny}
      />,
    );
    const second = screen.getByText("Kim").closest("li") as HTMLElement;
    fireEvent.click(within(second).getByRole("button", { name: /deny/i }));
    expect(onDeny).toHaveBeenCalledWith("r-2");
  });

  it("shows no request list when nobody has asked", () => {
    render(<Sharing {...base} />);
    expect(screen.queryByRole("list", { name: /join requests/i })).toBeNull();
  });

  it("trims what was typed and clears the form after asking", () => {
    const onRequestJoin = vi.fn();
    render(<Sharing {...base} onRequestJoin={onRequestJoin} />);
    fireEvent.change(screen.getByLabelText(/owner.?s email/i), {
      target: { value: "  owner@example.com " },
    });
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: " Sam  " } });
    fireEvent.click(screen.getByRole("button", { name: /ask to join/i }));
    expect(onRequestJoin).toHaveBeenCalledWith({ name: "Sam", email: "owner@example.com" });
    expect(screen.getByLabelText(/owner.?s email/i)).toHaveValue("");
    expect(screen.getByLabelText(/your name/i)).toHaveValue("");
  });

  it.each([
    ["no email", "", "Sam"],
    ["no name", "owner@example.com", ""],
    ["only whitespace", "   ", "  "],
  ])("does not ask to join with %s", (_label, email, name) => {
    const onRequestJoin = vi.fn();
    render(<Sharing {...base} onRequestJoin={onRequestJoin} />);
    fireEvent.change(screen.getByLabelText(/owner.?s email/i), { target: { value: email } });
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: name } });
    fireEvent.click(screen.getByRole("button", { name: /ask to join/i }));
    expect(onRequestJoin).not.toHaveBeenCalled();
  });
});
