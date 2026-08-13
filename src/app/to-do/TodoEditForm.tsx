"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { Todo } from "./TodoContent";

const PROJECTS = ["portfolio_api", "paul-explore", "all"] as const;
const PHASES = [1, 2, 3, 4] as const;

/** Only the fields a person edits. position and done_at are the server's. */
type Draft = {
  title: string;
  project: string;
  phase: number;
  detail: string;
  reason: string;
  command: string;
  pr_repo: string;
  pr_number: string;
  blocking: boolean;
};

const draftFrom = (todo: Todo): Draft => ({
  title: todo.title,
  project: todo.project,
  phase: todo.phase,
  detail: todo.detail ?? "",
  reason: todo.reason ?? "",
  command: todo.command ?? "",
  pr_repo: todo.pr_repo ?? "",
  pr_number: todo.pr_number === null ? "" : String(todo.pr_number),
  blocking: todo.blocking,
});

/** Empty means null, not an empty string — the column is nullable, not blank. */
const orNull = (value: string): string | null => (value.trim() ? value.trim() : null);

/**
 * Only what actually changed.
 *
 * Sending the whole row would record a revision claiming every field moved,
 * which makes the timeline useless for the thing it exists to answer. It also
 * means two people editing different fields do not clobber each other, which
 * matters less today and costs nothing to get right.
 */
function changedFields(todo: Todo, draft: Draft): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (draft.title.trim() !== todo.title) patch.title = draft.title.trim();
  if (draft.project !== todo.project) patch.project = draft.project;
  if (draft.phase !== todo.phase) patch.phase = draft.phase;
  if (orNull(draft.detail) !== todo.detail) patch.detail = orNull(draft.detail);
  if (orNull(draft.reason) !== todo.reason) patch.reason = orNull(draft.reason);
  if (orNull(draft.command) !== todo.command) patch.command = orNull(draft.command);
  if (orNull(draft.pr_repo) !== todo.pr_repo) patch.pr_repo = orNull(draft.pr_repo);
  if (draft.blocking !== todo.blocking) patch.blocking = draft.blocking;

  const prNumber = draft.pr_number.trim() ? Number(draft.pr_number.trim()) : null;
  if (prNumber !== todo.pr_number) patch.pr_number = prNumber;

  return patch;
}

const field = "mt-1 block w-full rounded border border-border bg-transparent px-2 py-1 text-xs";
const label = "text-xs font-medium";

/**
 * Editing an existing item.
 *
 * Quick add deliberately takes a title and a project only, so everything else
 * has to be fillable later — and until now "later" meant running a script
 * against the database. This is where reason finally becomes settable from the
 * page it is displayed on.
 */
export default function TodoEditForm({
  todo,
  onDone,
}: {
  todo: Todo;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(todo));

  const patch = changedFields(todo, draft);
  const hasChanges = Object.keys(patch).length > 0;

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Could not save that");
    },
    onSuccess: () => {
      // Everything under the todos key: the row, and the timeline that just
      // gained a revision recording this edit.
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos() });
      onDone();
    },
  });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="mt-3">
      <label className={label} htmlFor={`title-${todo.id}`}>
        Title
      </label>
      <input
        id={`title-${todo.id}`}
        value={draft.title}
        onChange={(e) => set("title", e.target.value)}
        className={field}
      />

      <label className={`${label} mt-3 block`} htmlFor={`reason-${todo.id}`}>
        Why it exists
      </label>
      <textarea
        id={`reason-${todo.id}`}
        value={draft.reason}
        onChange={(e) => set("reason", e.target.value)}
        rows={2}
        className={field}
        placeholder="Why this is on the list at all, as opposed to what to do about it"
      />

      <label className={`${label} mt-3 block`} htmlFor={`detail-${todo.id}`}>
        Detail
      </label>
      <textarea
        id={`detail-${todo.id}`}
        value={draft.detail}
        onChange={(e) => set("detail", e.target.value)}
        rows={3}
        className={field}
      />

      <div className="mt-3 flex flex-wrap gap-4">
        <span>
          <span className={label}>Project</span>
          <span role="group" aria-label="Project" className="mt-1 flex gap-2">
            {PROJECTS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => set("project", option)}
                aria-pressed={draft.project === option}
                className={`rounded border px-2 py-0.5 text-xs ${
                  draft.project === option
                    ? "border-foreground font-medium"
                    : "border-border text-muted"
                }`}
              >
                {option}
              </button>
            ))}
          </span>
        </span>

        <span>
          <span className={label}>Phase</span>
          <span role="group" aria-label="Phase" className="mt-1 flex gap-2">
            {PHASES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => set("phase", option)}
                aria-pressed={draft.phase === option}
                className={`rounded border px-2 py-0.5 text-xs ${
                  draft.phase === option
                    ? "border-foreground font-medium"
                    : "border-border text-muted"
                }`}
              >
                {option}
              </button>
            ))}
          </span>
        </span>
      </div>

      {draft.phase !== todo.phase ? (
        <p className="mt-2 text-xs text-muted">
          Moving phase puts this at the end of phase {draft.phase}. Positions are
          only ordered within a phase, so it cannot keep its current place.
        </p>
      ) : null}

      <label className={`${label} mt-3 block`} htmlFor={`command-${todo.id}`}>
        Command
      </label>
      <input
        id={`command-${todo.id}`}
        value={draft.command}
        onChange={(e) => set("command", e.target.value)}
        className={field}
      />

      <div className="mt-3 flex flex-wrap gap-3">
        <span className="flex-1">
          <label className={label} htmlFor={`pr-repo-${todo.id}`}>
            PR repo
          </label>
          <input
            id={`pr-repo-${todo.id}`}
            value={draft.pr_repo}
            onChange={(e) => set("pr_repo", e.target.value)}
            className={field}
          />
        </span>
        <span className="flex-1">
          <label className={label} htmlFor={`pr-number-${todo.id}`}>
            PR number
          </label>
          <input
            id={`pr-number-${todo.id}`}
            value={draft.pr_number}
            inputMode="numeric"
            onChange={(e) => set("pr_number", e.target.value)}
            className={field}
          />
        </span>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={draft.blocking}
          onChange={(e) => set("blocking", e.target.checked)}
        />
        Blocks the next step
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={!hasChanges || save.isPending || !draft.title.trim()}
          className="rounded border border-foreground px-3 py-1 text-xs font-medium disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded border border-border px-3 py-1 text-xs text-muted"
        >
          Cancel
        </button>
        {/* Says which fields will move, so saving is not a leap of faith and the
            revision it writes is predictable. */}
        {hasChanges ? (
          <span className="text-xs text-muted">
            Changing {Object.keys(patch).sort().join(", ")}
          </span>
        ) : (
          <span className="text-xs text-muted">No changes yet</span>
        )}
      </div>

      {save.isError ? (
        <p role="alert" className="mt-2 text-xs text-muted">
          Could not save that. Your edits are still here, so try again.
        </p>
      ) : null}
    </div>
  );
}
