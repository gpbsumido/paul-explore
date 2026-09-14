"use client";

import Link from "next/link";
import { useIsFlagAdmin } from "@/lib/useIsFlagAdmin";

/**
 * The admin-only entry point to the ZeroProof "god's view" (every user's bets).
 * Renders nothing unless the viewer is a flag admin, so it's invisible to
 * everyone else — the route itself 404s a non-admin regardless.
 */
export default function AdminBetsLink() {
  const isAdmin = useIsFlagAdmin();
  if (!isAdmin) return null;

  return (
    <Link
      href="/zeroproof/admin/bets"
      className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-3 text-xs text-foreground transition-colors hover:border-primary-500/50 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
    >
      God&apos;s view
    </Link>
  );
}
