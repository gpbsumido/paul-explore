import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchDemo from "./SearchDemo";
import { Demo_Threads } from "@/lib/threads";

describe("SearchDemo", () => {
  it("lists every thread before anything is typed", () => {
    render(<SearchDemo />);

    for (const thread of Demo_Threads) {
      expect(screen.getByText(thread.name)).toBeInTheDocument();
    }
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
  });

  it("narrows to the threads whose name matches, ignoring case", async () => {
    const user = userEvent.setup();
    render(<SearchDemo />);

    await user.type(screen.getByPlaceholderText("Search threads..."), "NBA");

    expect(screen.getByText("NBA Stats")).toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Authentication")).not.toBeInTheDocument();
  });

  it("also matches on the preview text, not just the name", async () => {
    const user = userEvent.setup();
    render(<SearchDemo />);

    // "tailwind" only appears in the Styling Decisions preview.
    await user.type(screen.getByPlaceholderText("Search threads..."), "tailwind");

    expect(screen.getByText("Styling Decisions")).toBeInTheDocument();
    expect(screen.queryByText("NBA Stats")).not.toBeInTheDocument();
  });

  it("says there are no results when nothing matches, and brings the list back when the box is cleared", async () => {
    const user = userEvent.setup();
    render(<SearchDemo />);
    const box = screen.getByPlaceholderText("Search threads...");

    await user.type(box, "zzzz");
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();

    await user.clear(box);
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });
});
