"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #e879f9)";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLUMNS = ["Backlog", "Scheduled", "Published"] as const;
type Column = (typeof COLUMNS)[number];

type Post = { id: number; title: string; day: number; column: Column };

const INITIAL: Post[] = [
  { id: 1, title: "Patch 4.1 recap", day: 0, column: "Scheduled" },
  { id: 2, title: "Community art roundup", day: 2, column: "Scheduled" },
  { id: 3, title: "Weekend 2x XP", day: 4, column: "Backlog" },
  { id: 4, title: "Dev livestream teaser", day: 4, column: "Published" },
];

/** Move one post to a target column, leaving the rest untouched. */
export function movePost(posts: Post[], id: number, column: Column): Post[] {
  return posts.map((p) => (p.id === id ? { ...p, column } : p));
}

function Card({
  post,
  onMove,
  onEdit,
}: {
  post: Post;
  onMove: (id: number, dir: -1 | 1) => void;
  onEdit: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: post.id,
  });
  const idx = COLUMNS.indexOf(post.column);
  return (
    <li
      ref={setNodeRef}
      data-post={post.id}
      data-column={post.column}
      // The moving card is drawn by the DragOverlay (which follows the pointer
      // across columns), so the source just dims in place as a placeholder.
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center justify-between gap-1 rounded-md border border-border bg-background px-2 py-1.5"
    >
      <span
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-label={`Edit ${post.title}`}
        onClick={() => onEdit(post.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onEdit(post.id);
          }
        }}
        className="min-w-0 flex-1 cursor-grab truncate text-left text-[12px] text-foreground"
      >
        <span className="mr-1.5 text-[10px] text-muted">{DAYS[post.day]}</span>
        {post.title}
      </span>
      <span className="flex shrink-0 gap-0.5">
        <IconButton
          size="sm"
          aria-label={`Move ${post.title} left`}
          disabled={idx === 0}
          onClick={() => onMove(post.id, -1)}
          className="!h-5 !w-5 text-[10px]"
        >
          ◀
        </IconButton>
        <IconButton
          size="sm"
          aria-label={`Move ${post.title} right`}
          disabled={idx === COLUMNS.length - 1}
          onClick={() => onMove(post.id, 1)}
          className="!h-5 !w-5 text-[10px]"
        >
          ▶
        </IconButton>
      </span>
    </li>
  );
}

function ColumnZone({
  column,
  posts,
  onMove,
  onEdit,
}: {
  column: Column;
  posts: Post[];
  onMove: (id: number, dir: -1 | 1) => void;
  onEdit: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-1.5">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">
        {column} <span className="text-muted/70">{posts.length}</span>
      </h4>
      <ol
        ref={setNodeRef}
        aria-label={column}
        className={`min-h-16 flex-1 space-y-1.5 overflow-y-auto rounded-lg border border-dashed p-1.5 transition-colors ${
          isOver ? "border-foreground/40 bg-foreground/[0.03]" : "border-border"
        }`}
      >
        {posts.map((p) => (
          <Card key={p.id} post={p} onMove={onMove} onEdit={onEdit} />
        ))}
      </ol>
    </div>
  );
}

/** Edit a post's title, scheduled day, and column in a modal. */
function EditPostModal({
  post,
  onClose,
  onSave,
}: {
  post: Post;
  onClose: () => void;
  onSave: (post: Post) => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [day, setDay] = useState(post.day);
  const [column, setColumn] = useState<Column>(post.column);

  return (
    <Modal open onClose={onClose} aria-label={`Edit ${post.title}`}>
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Edit post
        </p>
        <Input
          label="Title"
          size="sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-medium text-foreground">Day</span>
          <select
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-[13px] text-foreground"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-medium text-foreground">Column</span>
          <select
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-[13px] text-foreground"
            value={column}
            onChange={(e) => setColumn(e.target.value as Column)}
          >
            {COLUMNS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!title.trim()}
            onClick={() => onSave({ ...post, title: title.trim(), day, column })}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Vignette: the content engine's scheduling queue as a kanban board. Posts
 * drag between Backlog / Scheduled / Published columns (with move buttons as
 * the keyboard-reachable equivalent), each card opens an edit modal, and the
 * week strip recomputes.
 */
export default function PostQueueDemo({ feature }: { feature: WorkFeature }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const editing = posts.find((p) => p.id === editingId) ?? null;
  const activePost = posts.find((p) => p.id === activeId) ?? null;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const move = (id: number, dir: -1 | 1) =>
    setPosts((ps) => {
      const post = ps.find((p) => p.id === id);
      if (!post) return ps;
      const idx = COLUMNS.indexOf(post.column) + dir;
      if (idx < 0 || idx >= COLUMNS.length) return ps;
      return movePost(ps, id, COLUMNS[idx]);
    });

  const onDragStart = (e: DragStartEvent) => setActiveId(Number(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const target = e.over?.id;
    if (typeof target === "string" && COLUMNS.includes(target as Column)) {
      setPosts((ps) => movePost(ps, Number(e.active.id), target as Column));
    }
  };

  const perDay = DAYS.map((_, d) => posts.filter((p) => p.day === d).length);
  const max = Math.max(1, ...perDay);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">
        {feature.title}
      </p>

      <div className="flex items-end gap-1">
        {DAYS.map((d, i) => (
          <div key={d} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t"
              style={{
                height: `${8 + (perDay[i] / max) * 32}px`,
                backgroundColor: perDay[i]
                  ? ACCENT
                  : "var(--color-border,#8884)",
              }}
            />
            <span className="text-[9px] text-muted">{d}</span>
          </div>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
          {COLUMNS.map((c) => (
            <ColumnZone
              key={c}
              column={c}
              posts={posts.filter((p) => p.column === c)}
              onMove={move}
              onEdit={setEditingId}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activePost ? (
            <div className="flex cursor-grabbing items-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground shadow-lg">
              <span className="mr-1.5 text-[10px] text-muted">
                {DAYS[activePost.day]}
              </span>
              {activePost.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editing && (
        <EditPostModal
          post={editing}
          onClose={() => setEditingId(null)}
          onSave={(updated) => {
            setPosts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
