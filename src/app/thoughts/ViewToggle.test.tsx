import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ViewToggle from "./ViewToggle";

describe("ViewToggle", () => {
  it("asks for the chat view when Chat is clicked", async () => {
    const user = userEvent.setup();
    const setView = vi.fn();
    render(<ViewToggle view="summary" setView={setView} />);

    await user.click(screen.getByRole("button", { name: "Chat" }));

    expect(setView).toHaveBeenCalledExactlyOnceWith("chat");
  });

  it("asks for the summary view when Summary is clicked", async () => {
    const user = userEvent.setup();
    const setView = vi.fn();
    render(<ViewToggle view="chat" setView={setView} />);

    await user.click(screen.getByRole("button", { name: "Summary" }));

    expect(setView).toHaveBeenCalledExactlyOnceWith("summary");
  });
});
