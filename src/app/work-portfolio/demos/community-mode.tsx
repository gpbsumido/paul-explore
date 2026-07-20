"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #e879f9)";

type Post = { id: number; author: string; body: string; likes: number };

const FEED: Post[] = [
  { id: 1, author: "novaqueen", body: "finally hit rank 1 this season 🏆", likes: 214 },
  { id: 2, author: "pixelbard", body: "made some fan art of the new map", likes: 512 },
  { id: 3, author: "grumblor", body: "matchmaking felt way better after the patch", likes: 87 },
];

/**
 * Vignette: the content engine's community mode. A feed you can like, with a
 * small engagement bar that reacts to the likes, standing in for the posts
 * and community-analytics views.
 */
export default function CommunityModeDemo({ feature }: { feature: WorkFeature }) {
  const [posts, setPosts] = useState<Post[]>(FEED);
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const like = (id: number) =>
    setPosts((p) =>
      p.map((post) => {
        if (post.id !== id) return post;
        const isLiked = liked.has(id);
        return { ...post, likes: post.likes + (isLiked ? -1 : 1) };
      }),
    );

  const toggleLiked = (id: number) => {
    like(id);
    setLiked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = posts.reduce((sum, p) => sum + p.likes, 0);
  const max = Math.max(1, ...posts.map((p) => p.likes));

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
        <span className="text-[11px] text-muted">
          {total.toLocaleString()} total likes
        </span>
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {posts.map((p) => (
          <li key={p.id} className="rounded-lg border border-border p-2.5">
            <p className="text-[11px] font-medium" style={{ color: ACCENT }}>
              @{p.author}
            </p>
            <p className="text-[12px] text-foreground">{p.body}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                aria-label={`Like ${p.author}`}
                aria-pressed={liked.has(p.id)}
                onClick={() => toggleLiked(p.id)}
                className="text-[12px]"
              >
                {liked.has(p.id) ? "❤️" : "🤍"}
              </button>
              <span className="text-[11px] text-muted" data-testid={`likes-${p.id}`}>
                {p.likes.toLocaleString()}
              </span>
              <span className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(p.likes / max) * 100}%`, backgroundColor: ACCENT }}
                />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
