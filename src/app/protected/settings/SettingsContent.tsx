"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Button from "@/components/ui/Button";

// ---- Google Calendar icon ----
// Simplified version of the Google Calendar mark — just enough to be recognizable
// at small sizes without pulling in an icon library.
function GoogleCalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#fff" stroke="#dadce0" strokeWidth="1.5" />
      <rect x="3" y="3" width="18" height="5" rx="2" fill="#4285f4" />
      <rect x="3" y="6" width="18" height="2" fill="#4285f4" />
      <text x="12" y="17" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#4285f4" fontFamily="sans-serif">
        CAL
      </text>
    </svg>
  );
}

// ---- Skeleton ----

function ConnectionRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="flex flex-col gap-1.5">
          <div className="h-[14px] w-32 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <div className="h-[11px] w-52 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        </div>
      </div>
      <div className="h-8 w-24 rounded-md bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
    </div>
  );
}

// ---- SettingsContent ----

/**
 * Client component for /protected/settings. Fetches Google Calendar connection
 * status on mount and lets the user connect or disconnect. Reads the ?gcal query
 * param on load to show a banner when the OAuth callback redirects back here.
 */
export default function SettingsContent() {
  const searchParams = useSearchParams();
  const gcalParam = searchParams.get("gcal");

  const [statusLoading, setStatusLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(
    () => {
      if (gcalParam === "connected") return { type: "success", message: "Google Calendar connected." };
      if (gcalParam === "denied") return { type: "error", message: "Google Calendar connection was cancelled." };
      if (gcalParam === "error") return { type: "error", message: "Something went wrong connecting Google Calendar. Try again." };
      return null;
    },
  );

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/google/auth/status");
      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected ?? false);
      }
    } catch {
      // status fetch failing silently is fine, just show as disconnected
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/google/auth/url");
      if (!res.ok) throw new Error("Failed to get URL");
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setBanner({ type: "error", message: "Could not start the connect flow. Try again." });
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/google/auth/disconnect", { method: "DELETE" });
      if (!res.ok) throw new Error("Disconnect failed");
      setConnected(false);
      setBanner({ type: "success", message: "Google Calendar disconnected." });
    } catch {
      setBanner({ type: "error", message: "Could not disconnect. Try again." });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Nav — same pattern as VitalsContent */}
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-5xl items-center gap-4 px-4">
          <Link
            href="/protected"
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden="true">
              <path
                d="M5 1L1 5l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Dashboard
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Settings
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-[14px] text-muted">Manage your account connections and preferences.</p>

        {/* Banner */}
        {banner && (
          <div
            className={[
              "mt-6 flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm",
              banner.type === "success"
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400",
            ].join(" ")}
          >
            <span>{banner.message}</span>
            <button
              onClick={() => setBanner(null)}
              className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Connected accounts section */}
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/60">
            Connected accounts
          </h2>

          {statusLoading ? (
            <ConnectionRowSkeleton />
          ) : (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                  <GoogleCalendarIcon size={20} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">Google Calendar</p>
                  <p className="text-[12px] text-muted">
                    Sync events between this app and your Google Calendar.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {connected && (
                  <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[11px] font-semibold text-green-700 dark:text-green-400">
                      Connected
                    </span>
                  </div>
                )}
                {connected ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDisconnect}
                    loading={disconnecting}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConnect}
                    loading={connecting}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
