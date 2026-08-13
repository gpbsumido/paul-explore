"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { Todo } from "./TodoContent";

/**
 * Free text upstream, so adding a repo needs no migration. Fixed here because
 * a text box for the project would invite three spellings of the same thing.
 */
const PROJECTS = ["portfolio_api", "paul-explore", "all"] as const;

/** Quick add always lands in the backlog, so it never claims to be urgent. */
const BACKLOG_PHASE = 4;

type AddVars = { title: string; project: string; tempId: string };

/**
 * Quick add: a title and a project, nothing else.
 *
 * The point is that a thought gets recorded when you have it. A form with seven
 * fields does not get used for that, so detail, command and the PR link are
 * filled in later.
 */
export default function TodoAddForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [project, setProject] = useState<string>(PROJECTS[0]);

  const add = useMutation({
    mutationFn: async ({ title, project }: AddVars) => {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, project }),
      });
      if (!res.ok) throw new Error("Could not add that");
      return (await res.json()) as { todo: Todo };
    },
    onMutate: async ({ title, project, tempId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos() });
      const optimistic: Todo = {
        id: tempId,
        project,
        phase: BACKLOG_PHASE,
        // Sorts last within the phase until the server says otherwise, which is
        // where a new item belongs anyway.
        position: Number.MAX_SAFE_INTEGER,
        title,
        detail: null,
        reason: null,
        blocking: false,
        command: null,
        pr_repo: null,
        pr_number: null,
        done: false,
        done_at: null,
      };
      queryClient.setQueryData<Todo[]>(queryKeys.todos(), (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { tempId };
    },
    // Removes the row we added rather than the last one, which is not the same
    // thing the moment two adds are in flight.
    onError: (_err, _vars, context) => {
      queryClient.setQueryData<Todo[]>(queryKeys.todos(), (old) =>
        (old ?? []).filter((t) => t.id !== context?.tempId),
      );
    },
    // Only cleared once it is really saved. Losing a sentence you just typed
    // because the network blinked is what stops a tool being used.
    onSuccess: () => setTitle(""),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos() });
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    add.mutate({ title: trimmed, project, tempId: crypto.randomUUID() });
  };

  return (
    <form onSubmit={submit} className="mt-6 rounded border border-border p-3">
      <label htmlFor="new-todo" className="text-sm font-medium">
        New to-do
      </label>
      <input
        id="new-todo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Something you want off your mind"
        className="mt-1 block w-full rounded border border-border bg-transparent px-2 py-1.5 text-sm"
      />

      <div
        role="group"
        aria-label="Project"
        className="mt-3 flex flex-wrap gap-2"
      >
        {PROJECTS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setProject(option)}
            aria-pressed={project === option}
            className={`rounded border px-3 py-1 text-xs ${
              project === option
                ? "border-foreground font-medium"
                : "border-border text-muted"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={add.isPending}
        className="mt-3 rounded border border-foreground px-3 py-1.5 text-sm font-medium disabled:opacity-60"
      >
        {add.isPending ? "Adding…" : "Add to backlog"}
      </button>

      {add.isError ? (
        <p role="alert" className="mt-2 text-sm text-muted">
          Could not add that. The text is still here, so try again.
        </p>
      ) : null}
    </form>
  );
}
