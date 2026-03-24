"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

type ThemePreference = "light" | "dark" | "system";

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "system",
    label: "System",
    icon: (
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
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
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
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
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
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
];

/** Icon for the trigger button — matches the currently active theme. */
function ActiveThemeIcon({ preference }: { preference: ThemePreference }) {
  const opt = THEME_OPTIONS.find((o) => o.value === preference);
  return <>{opt?.icon}</>;
}

interface HeaderMenuProps {
  /** Show the Settings link. Defaults to false. */
  showSettings?: boolean;
  /** Show the Log out link. Defaults to true. */
  showLogout?: boolean;
  /** Show the Log in link instead of logout. Defaults to false. */
  showLogin?: boolean;
}

/**
 * Dropdown menu for the page header, consolidating theme switching,
 * optional settings navigation, and optional logout into one control.
 */
export default function HeaderMenu({
  showSettings = false,
  showLogout = true,
  showLogin = false,
}: HeaderMenuProps) {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setOpen(false);
        return;
      }
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Open menu"
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground transition-colors hover:bg-surface-raised"
      >
        <ActiveThemeIcon preference={preference} />
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-surface shadow-lg ring-1 ring-black/5 dark:ring-white/5 z-50">
          {/* Theme picker */}
          <div className="p-2">
            <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted/50">
              Theme
            </p>
            <div className="flex gap-1">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPreference(opt.value)}
                  aria-pressed={preference === opt.value}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors
                    ${
                      preference === opt.value
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted hover:bg-foreground/5 hover:text-foreground"
                    }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {(showSettings || showLogout || showLogin) && (
            <>
              <div className="mx-2 border-t border-border" />
              <div className="p-1.5">
                {showSettings && (
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
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
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                  </Link>
                )}
                {showLogout && (
                  <a
                    href="/auth/logout"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
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
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log out
                  </a>
                )}
                {showLogin && (
                  <a
                    href="/auth/login"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
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
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Log in
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
