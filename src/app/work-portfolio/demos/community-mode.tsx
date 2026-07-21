"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #e879f9)";

type Reply = { id: number; author: string; body: string };
type Post = {
  id: number;
  author: string;
  body: string;
  likes: number;
  replies: Reply[];
};

const FEED: Post[] = [
  {
    id: 1,
    author: "novaqueen",
    body: "finally hit rank 1 this season 🏆",
    likes: 214,
    replies: [{ id: 101, author: "pixelbard", body: "gg, well earned" }],
  },
  {
    id: 2,
    author: "pixelbard",
    body: "made some fan art of the new map",
    likes: 512,
    replies: [],
  },
  {
    id: 3,
    author: "grumblor",
    body: "matchmaking felt way better after the patch",
    likes: 87,
    replies: [],
  },
];

type Composer = { mode: "post" } | { mode: "reply"; postId: number };

/** Compose a new post or a reply. */
function ComposerModal({
  composer,
  onClose,
  onSubmit,
}: {
  composer: Composer;
  onClose: () => void;
  onSubmit: (body: string) => void;
}) {
  const [body, setBody] = useState("");
  const isPost = composer.mode === "post";
  return (
    <Modal open onClose={onClose} aria-label={isPost ? "New post" : "Reply"}>
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
          {isPost ? "New post" : "Reply"}
        </p>
        <Textarea
          label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isPost ? "share something" : "write a reply"}
          rows={3}
        />
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!body.trim()}
            onClick={() => onSubmit(body.trim())}
          >
            {isPost ? "Post" : "Reply"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Vignette: the content engine's community mode. A likeable feed you can post
 * and reply to, with an engagement bar per post, standing in for the posts and
 * community-analytics views.
 */
export default function CommunityModeDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [posts, setPosts] = useState<Post[]>(FEED);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [composer, setComposer] = useState<Composer | null>(null);
  const [nextId, setNextId] = useState(1000);

  const toggleLiked = (id: number) => {
    const isLiked = liked.has(id);
    setPosts((p) =>
      p.map((post) =>
        post.id === id ? { ...post, likes: post.likes + (isLiked ? -1 : 1) } : post,
      ),
    );
    setLiked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = (body: string) => {
    if (!composer) return;
    const id = nextId;
    setNextId((n) => n + 1);
    if (composer.mode === "post") {
      setPosts((ps) => [
        { id, author: "you", body, likes: 0, replies: [] },
        ...ps,
      ]);
    } else {
      const { postId } = composer;
      setPosts((ps) =>
        ps.map((p) =>
          p.id === postId
            ? { ...p, replies: [...p.replies, { id, author: "you", body }] }
            : p,
        ),
      );
    }
    setComposer(null);
  };

  const total = posts.reduce((sum, p) => sum + p.likes, 0);
  const max = Math.max(1, ...posts.map((p) => p.likes));

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">
          {feature.title}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted">
            {total.toLocaleString()} total likes
          </span>
          <button
            type="button"
            onClick={() => setComposer({ mode: "post" })}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
            style={{ backgroundColor: ACCENT }}
          >
            New post
          </button>
        </div>
      </div>

      <ul aria-label="Feed" className="min-h-0 flex-1 space-y-2 overflow-y-auto">
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
              <span
                className="text-[11px] text-muted"
                data-testid={`likes-${p.id}`}
              >
                {p.likes.toLocaleString()}
              </span>
              <button
                type="button"
                aria-label={`Reply to ${p.author}`}
                onClick={() => setComposer({ mode: "reply", postId: p.id })}
                className="text-[11px] text-muted transition-colors hover:text-foreground"
              >
                💬 {p.replies.length}
              </button>
              <span className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(p.likes / max) * 100}%`,
                    backgroundColor: ACCENT,
                  }}
                />
              </span>
            </div>

            {p.replies.length > 0 && (
              <ul className="mt-2 space-y-1 border-l border-border pl-2.5">
                {p.replies.map((r) => (
                  <li key={r.id} className="text-[11px]">
                    <span className="font-medium" style={{ color: ACCENT }}>
                      @{r.author}
                    </span>{" "}
                    <span className="text-muted">{r.body}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {composer && (
        <ComposerModal
          composer={composer}
          onClose={() => setComposer(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
