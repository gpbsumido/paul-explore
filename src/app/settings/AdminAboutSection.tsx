"use client";

import { useIsFlagAdmin } from "@/lib/useIsFlagAdmin";

/**
 * An admin-only "About" section in Settings, showing the running app version.
 * Renders nothing for non-admins. The version is passed from the server page so
 * package.json never ships to the client.
 */
export default function AdminAboutSection({ version }: { version: string }) {
  const isAdmin = useIsFlagAdmin();
  if (!isAdmin) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
        About
      </h2>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
        <div>
          <p className="text-[14px] font-semibold text-foreground">Version</p>
          <p className="text-[12px] text-muted">The running build of this app.</p>
        </div>
        <span className="font-mono text-[13px] tabular-nums text-foreground">
          {version}
        </span>
      </div>
    </section>
  );
}
