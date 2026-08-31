"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Me = { email: string | null; sub: string | null };

type Outcome =
  | { kind: "recorded" | "already"; siteName: string; at: string }
  | { kind: "error"; message: string };

/**
 * The volunteer's side: type the code showing on the display at the entrance.
 *
 * The site comes from the URL (`?site=<id>`), which is what the poster or QR
 * code at the location carries. There is deliberately no picker -- listing
 * every site to anyone who opens the page would hand out the map.
 */
export default function CheckInContent() {
  const siteId = useSearchParams().get("site");
  const [code, setCode] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me> => {
      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("Could not load the session");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const submit = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setOutcome({ kind: "error", message: "The code is six digits." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/check-in/arrivals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setOutcome({
          kind: data.status === "already" ? "already" : "recorded",
          siteName: data.siteName ?? "this site",
          at: data.arrival?.at ?? new Date().toISOString(),
        });
        return;
      }

      setOutcome({
        kind: "error",
        message:
          data.message ??
          (res.status === 429
            ? "Too many attempts. Wait for the next code."
            : "That code is wrong or has expired."),
      });
    } catch {
      setOutcome({
        kind: "error",
        message: "Couldn't reach the server. Check your signal and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!siteId) {
    return (
      <p className="text-sm text-muted">
        This link doesn&apos;t say which site to check into. Use the link or QR
        code posted at the location.
      </p>
    );
  }

  if (me.isLoading) {
    return <p className="text-sm text-muted">Checking your sign-in…</p>;
  }

  if (!me.data?.sub) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Sign in first, so your arrival is recorded against your name rather
          than a name anyone could type.
        </p>
        <Button
          href={`/auth/login?returnTo=${encodeURIComponent(`/check-in?site=${siteId}`)}`}
        >
          Sign in
        </Button>
      </div>
    );
  }

  if (outcome && outcome.kind !== "error") {
    return (
      <div className="rounded-xl border border-border bg-surface/60 p-5">
        <p className="text-lg font-semibold text-foreground">
          {outcome.kind === "already"
            ? "You're already checked in"
            : "Checked in"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {outcome.siteName} ·{" "}
          {new Date(outcome.at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Input
        label="Arrival code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        // Pulls up the number pad and lets iOS offer the code from a message,
        // which is the difference between one tap and squinting at a keyboard.
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        helperText="The six digits on the display at the entrance"
        className="max-w-xs"
      />

      {outcome?.kind === "error" && (
        <p role="alert" className="text-sm text-warning-600 dark:text-warning-300">
          {outcome.message}
        </p>
      )}

      <Button type="submit" loading={submitting}>
        Confirm arrival
      </Button>
    </form>
  );
}
