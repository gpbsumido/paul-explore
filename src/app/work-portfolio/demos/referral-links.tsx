"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  useCreateReferral,
  useReferralStats,
  useRecordReferralClick,
} from "@/hooks/useReferrals";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #fb7185)";

const TARGETS = [
  { path: "/work-portfolio", label: "Work portfolio" },
  { path: "/", label: "Home" },
  { path: "/thoughts", label: "Thoughts" },
];

/**
 * Vignette: the UA referral-links tool, wired to the real portfolio_api.
 * Pick where the link points on paulsumido.com, optionally name the slug, and
 * create it; the server enforces slug uniqueness. Shows the created link with
 * copy. Falls back gracefully if the API is unreachable.
 */
export default function ReferralLinksDemo({ feature }: { feature: WorkFeature }) {
  const [targetPath, setTargetPath] = useState(TARGETS[0].path);
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const create = useCreateReferral();
  const created = create.data ?? null;
  const stats = useReferralStats(created?.slug ?? null);
  const recordClick = useRecordReferralClick();

  const submit = () => {
    setCopied(false);
    create.mutate({
      targetPath,
      slug: slug.trim() || undefined,
    });
  };

  const copy = () => {
    if (!created) return;
    navigator.clipboard?.writeText(created.url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Simulate someone opening the link; the mutation invalidates the stats query
  // on success, so the count moves live without a manual refetch here.
  const recordVisit = () => {
    if (!created) return;
    recordClick.mutate(created.slug);
  };

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <label className="block">
        <span className="mb-0.5 block text-[11px] text-muted">Link points to</span>
        <select
          aria-label="Target page"
          value={targetPath}
          onChange={(e) => setTargetPath(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground"
        >
          {TARGETS.map((t) => (
            <option key={t.path} value={t.path}>
              paulsumido.com{t.path} — {t.label}
            </option>
          ))}
        </select>
      </label>

      <Input
        label="Custom slug (optional)"
        size="sm"
        placeholder="auto-generated if blank"
        value={slug}
        onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())}
      />

      <Button size="sm" onClick={submit} disabled={create.isPending}>
        {create.isPending ? "Creating…" : "Create link"}
      </Button>

      {create.isError && (
        <p role="alert" className="text-[12px] text-red-500">
          {create.error.message}
        </p>
      )}

      {created && (
        <div className="rounded-lg border border-border p-3">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-muted">
            Referral link
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-black/5 px-2 py-1 font-mono text-[12px] text-foreground dark:bg-white/10">
              {created.url}
            </code>
            <button
              type="button"
              onClick={copy}
              className="rounded-md px-2.5 py-1 text-[11px] font-medium text-white"
              style={{ backgroundColor: ACCENT }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            points to paulsumido.com{created.targetPath}
          </p>
        </div>
      )}

      {created && (
        <div aria-label="Referral stats" className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-muted">Clicks</p>
            <button
              type="button"
              onClick={recordVisit}
              className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-foreground/5"
            >
              Open link
            </button>
          </div>

          {stats.isLoading ? (
            <p className="mt-1 text-[12px] text-muted">Loading stats…</p>
          ) : stats.isError ? (
            <p className="mt-1 text-[12px] text-muted">
              Stats are unavailable right now.
            </p>
          ) : stats.data && stats.data.clicks > 0 ? (
            <>
              <p
                className="text-2xl font-bold text-foreground tabular-nums"
                data-testid="stats-total"
              >
                {stats.data.clicks.toLocaleString()}
              </p>
              <ol className="mt-1 flex flex-col gap-0.5">
                {stats.data.recent.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[11px] text-muted">
                    <span aria-hidden style={{ color: ACCENT }}>•</span>
                    {new Date(r.at).toLocaleString()}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p data-testid="stats-total" className="mt-1 text-[12px] text-muted">
              No clicks yet — share your link to start tracking.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
