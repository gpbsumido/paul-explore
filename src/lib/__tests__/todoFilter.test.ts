import { describe, it, expect } from "vitest";
import { filterTodos, type TodoFilter } from "@/lib/todoFilter";

const todo = (id: string, done: boolean) =>
  ({ id, done }) as { id: string; done: boolean };

const items = [
  todo("a", false),
  todo("b", true),
  todo("c", false),
  todo("d", true),
];

describe("filterTodos", () => {
  it("shows everything by default", () => {
    expect(filterTodos(items, "all").map((t) => t.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("shows only what is left", () => {
    expect(filterTodos(items, "open").map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("shows only what is finished", () => {
    expect(filterTodos(items, "done").map((t) => t.id)).toEqual(["b", "d"]);
  });

  it("preserves the incoming order rather than regrouping", () => {
    // Ordering is the point of this page; a filter must not reshuffle phases.
    const reversed = [...items].reverse();
    expect(filterTodos(reversed, "open").map((t) => t.id)).toEqual(["c", "a"]);
  });

  it("returns an empty list rather than throwing when nothing matches", () => {
    expect(filterTodos([todo("a", false)], "done")).toEqual([]);
  });

  it("handles an empty input", () => {
    for (const f of ["all", "open", "done"] as TodoFilter[]) {
      expect(filterTodos([], f)).toEqual([]);
    }
  });
});
