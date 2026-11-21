import { describe, it, expect } from "vitest";
import {
  filterTodos,
  TODO_FILTERS,
  TODO_FILTER_LABEL,
  type TodoFilter,
} from "@/lib/todoFilter";

const todo = (id: string, done: boolean): { id: string; done: boolean } => ({ id, done });

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

  it("hands back a copy, so sorting the result can't reorder the caller's list", () => {
    const shown = filterTodos(items, "all");
    expect(shown).not.toBe(items);
    shown.reverse();
    expect(items.map((t) => t.id)).toEqual(["a", "b", "c", "d"]);
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

describe("TODO_FILTERS", () => {
  it("offers every filter once, each with its own button label", () => {
    expect(TODO_FILTERS).toEqual(["all", "open", "done"]);
    const labels = TODO_FILTERS.map((filter) => TODO_FILTER_LABEL[filter]);
    expect(new Set(labels).size).toBe(TODO_FILTERS.length);
    expect(labels.every((label) => label.length > 0)).toBe(true);
  });
});
