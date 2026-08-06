"use client";

import AuthButton from "@/components/AuthButton";
import HeaderMenu from "@/components/HeaderMenu";

/**
 * Shared pill treatment for the v4 header controls. SearchHint and ResumeLink
 * in SlotMachine carry the same geometry and surface, so all four controls
 * read as one set.
 */
const PILL =
  "rounded-full border border-border bg-surface/70 backdrop-blur-sm text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60";

/**
 * The v4 landing's top-right controls: the shared settings menu (theme picker
 * plus Settings and the standing nav links, the same dropdown every other page
 * carries) alongside the prominent log in / log out call to action. The menu
 * owns Settings, so there's no standalone Settings button beside it. Auth lives
 * on the button, so the menu skips its own auth row (showLogout={false}).
 */
export default function LandingActions({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <HeaderMenu
        showSettings
        showLogout={false}
        triggerClassName={`flex items-center gap-1.5 px-3 py-2 text-muted hover:text-foreground ${PILL}`}
      />
      <AuthButton
        loggedIn={loggedIn}
        className={`inline-flex items-center px-4 py-2 font-medium text-foreground hover:bg-surface-raised ${PILL}`}
      />
    </div>
  );
}
