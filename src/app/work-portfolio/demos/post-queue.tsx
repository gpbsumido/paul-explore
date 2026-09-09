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

/**
 * Content Engine, poster language: the scheduling queue reimagined as a content
 * pipeline that flows Backlog → Scheduled → Published, with an airtime strip
 * over the top. Drag a post between stages (arrows are the keyboard path), each
 * card opens an editor, and the week strip recomputes. Everything is local.
 */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLUMNS = ["Backlog", "Scheduled", "Published"] as const;
type Column = (typeof COLUMNS)[number];

const COLUMN_COLOR: Record<Column, string> = {
  Backlog: "hsl(258 32% 64%)",
  Scheduled: "hsl(42 100% 62%)",
  Published: "hsl(167 74% 56%)",
};
const poster = "font-display font-bold uppercase tracking-tight";

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
  const color = COLUMN_COLOR[post.column];
  return (
    <li
      ref={setNodeRef}
      data-post={post.id}
      data-column={post.column}
      style={{ opacity: isDragging ? 0.4 : 1, borderLeft: `3px solid ${color}` }}
      className="flex items-center justify-between gap-1 rounded-lg border border-white/10 bg-white/[0.06] py-2 pr-1.5 pl-2.5 backdrop-blur-sm"
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
        className="min-w-0 flex-1 cursor-grab truncate text-left text-[12.5px] font-medium text-foreground"
      >
        <span
          className={`${poster} mr-1.5 rounded px-1 py-0.5 text-[9px] text-background`}
          style={{ background: color }}
        >
          {DAYS[post.day]}
        </span>
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
  const color = COLUMN_COLOR[column];
  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-2">
      <h4 className={`${poster} flex items-center gap-1.5 text-[12px]`}>
        <span
          aria-hidden
          className="h-2 w-2 rounded-full"
          style={{ background: color }}
        />
        <span style={{ color }}>{column}</span>
        <span className="text-muted">{posts.length}</span>
      </h4>
      <ol
        ref={setNodeRef}
        aria-label={column}
        className="min-h-16 flex-1 space-y-1.5 overflow-y-auto rounded-xl border p-2 transition-colors"
        style={{
          borderColor: isOver ? color : "var(--color-border)",
          background: isOver
            ? `color-mix(in srgb, ${color} 12%, transparent)`
            : "rgba(255,255,255,0.02)",
        }}
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
        <p className={`${poster} text-[13px]`}>Edit post</p>
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
            onClick={() =>
              onSave({ ...post, title: title.trim(), day, column })
            }
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

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
    <div
      className="flex min-h-full flex-col gap-4 p-5 text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(52% 40% at 12% 0%, hsl(300 66% 55% / 0.24), transparent 60%), radial-gradient(46% 40% at 92% 8%, hsl(167 74% 56% / 0.14), transparent 62%)",
      }}
    >
      <header>
        <p className="text-[12px] font-semibold text-muted">
          Content engine <span style={{ color: COLUMN_COLOR.Scheduled }}>/</span>{" "}
          content pipeline
        </p>
        <h2 className={`${poster} mt-1 text-3xl leading-[0.9] sm:text-4xl`}>
          {feature.title}
        </h2>
      </header>

      {/* Airtime strip */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
        <p className={`${poster} mb-2 text-[11px] text-muted`}>Airtime this week</p>
        <div className="flex items-end gap-1.5">
          {DAYS.map((d, i) => (
            <div key={d} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t"
                style={{
                  height: `${8 + (perDay[i] / max) * 34}px`,
                  background: perDay[i]
                    ? `linear-gradient(180deg, ${COLUMN_COLOR.Scheduled}, ${COLUMN_COLOR.Published})`
                    : "rgba(255,255,255,0.08)",
                }}
              />
              <span className="text-[9px] text-muted">{d}</span>
            </div>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-1.5">
          {COLUMNS.map((c, i) => (
            <div key={c} className="contents">
              <ColumnZone
                column={c}
                posts={posts.filter((p) => p.column === c)}
                onMove={move}
                onEdit={setEditingId}
              />
              {i < COLUMNS.length - 1 && (
                <div
                  aria-hidden
                  className={`${poster} flex items-center self-center text-lg`}
                  style={{ color: COLUMN_COLOR[COLUMNS[i + 1]] }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activePost ? (
            <div
              className="flex cursor-grabbing items-center gap-1 rounded-lg border border-white/20 bg-background px-2.5 py-2 text-[12.5px] font-medium text-foreground shadow-xl"
              style={{ borderLeft: `3px solid ${COLUMN_COLOR[activePost.column]}` }}
            >
              <span
                className={`${poster} mr-1 rounded px-1 py-0.5 text-[9px] text-background`}
                style={{ background: COLUMN_COLOR[activePost.column] }}
              >
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
            setPosts((ps) =>
              ps.map((p) => (p.id === updated.id ? updated : p)),
            );
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
