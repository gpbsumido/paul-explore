import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewSync from "./ReviewSync";

beforeEach(() => window.localStorage.clear());

describe("ReviewSync", () => {
  it("exports the current review progress as a portable string", () => {
    window.localStorage.setItem(
      "interviewee-answered",
      JSON.stringify({ reviewed: { "acme/perf": 1000 } }),
    );
    render(<ReviewSync />);
    const exported = screen.getByLabelText("Export") as HTMLTextAreaElement;
    expect(exported.value).toContain("acme/perf");
  });

  it("merges valid pasted progress and says how much it took", async () => {
    const user = userEvent.setup();
    render(<ReviewSync />);
    const importField = screen.getByLabelText("Import");
    importField.focus();
    // paste, not type — the JSON braces would be read as keyboard modifiers.
    await user.paste(JSON.stringify({ reviewed: { "a/b": 1, "c/d": 2 } }));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByRole("status")).toHaveTextContent(/merged 2 reviewed topics/i);
  });

  it("rejects a paste that isn't exported progress", async () => {
    const user = userEvent.setup();
    render(<ReviewSync />);
    await user.type(screen.getByLabelText("Import"), "nonsense");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByRole("status")).toHaveTextContent(/doesn't look like/i);
  });
});
