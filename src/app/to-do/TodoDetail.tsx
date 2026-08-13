"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Chip } from "@/components/ui";
import type { Todo } from "./TodoContent";

export type TodoRevision = {
  id: string;
  revision: number;
  change_kind: string;
  snapshot: Todo;
  reverted_from: string | null;
  actor: string | null;
  created_at: string;
};

export type TodoComment = {
  id: string;
  body: string;
  actor: string | null;
  created_at: string;
  updated_at: string;
};

/** Reads better than the raw column, and keeps the timeline scannable. */
const KIND_LABEL: Record<string, string> = {
  created: "created",
  updated: "edited",
  ticked: "ticked",
  unticked: "un-ticked",
  removed: "removed",
  reverted: "reverted",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

async function getJson<T>(url: string, what: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${what}`);
  return (await res.json()) as T;
}

/**
 * The expandable panel under one to-do: its timeline, and notes on it.
 *
 * Only mounted when the row is open, so an unopened list costs nothing extra —
 * the page renders tens of rows and none of them need this until asked.
 */
export default function TodoDetail({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"history" | "comments">("history");
  const [confirming, setConfirming] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const revisions = useQuery({
    queryKey: queryKeys.todoRevisions(todo.id),
    queryFn: () =>
      getJson<{ revisions: TodoRevision[] }>(
        `/api/todos/${todo.id}/revisions`,
        "the history",
      ).then((r) => r.revisions),
    enabled: tab === "history",
  });

  const comments = useQuery({
    queryKey: queryKeys.todoComments(todo.id),
    queryFn: () =>
      getJson<{ comments: TodoComment[] }>(
        `/api/todos/${todo.id}/comments`,
        "the comments",
      ).then((r) => r.comments),
    enabled: tab === "comments",
  });

  // Everything under the "todos" key, so the list and this panel agree again
  // afterwards. A revert that left a stale timeline on screen would be hiding
  // the very change it just made.
  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.todos() });
  };

  const revert = useMutation({
    mutationFn: async (revision: number) => {
      const res = await fetch(`/api/todos/${todo.id}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision }),
      });
      if (!res.ok) throw new Error("Could not revert");
    },
    onSuccess: () => {
      setConfirming(null);
      refreshAll();
    },
  });

  const addComment = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/todos/${todo.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Could not add that");
    },
    // Cleared only once it has really landed, so a failed write keeps the text.
    onSuccess: () => {
      setDraft("");
      refreshAll();
    },
  });

  const editComment = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const res = await fetch(`/api/todos/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Could not save that");
    },
    onSuccess: () => {
      setEditing(null);
      refreshAll();
    },
  });

  const removeComment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/todos/comments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove that");
    },
    onSuccess: refreshAll,
  });

  const tabButton = (value: "history" | "comments", label: string) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      aria-pressed={tab === value}
      className={`rounded border px-2 py-0.5 text-xs ${
        tab === value
          ? "border-foreground font-medium"
          : "border-border text-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-3 rounded border border-border p-3">
      <div role="group" aria-label="Item detail" className="flex gap-2">
        {tabButton("history", "History")}
        {tabButton("comments", "Comments")}
      </div>

      {tab === "history" ? (
        <div className="mt-3">
          {revisions.isPending ? (
            <p className="text-xs text-muted">Loading the history…</p>
          ) : revisions.isError ? (
            // Distinct from "no history": an empty timeline and a broken
            // request must never look alike.
            <p className="text-xs text-muted">
              Could not load the history.{" "}
              <button
                type="button"
                onClick={() => void revisions.refetch()}
                className="underline"
              >
                Try again
              </button>
            </p>
          ) : revisions.data.length === 0 ? (
            <p className="text-xs text-muted">
              No history yet. Every change from here is recorded.
            </p>
          ) : (
            <ul className="space-y-2">
              {[...revisions.data]
                .sort((a, b) => b.revision - a.revision)
                .map((rev, index) => (
                  <li key={rev.id} className="text-xs">
                    <span className="flex flex-wrap items-center gap-2">
                      <Chip label={`rev ${rev.revision}`} />
                      <span className="font-medium">
                        {KIND_LABEL[rev.change_kind] ?? rev.change_kind}
                      </span>
                      <span className="text-muted">{when(rev.created_at)}</span>
                      {rev.actor ? (
                        <span className="text-muted">{rev.actor}</span>
                      ) : null}
                      {/* Reverting to the state you are already in is a no-op
                          worth not offering. */}
                      {index === 0 ? null : (
                        <button
                          type="button"
                          onClick={() => setConfirming(rev.revision)}
                          className="underline text-muted"
                        >
                          revert here
                        </button>
                      )}
                    </span>
                    <span className="mt-1 block text-muted">
                      {rev.snapshot?.title}
                    </span>

                    {confirming === rev.revision ? (
                      <span className="mt-2 block rounded border border-border p-2">
                        <span className="block">
                          Revert to revision {rev.revision}? The title becomes
                          &ldquo;{rev.snapshot?.title}&rdquo; and it will be
                          marked {rev.snapshot?.done ? "done" : "not done"}.
                        </span>
                        <span className="mt-1 block text-muted">
                          Nothing is deleted — this is recorded as a new
                          revision, so the current state stays in the history.
                        </span>
                        <span className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => revert.mutate(rev.revision)}
                            disabled={revert.isPending}
                            className="rounded border border-foreground px-2 py-0.5 font-medium"
                          >
                            Revert to revision {rev.revision}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(null)}
                            className="rounded border border-border px-2 py-0.5 text-muted"
                          >
                            Cancel
                          </button>
                        </span>
                        {revert.isError ? (
                          <span role="alert" className="mt-1 block text-muted">
                            Could not revert. Nothing changed.
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </li>
                ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-3">
          {comments.isPending ? (
            <p className="text-xs text-muted">Loading the comments…</p>
          ) : comments.isError ? (
            <p className="text-xs text-muted">
              Could not load the comments.{" "}
              <button
                type="button"
                onClick={() => void comments.refetch()}
                className="underline"
              >
                Try again
              </button>
            </p>
          ) : (
            <ul className="space-y-2">
              {comments.data.length === 0 ? (
                <li className="text-xs text-muted">
                  No notes on this one yet.
                </li>
              ) : (
                comments.data.map((comment) => (
                  <li key={comment.id} className="text-xs">
                    {editing === comment.id ? (
                      <span className="block">
                        <label
                          htmlFor={`edit-${comment.id}`}
                          className="sr-only"
                        >
                          Edit comment
                        </label>
                        <textarea
                          id={`edit-${comment.id}`}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={2}
                          className="block w-full rounded border border-border bg-transparent px-2 py-1"
                        />
                        <span className="mt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              editComment.mutate({
                                id: comment.id,
                                body: editDraft,
                              })
                            }
                            disabled={!editDraft.trim()}
                            className="rounded border border-foreground px-2 py-0.5"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="rounded border border-border px-2 py-0.5 text-muted"
                          >
                            Cancel
                          </button>
                        </span>
                      </span>
                    ) : (
                      <span className="block">
                        <span className="block">{comment.body}</span>
                        <span className="mt-1 flex flex-wrap gap-2 text-muted">
                          <span>{when(comment.created_at)}</span>
                          {comment.updated_at !== comment.created_at ? (
                            <span>edited</span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(comment.id);
                              setEditDraft(comment.body);
                            }}
                            className="underline"
                          >
                            edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeComment.mutate(comment.id)}
                            className="underline"
                          >
                            delete
                          </button>
                        </span>
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}

          <div className="mt-3">
            <label htmlFor={`new-comment-${todo.id}`} className="text-xs">
              Add a note
            </label>
            <textarea
              id={`new-comment-${todo.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded border border-border bg-transparent px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (draft.trim()) addComment.mutate(draft.trim());
              }}
              disabled={addComment.isPending}
              className="mt-2 rounded border border-foreground px-2 py-0.5 text-xs font-medium"
            >
              Add comment
            </button>
            {addComment.isError ? (
              <p role="alert" className="mt-1 text-xs text-muted">
                Could not add that. The text is still here, so try again.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
