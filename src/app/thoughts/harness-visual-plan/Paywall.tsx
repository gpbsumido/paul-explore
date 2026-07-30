"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

/** Only this signed-in account sees the gated tail of the write-up. */
const OWNER_EMAIL = "psumido@gmail.com";

type Me = { email: string | null };

/**
 * Reveals its children only to the signed-in owner. Everyone else — signed out,
 * signed in as someone else, or while the session is still loading — gets the
 * "interview me first" panel instead. Reuses the same GET /api/me session read
 * the header and the flags console use, so there's no second auth path to keep
 * in sync.
 *
 * This is a reading gate, not a security boundary: the content is my own notes,
 * and the point is to make a visitor talk to me before they get the full thing.
 * It fails closed on purpose, so the gated prose never flashes for a visitor
 * while the session request is in flight.
 */
export default function Paywall({ children }: { children: React.ReactNode }) {
  const me = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<Me> =>
      fetch("/api/me").then((r) => {
        if (!r.ok) throw new Error("Failed to load user");
        return r.json();
      }),
    staleTime: 5 * 60_000,
  });

  if (me.data?.email === OWNER_EMAIL) return <>{children}</>;

  return (
    <aside
      aria-label="Members-only section"
      className="rounded-2xl border border-border bg-surface/60 px-5 py-8 text-center sm:px-8"
    >
      <p className="mb-3 text-2xl" aria-hidden="true">
        🔒
      </p>
      <h2 className="text-lg font-bold text-foreground">
        Interview me first
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
        The rest of this write-up — the reasoning, the pros and cons, and exactly
        how I run the process day to day — is for people I&rsquo;ve talked to.
        Reach out for an interview and I&rsquo;ll walk you through the whole
        thing.
      </p>
      <a
        href="mailto:psumido@gmail.com?subject=Interview%20%E2%80%94%20visual-plan%20write-up"
        className="mt-5 inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Get in touch to read on
      </a>
    </aside>
  );
}
