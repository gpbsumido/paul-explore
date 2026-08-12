"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Chip } from "@/components/ui";
import TodoSkeleton from "./TodoSkeleton";

export type Todo = {
  id: string;
  project: string;
  phase: number;
  position: number;
  title: string;
  detail: string | null;
  blocking: boolean;
  command: string | null;
  pr_repo: string | null;
  pr_number: number | null;
  done: boolean;
  done_at: string | null;
};

/**
 * Phases are a hard sequence: phase N+1 should not start before N is finished.
 * Items inside a phase are not ordered relative to each other unless position
 * says so, which is what the PR chain uses.
 */
const PHASE_LABEL: Record<number, string> = {
  1: "Merge and deploy",
  2: "Right after deploy",
  3: "Turn on what shipped inert",
  4: "Backlog",
};

const PHASE_NOTE: Record<number, string> = {
  1: "In this order — the PRs are stacked and the last one depends on the others being live.",
  2: "Do this immediately, before anything else.",
  3: "Independent of each other. Each shipped switched off and needs a value set.",
  4: "No deadline. Here so it stops living in my head.",
};

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch("/api/todos");
  if (!res.ok) throw new Error("Could not load the list");
  const body = (await res.json()) as { todos: Todo[] };
  return body.todos;
}

export default function TodoContent() {
  const queryClient = useQueryClient();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.todos(),
    queryFn: fetchTodos,
  });

  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error("Could not save that");
    },
    // Optimistic, with the rollback the optimism depends on. A tick that
    // silently fails would make the list lie, which is worse than a slow tick.
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos() });
      const previous = queryClient.getQueryData<Todo[]>(queryKeys.todos());
      queryClient.setQueryData<Todo[]>(queryKeys.todos(), (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, done } : t)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.todos(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos() });
    },
  });

  const phases = useMemo(() => {
    const open = (data ?? []).filter((t) => !t.done);
    const byPhase = new Map<number, Todo[]>();
    for (const todo of data ?? []) {
      const list = byPhase.get(todo.phase) ?? [];
      list.push(todo);
      byPhase.set(todo.phase, list);
    }
    return {
      groups: [...byPhase.entries()].sort(([a], [b]) => a - b),
      openCount: open.length,
      doneCount: (data ?? []).length - open.length,
    };
  }, [data]);

  if (isPending) return <TodoSkeleton />;

  if (isError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">To-do</h1>
        <p className="mt-4 text-muted">
          Could not load the list. This is an error, not an empty list — the
          difference matters, so it says so rather than showing nothing.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 rounded border border-border px-3 py-1.5 text-sm"
        >
          Try again
        </button>
      </main>
    );
  }

  if (phases.groups.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">To-do</h1>
        <p className="mt-4 text-muted">
          Nothing outstanding. This list is meant to reach here.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">To-do</h1>
      <p className="mt-2 flex gap-2 text-sm">
        <Chip label={`${phases.openCount} left`} />
        <Chip label={`${phases.doneCount} done`} />
      </p>

      {phases.groups.map(([phase, items]) => (
        <section key={phase} className="mt-8">
          <h2 className="text-lg font-bold">
            {phase}. {PHASE_LABEL[phase] ?? `Phase ${phase}`}
          </h2>
          <p className="mt-1 text-sm text-muted">{PHASE_NOTE[phase] ?? ""}</p>

          <ul className="mt-4 space-y-3">
            {items
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((todo) => (
                <li
                  key={todo.id}
                  className="rounded border border-border p-3"
                  data-done={todo.done}
                >
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={(e) =>
                        toggle.mutate({ id: todo.id, done: e.target.checked })
                      }
                      className="mt-1"
                      aria-label={todo.title}
                    />
                    <span className="min-w-0">
                      <span
                        className={
                          todo.done ? "line-through opacity-60" : "font-medium"
                        }
                      >
                        {todo.title}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-2 text-xs">
                        <Chip label={todo.project} />
                        {todo.blocking && !todo.done ? (
                          <Chip label="blocks the next step" />
                        ) : null}
                        {todo.pr_number ? (
                          <Chip label={`${todo.pr_repo}#${todo.pr_number}`} />
                        ) : null}
                      </span>
                      {todo.detail ? (
                        <span className="mt-2 block text-sm text-muted">
                          {todo.detail}
                        </span>
                      ) : null}
                      {todo.command ? (
                        <code className="mt-2 block overflow-x-auto rounded bg-surface px-2 py-1 text-xs">
                          {todo.command}
                        </code>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
