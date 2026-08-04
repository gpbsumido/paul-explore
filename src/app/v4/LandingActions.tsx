"use client";

import AuthButton from "@/components/AuthButton";
import HeaderMenu from "@/components/HeaderMenu";

/**
 * The v4 landing's top-right controls: the shared settings menu (theme picker
 * plus Settings and the standing nav links, the same dropdown every other page
 * carries) alongside the prominent log in / log out call to action. The menu
 * owns Settings, so there's no standalone Settings button beside it. Auth lives
 * on the button, so the menu skips its own auth row (showLogout={false}).
 */
export default function LandingActions({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <HeaderMenu showSettings showLogout={false} />
      <AuthButton
        loggedIn={loggedIn}
        className="inline-flex items-center rounded-full border border-foreground/25 bg-foreground/10 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-[border-color,background-color] hover:border-foreground/40 hover:bg-foreground/20"
      />
    </div>
  );
}
