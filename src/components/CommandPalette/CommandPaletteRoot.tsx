"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useCommandPaletteHotkey } from "@/hooks/useCommandPaletteHotkey";
import { buildCommandRegistry } from "@/lib/command-palette/registry";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/lib/command-palette/open-event";
import { useShortcutKey } from "@/hooks/useShortcutKey";
import type { Command } from "@/lib/command-palette/types";
import CommandPalette from "./CommandPalette";

/**
 * Global mount for the command palette. Owns the open state, wires the hotkey,
 * builds the registry once, and turns a chosen command into the right effect:
 * navigate, open an external link, or run the theme toggle action. Rendered in
 * the root layout so ⌘K works on every route.
 */
export default function CommandPaletteRoot() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setPreference } = useTheme();

  const commands = useMemo(() => buildCommandRegistry(), []);
  const shortcut = useShortcutKey();

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  useCommandPaletteHotkey({ onOpen: handleOpen });

  // The graph landing/hub ("/") crowds all four corners with its own chrome and
  // shows an inline ⌘K affordance in its header instead, so hide the floating
  // trigger there to avoid a collision. Other in-tree triggers reach us through
  // this window event, the same way the keyboard hotkey does.
  useEffect(() => {
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpen);
    return () =>
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpen);
  }, [handleOpen]);

  const showFloatingTrigger = pathname !== "/";

  const handleSelect = useCallback(
    (command: Command) => {
      if (command.actionId === "toggle-theme") {
        setPreference(theme === "dark" ? "light" : "dark");
        return;
      }
      if (!command.href) return;
      if (command.external) {
        window.open(command.href, "_blank", "noopener,noreferrer");
        return;
      }
      router.push(command.href);
    },
    [router, setPreference, theme],
  );

  return (
    <>
      {showFloatingTrigger && (
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open command palette"
        aria-haspopup="dialog"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full border border-border bg-surface/90 px-3 py-2 text-[12px] text-muted shadow-md backdrop-blur transition-colors hover:bg-surface-raised hover:text-foreground"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {shortcut ? (
          <kbd className="font-sans text-[11px] tracking-wide">{shortcut}K</kbd>
        ) : null}
      </button>
      )}

      <CommandPalette
        open={open}
        onClose={handleClose}
        onSelect={handleSelect}
        commands={commands}
      />
    </>
  );
}
