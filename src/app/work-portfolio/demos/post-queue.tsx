"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #e879f9)";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Post = { id: number; title: string; day: number };

const INITIAL: Post[] = [
  { id: 1, title: "Patch 4.1 recap", day: 0 },
  { id: 2, title: "Community art roundup", day: 2 },
  { id: 3, title: "Weekend 2x XP", day: 4 },
  { id: 4, title: "Dev livestream teaser", day: 4 },
];

/**
 * Vignette: the content engine's scheduling queue. A reorderable list of
 * scheduled posts and a week strip showing how many land each day.
 */
export default function PostQueueDemo({ feature }: { feature: WorkFeature }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL);

  const move = (id: number, dir: -1 | 1) =>
    setPosts((p) => {
      const from = p.findIndex((x) => x.id === id);
      const to = from + dir;
      if (from === -1 || to < 0 || to >= p.length) return p;
      const next = [...p];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });

  const perDay = DAYS.map((_, d) => posts.filter((p) => p.day === d).length);
  const max = Math.max(1, ...perDay);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div className="flex items-end gap-1">
        {DAYS.map((d, i) => (
          <div key={d} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t"
              style={{
                height: `${8 + (perDay[i] / max) * 32}px`,
                backgroundColor: perDay[i] ? ACCENT : "var(--color-border,#8884)",
              }}
            />
            <span className="text-[9px] text-muted">{d}</span>
          </div>
        ))}
      </div>

      <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {posts.map((p) => (
          <li
            key={p.id}
            data-post={p.id}
            className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5"
          >
            <span className="min-w-0 truncate text-[12px] text-foreground">
              <span className="mr-2 text-[10px] text-muted">{DAYS[p.day]}</span>
              {p.title}
            </span>
            <span className="flex shrink-0 gap-0.5 text-[11px] text-muted">
              <button type="button" aria-label={`Move ${p.title} up`} onClick={() => move(p.id, -1)} className="px-1 hover:text-foreground">↑</button>
              <button type="button" aria-label={`Move ${p.title} down`} onClick={() => move(p.id, 1)} className="px-1 hover:text-foreground">↓</button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
