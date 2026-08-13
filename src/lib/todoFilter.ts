/** Which slice of the to-do list to show. */
export type TodoFilter = "all" | "open" | "done";

export const TODO_FILTERS: readonly TodoFilter[] = ["all", "open", "done"];

/** Human label for each filter, used on the buttons. */
export const TODO_FILTER_LABEL: Record<TodoFilter, string> = {
  all: "All",
  open: "Left to do",
  done: "Finished",
};

/**
 * Narrows a list of todos to one slice.
 *
 * Order is preserved rather than regrouped: phases are a hard sequence on this
 * page, so a filter that reshuffled them would destroy the one thing the list
 * is for.
 */
export function filterTodos<T extends { done: boolean }>(
  todos: readonly T[],
  filter: TodoFilter,
): T[] {
  if (filter === "all") return [...todos];
  const wantDone = filter === "done";
  return todos.filter((todo) => todo.done === wantDone);
}
