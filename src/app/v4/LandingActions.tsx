"use client";

import { useQuery } from "@tanstack/react-query";
import AuthButton from "@/components/AuthButton";
import HeaderMenu from "@/components/HeaderMenu";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Shared pill treatment for the v4 header controls. SearchHint and ResumeLink
 * in SlotMachine carry the same geometry and surface, so all four controls
 * read as one set.
 */
const PILL =
  "h-9 rounded-full border border-border bg-surface/70 backdrop-blur-sm text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60";

/**
 * The landing's top-right controls: the shared settings menu (theme picker
 * plus Settings and the standing nav links, the same dropdown every other page
 * carries) alongside the prominent log in / log out call to action. The menu
 * owns Settings, so there's no standalone Settings button beside it. Auth lives
 * on the button, so the menu skips its own auth row (showLogout={false}).
 *
 * `loggedIn` is optional. The /discover archive hubs still know the session
 * server-side and pass it explicitly. The static / landing passes nothing and
 * the component resolves it here from /api/me — the same query key HeaderMenu
 * uses everywhere else, so the two share one request and one cache entry.
 * Until it resolves the controls render the guest state: a signed-in visitor
 * sees "Log in" for one round trip, which shows less than the truth, never
 * more. That direction is the whole point — the static HTML carries no
 * session-derived markup for an edge cache to leak.
 */
export default function LandingActions({ loggedIn }: { loggedIn?: boolean }) {
  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<{ sub: string | null }> =>
      fetch("/api/me").then((r) => {
        if (!r.ok) throw new Error("Failed to load user");
        return r.json();
      }),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: "always",
    enabled: loggedIn === undefined,
  });
  const resolved = loggedIn ?? (meQuery.data?.sub != null);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Settings rides the session: /settings only bounces a guest to login,
          so a guest's menu doesn't offer it. */}
      <HeaderMenu
        showSettings={resolved}
        showLogout={false}
        triggerClassName={`flex items-center gap-1.5 px-3 text-muted hover:text-foreground ${PILL}`}
      />
      <AuthButton
        loggedIn={resolved}
        className={`inline-flex items-center px-4 font-medium text-foreground hover:bg-surface-raised ${PILL}`}
      />
    </div>
  );
}
