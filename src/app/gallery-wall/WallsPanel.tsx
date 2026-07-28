"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listWalls,
  getWall,
  createWall,
  updateWall,
  deleteWall,
  type FilesById,
  type WallSummary,
} from "./_lib/walls-api";
import type { GalleryState } from "./_lib/state";

const ACCENT = "#e879f9";

type WallsPanelProps = {
  /** The arrangement that Save writes. */
  state: GalleryState;
  /** Files for photos that haven't been uploaded yet, read at save time. */
  getFiles: () => FilesById;
  /** False while the arrangement is invalid, which blocks saving. */
  canSave: boolean;
  /** Hands back a wall's arrangement when one is opened. */
  onOpen: (state: GalleryState) => void;
  /** Clears the wall so the user can start over. */
  onNew: () => void;
};

/**
 * Manages the user's saved gallery walls: name the current one, save it, open a
 * saved wall, rename it, or delete it. Walls live in S3 behind the `/api/walls`
 * BFF routes, one folder per wall, scoped to the signed-in user.
 *
 * Saving with a wall open updates that wall; saving without one creates a new
 * wall under the typed name.
 */
export default function WallsPanel({
  state,
  getFiles,
  canSave,
  onOpen,
  onNew,
}: WallsPanelProps) {
  const [walls, setWalls] = useState<WallSummary[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setWalls(await listWalls());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your walls.");
    }
  }, []);

  // Fetching the wall list is exactly the "subscribe to an external system"
  // case the rule carves out; the setState lands in the promise callback, not
  // synchronously in the effect body.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  /** Run a save/delete style action with the shared busy and error handling. */
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      const input = { state, filesById: getFiles() };
      const saved = currentId
        ? await updateWall(currentId, { ...input, name: name || undefined })
        : await createWall({ ...input, name: name.trim() || "Untitled wall" });
      setCurrentId(saved.id);
      setName(saved.name);
      setSavedAt(new Date().toLocaleTimeString());
      await refresh();
    });

  const open = (wall: WallSummary) =>
    run(async () => {
      const full = await getWall(wall.id);
      setCurrentId(full.id);
      setName(full.name);
      setSavedAt(null);
      onOpen(full.state);
    });

  const startNew = () => {
    setCurrentId(null);
    setName("");
    setSavedAt(null);
    setError(null);
    onNew();
  };

  const commitRename = (wall: WallSummary) =>
    run(async () => {
      const next = renameText.trim();
      if (next && next !== wall.name) {
        await updateWall(wall.id, { name: next, state, filesById: {} });
        if (currentId === wall.id) setName(next);
      }
      setRenamingId(null);
      await refresh();
    });

  const confirmDelete = (wall: WallSummary) =>
    run(async () => {
      await deleteWall(wall.id);
      if (currentId === wall.id) startNew();
      setConfirmingId(null);
      await refresh();
    });

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Saved walls</h2>
        <button
          type="button"
          onClick={startNew}
          className="rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          New wall
        </button>
      </div>

      <label className="block text-[13px] text-muted">
        Wall name
        <input
          type="text"
          value={name}
          placeholder="Untitled wall"
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!canSave || busy}
          className="rounded-md border border-transparent px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: ACCENT }}
        >
          Save
        </button>
        {currentId ? (
          <span className="text-[12px] text-muted">Editing a saved wall.</span>
        ) : null}
      </div>

      {savedAt ? (
        <p role="status" className="mt-2 text-[12px] text-muted">
          Saved at {savedAt}.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-[12px] font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <div className="mt-4 border-t border-border pt-3">
        {walls.length === 0 ? (
          <p className="text-[12px] text-muted">No saved walls yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {walls.map((wall) => (
              <li key={wall.id} className="rounded-lg border border-border p-2">
                {renamingId === wall.id ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] text-muted">
                      New name for {wall.name}
                      <input
                        type="text"
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1 text-[13px] text-foreground"
                      />
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => commitRename(wall)}
                        disabled={busy}
                        className="rounded-md border border-border px-2 py-1 text-[12px] text-foreground transition-colors hover:border-foreground/30 disabled:opacity-40"
                      >
                        Confirm rename
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingId(null)}
                        className="rounded-md border border-border px-2 py-1 text-[12px] text-muted transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : confirmingId === wall.id ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-[12px] text-foreground">
                      Delete {wall.name} and its photos?
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => confirmDelete(wall)}
                        disabled={busy}
                        className="rounded-md border border-red-500/40 px-2 py-1 text-[12px] text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-40 dark:text-red-400"
                      >
                        Confirm delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="rounded-md border border-border px-2 py-1 text-[12px] text-muted transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                      {wall.name}
                      {currentId === wall.id ? (
                        <span className="ml-1 text-[11px] text-muted">(open)</span>
                      ) : null}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => open(wall)}
                        disabled={busy}
                        aria-label={`Open ${wall.name}`}
                        className="rounded-md border border-border px-2 py-1 text-[12px] text-foreground transition-colors hover:border-foreground/30 disabled:opacity-40"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(wall.id);
                          setRenameText(wall.name);
                        }}
                        aria-label={`Rename ${wall.name}`}
                        className="rounded-md border border-border px-2 py-1 text-[12px] text-muted transition-colors hover:text-foreground"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(wall.id)}
                        aria-label={`Delete ${wall.name}`}
                        className="rounded-md border border-border px-2 py-1 text-[12px] text-muted transition-colors hover:border-red-500/40 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
