"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, hsl(300 66% 60%))";
const HEART = "hsl(336 100% 62%)";
const poster = "font-display font-bold uppercase tracking-tight";

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

/** A deterministic, mostly-rising 12-point like trend ending at the current count. */
function trendFor(id: number, current: number): number[] {
  let seed = id * 9301 + 49297;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const start = Math.max(1, Math.round(current * 0.4));
  const out: number[] = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const base = start + (current - start) * t;
    out.push(Math.max(1, Math.round(base * (0.85 + rand() * 0.3))));
  }
  out[out.length - 1] = current;
  return out;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-2 text-center">
      <p className="text-[15px] font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}

/** Per-post analytics: current counts and a like trend over time. */
function AnalyticsModal({
  post,
  onClose,
}: {
  post: Post;
  onClose: () => void;
}) {
  const series = useMemo(
    () => trendFor(post.id, post.likes),
    [post.id, post.likes],
  );
  const max = Math.max(1, ...series);
  const engagement = Math.round((post.likes / (post.likes + 40)) * 100);
  return (
    <Modal open onClose={onClose} aria-label={`Analytics for ${post.author}`}>
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Post analytics
          </p>
          <p className="text-[13px] font-medium" style={{ color: ACCENT }}>
            @{post.author}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Likes" value={post.likes.toLocaleString()} />
          <Stat label="Replies" value={post.replies.length} />
          <Stat label="Engagement" value={`${engagement}%`} />
        </div>
        <div>
          <p className="mb-1 text-[11px] text-muted">Likes over time</p>
          <div className="flex h-16 items-end gap-0.5">
            {series.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${(v / max) * 100}%`,
                  backgroundColor: ACCENT,
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Vignette: the content engine's community mode. A likeable feed you can post
 * and reply to, with likes ticking up live and per-post analytics on click,
 * standing in for the posts and community-analytics views.
 */
export default function CommunityModeDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [posts, setPosts] = useState<Post[]>(FEED);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [composer, setComposer] = useState<Composer | null>(null);
  const [analyticsId, setAnalyticsId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1000);

  // Likes tick up live, so the feed feels active like the real one did.
  useEffect(() => {
    const t = setInterval(() => {
      setPosts((ps) => {
        if (ps.length === 0) return ps;
        const i = Math.floor(Math.random() * ps.length);
        return ps.map((p, idx) =>
          idx === i
            ? { ...p, likes: p.likes + 1 + Math.floor(Math.random() * 3) }
            : p,
        );
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const analyticsPost = posts.find((p) => p.id === analyticsId) ?? null;

  const toggleLiked = (id: number) => {
    const isLiked = liked.has(id);
    setPosts((p) =>
      p.map((post) =>
        post.id === id
          ? { ...post, likes: post.likes + (isLiked ? -1 : 1) }
          : post,
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
    <div
      className="flex min-h-full flex-col gap-4 p-5 text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(54% 42% at 88% 0%, hsl(336 100% 62% / 0.2), transparent 60%), radial-gradient(48% 40% at 8% 10%, hsl(300 66% 55% / 0.22), transparent 62%)",
      }}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-muted">
            Content engine <span style={{ color: HEART }}>/</span> community feed
          </p>
          <h2 className={`${poster} mt-1 text-3xl leading-[0.9] sm:text-4xl`}>
            {feature.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-muted tabular-nums">
            {total.toLocaleString()} total likes
          </span>
          <button
            type="button"
            onClick={() => setComposer({ mode: "post" })}
            className={`${poster} rounded-xl px-4 py-2 text-[13px] text-background shadow-lg transition-transform hover:-translate-y-0.5`}
            style={{
              background: `linear-gradient(135deg, ${HEART}, hsl(300 66% 60%) 80%)`,
            }}
          >
            New post
          </button>
        </div>
      </header>

      <ul
        aria-label="Feed"
        className="min-h-0 flex-1 space-y-2.5 overflow-y-auto"
      >
        {posts.map((p) => (
          <li
            key={p.id}
            className="flex gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left backdrop-blur-sm"
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-background"
              style={{
                background: `hsl(${(p.author.charCodeAt(0) * 13) % 360} 60% 55%)`,
              }}
            >
              {p.author[0]?.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
            <p
              className={`${poster} text-[12px]`}
              style={{ color: ACCENT }}
            >
              @{p.author}
            </p>
            <button
              type="button"
              aria-label={`Analytics for ${p.author}`}
              onClick={() => setAnalyticsId(p.id)}
              className="mt-0.5 text-left text-[13px] leading-snug text-foreground hover:underline"
            >
              {p.body}
            </button>
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
              <span className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(p.likes / max) * 100}%`,
                    background: `linear-gradient(90deg, hsl(300 66% 60%), ${HEART})`,
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
            </div>
          </li>
        ))}
      </ul>
      </div>

      {composer && (
        <ComposerModal
          composer={composer}
          onClose={() => setComposer(null)}
          onSubmit={submit}
        />
      )}
      {analyticsPost && (
        <AnalyticsModal
          post={analyticsPost}
          onClose={() => setAnalyticsId(null)}
        />
      )}
    </div>
  );
}
