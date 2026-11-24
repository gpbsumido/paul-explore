import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import CodeExample from "./CodeExample";

const example = {
  title: "Max heap from a min heap",
  explanation: "Flip the comparator.",
  code: "const h = new MinHeap<number>((a, b) => b - a);",
  cases: [{ call: "h.pop()", expected: 5 }],
};

describe("CodeExample", () => {
  it("lets a keyboard user scroll the code sideways", () => {
    render(<CodeExample example={example} />);
    const region = screen.getByRole("region", { name: /code for max heap/i });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveTextContent("new MinHeap<number>");
  });

  it("lets a keyboard user scroll the checks sideways as one stop", () => {
    render(<CodeExample example={example} />);
    const region = screen.getByRole("region", {
      name: "Scrollable checks for Max heap from a min heap",
    });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(
      within(region).getByRole("list", {
        name: "Checks for Max heap from a min heap",
      }),
    ).toBeInTheDocument();
    expect(within(region).getAllByRole("listitem")).toHaveLength(1);
  });

  it("keeps each check line out of the tab order", () => {
    render(<CodeExample example={example} />);
    for (const item of screen.getAllByRole("listitem")) {
      expect(item).not.toHaveAttribute("tabindex");
    }
  });

  it("reads each check as a call that returns a value", () => {
    render(<CodeExample example={example} />);
    expect(screen.getByRole("listitem")).toHaveTextContent("h.pop() →returns 5");
  });

  it("leaves out the checks region when there are no cases", () => {
    render(<CodeExample example={{ ...example, cases: [] }} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: /code for max heap/i })).toBeInTheDocument();
  });
});
