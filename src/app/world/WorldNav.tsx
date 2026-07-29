"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/lib/command-palette/open-event";
import { GLASS_STYLE } from "./glass";

// The world runs without the site header or footer, so the usual way out —
// home, write-ups, résumé, settings, search — lives in a small floating menu
// instead. On a phone it sits in the top-right corner beside the HUD toggle.

const LINKS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/thoughts", label: "Dev notes", icon: "📝" },
  { href: "/resume", label: "Résumé", icon: "📄" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
] as const;

export default function WorldNav() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Click-away and Escape, the two things every menu owes you.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto absolute bottom-6 left-5 z-20 max-md:relative max-md:bottom-auto max-md:left-auto"
    >
      {open && (
        <div
          className="absolute bottom-12 left-0 w-48 overflow-hidden rounded-2xl py-1 max-md:bottom-auto max-md:left-auto max-md:right-0 max-md:top-12"
          style={GLASS_STYLE}
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span aria-hidden>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT));
            }}
            className="flex w-full items-center gap-2.5 border-t border-white/10 px-3 py-2 text-left text-[12.5px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span aria-hidden>🔍</span>
            Search
            <kbd className="ml-auto rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
              ⌘K
            </kbd>
          </button>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-label="Site menu"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="flex h-10 items-center gap-2 rounded-2xl px-3.5 text-[12px] font-semibold text-white/75 transition-colors hover:text-white max-md:px-3"
        style={GLASS_STYLE}
      >
        <span aria-hidden className="text-[14px] leading-none">
          {open ? "✕" : "☰"}
        </span>
        {/* On a phone the corner is shared with the HUD toggle, so the icon
            carries it — the button is still labelled "Site menu". */}
        <span className="max-md:hidden">paul-explore</span>
      </button>
    </div>
  );
}
