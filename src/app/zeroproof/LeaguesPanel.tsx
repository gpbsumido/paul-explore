"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { formatCents } from "@/lib/zeroproof/format";
import {
  type ZeroproofLeague,
  leaguesResponseSchema,
} from "@/lib/zeroproof/schemas";

/** Fetch and validate a leagues list; a 401 (signed out) reads as "no leagues". */
async function fetchLeagues(url: string): Promise<ZeroproofLeague[]> {
  const res = await fetch(url);
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`Couldn't load leagues (${res.status})`);
  return leaguesResponseSchema.parse(await res.json()).leagues;
}

/** Dollars typed by a person to positive integer cents, or null if not valid. */
function centsFromDollars(input: string): number | null {
  const n = Number.parseFloat(input);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

const controlClass =
  "h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none";
const buttonClass =
  "inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-sm text-foreground transition-colors hover:border-primary-500/50 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none disabled:opacity-60";
const primaryButtonClass =
  "inline-flex h-9 items-center rounded-full bg-primary-600 px-4 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none disabled:opacity-60";

function winConditionLabel(league: ZeroproofLeague): string {
  if (league.winCondition === "threshold" && league.thresholdCents != null) {
    return `First to ${formatCents(league.thresholdCents)}`;
  }
  if (league.winCondition === "timeline" && league.endsAt) {
    return `Highest by ${new Date(league.endsAt).toLocaleDateString()}`;
  }
  return league.winCondition;
}

function LeagueRow({
  league,
  action,
}: {
  league: ZeroproofLeague;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="min-w-0">
        <Link
          href={`/zeroproof/leagues/${league.id}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {league.name}
        </Link>
        <p className="mt-0.5 text-xs text-muted">
          {league.memberCount}/{league.maxMembers} · {winConditionLabel(league)} ·{" "}
          {formatCents(league.startingBankrollCents)} start
          {league.status === "settled" && " · settled"}
        </p>
      </div>
      {action}
    </li>
  );
}

function CreateLeagueForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "invite">("public");
  const [bankroll, setBankroll] = useState("500");
  const [maxMembers, setMaxMembers] = useState("10");
  const [winCondition, setWinCondition] = useState<"threshold" | "timeline">(
    "threshold",
  );
  const [target, setTarget] = useState("2000");
  const [endsAt, setEndsAt] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const startingBankrollCents = centsFromDollars(bankroll);
      if (startingBankrollCents == null) throw new Error("Enter a starting bankroll");
      const body: Record<string, unknown> = {
        name: name.trim(),
        visibility,
        startingBankrollCents,
        maxMembers: Number.parseInt(maxMembers, 10),
        winCondition,
      };
      if (winCondition === "threshold") {
        const thresholdCents = centsFromDollars(target);
        if (thresholdCents == null) throw new Error("Enter a target amount");
        body.thresholdCents = thresholdCents;
      } else {
        if (!endsAt) throw new Error("Pick an end date");
        body.endsAt = new Date(endsAt).toISOString();
      }
      const res = await fetch("/api/zeroproof/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Couldn't create the league (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.myLeagues() });
      queryClient.invalidateQueries({ queryKey: ["zeroproof", "leagues", "list"] });
      onCreated();
    },
  });

  return (
    <form
      className="mt-4 space-y-4 rounded-xl border border-border bg-surface-raised p-4"
      onSubmit={(event) => {
        event.preventDefault();
        create.mutate();
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="lg-name" className="text-sm font-medium text-foreground">
          League name
        </label>
        <input
          id="lg-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={80}
          className={controlClass}
        />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-foreground">Visibility</legend>
        <div className="flex gap-4 text-sm text-muted">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
            />
            Public
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              checked={visibility === "invite"}
              onChange={() => setVisibility("invite")}
            />
            Invite only
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="lg-bankroll" className="text-sm font-medium text-foreground">
            Starting bankroll ($)
          </label>
          <input
            id="lg-bankroll"
            inputMode="decimal"
            value={bankroll}
            onChange={(event) => setBankroll(event.target.value)}
            className={`${controlClass} w-32`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lg-max" className="text-sm font-medium text-foreground">
            Max members
          </label>
          <input
            id="lg-max"
            inputMode="numeric"
            value={maxMembers}
            onChange={(event) => setMaxMembers(event.target.value)}
            className={`${controlClass} w-24`}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-foreground">How you win</legend>
        <div className="flex gap-4 text-sm text-muted">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="winCondition"
              checked={winCondition === "threshold"}
              onChange={() => setWinCondition("threshold")}
            />
            First to a target
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="winCondition"
              checked={winCondition === "timeline"}
              onChange={() => setWinCondition("timeline")}
            />
            Highest by a date
          </label>
        </div>
      </fieldset>

      {winCondition === "threshold" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="lg-target" className="text-sm font-medium text-foreground">
            Target ($)
          </label>
          <input
            id="lg-target"
            inputMode="decimal"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className={`${controlClass} w-32`}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <label htmlFor="lg-ends" className="text-sm font-medium text-foreground">
            End date
          </label>
          <input
            id="lg-ends"
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className={`${controlClass} w-56`}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={create.isPending} className={primaryButtonClass}>
          {create.isPending ? "Creating…" : "Create league"}
        </button>
      </div>
      {create.isError && (
        <p className="text-xs text-error-600 dark:text-error-300">
          {(create.error as Error).message}
        </p>
      )}
    </form>
  );
}

function JoinButton({ league }: { league: ZeroproofLeague }) {
  const queryClient = useQueryClient();
  const join = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/zeroproof/leagues/${league.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          league.joinCode ? { joinCode: league.joinCode } : {},
        ),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Couldn't join (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.myLeagues() });
    },
  });
  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={() => join.mutate()}
        disabled={join.isPending}
        className={buttonClass}
      >
        {join.isPending ? "Joining…" : "Join"}
      </button>
      {join.isError && (
        <p className="mt-1 text-xs text-error-600 dark:text-error-300">
          {(join.error as Error).message}
        </p>
      )}
    </div>
  );
}

function JoinByCode() {
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState("");
  const lookup = useQuery({
    queryKey: queryKeys.zeroproof.leaguesList({ code: submitted }),
    queryFn: () => fetchLeagues(`/api/zeroproof/leagues?code=${encodeURIComponent(submitted)}`),
    enabled: submitted.length > 0,
  });

  return (
    <div className="mt-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(code.trim().toUpperCase());
        }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="lg-code" className="text-sm font-medium text-foreground">
            Join by code
          </label>
          <input
            id="lg-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="ABC234"
            className={`${controlClass} w-40 uppercase`}
          />
        </div>
        <button type="submit" className={buttonClass}>
          Find
        </button>
      </form>
      {submitted && lookup.isSuccess && lookup.data.length === 0 && (
        <p className="mt-2 text-sm text-muted">No league found for that code.</p>
      )}
      {lookup.isSuccess && lookup.data.length > 0 && (
        <ul className="mt-3 space-y-2">
          {lookup.data.map((league) => (
            <LeagueRow key={league.id} league={league} action={<JoinButton league={league} />} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LeaguesPanel() {
  const [creating, setCreating] = useState(false);

  const myLeagues = useQuery({
    queryKey: queryKeys.zeroproof.myLeagues(),
    queryFn: () => fetchLeagues("/api/zeroproof/leagues/mine"),
  });
  const discover = useQuery({
    queryKey: queryKeys.zeroproof.leaguesList(),
    queryFn: () => fetchLeagues("/api/zeroproof/leagues"),
  });

  return (
    <section aria-labelledby="leagues-title" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="leagues-title" className="text-xl font-semibold text-foreground">
          Leagues
        </h2>
        <button
          type="button"
          onClick={() => setCreating((value) => !value)}
          className={primaryButtonClass}
          aria-expanded={creating}
        >
          {creating ? "Close" : "Create a league"}
        </button>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Start your own contest: set the bankroll everyone begins with, the size,
        and how it&apos;s won — first to a target, or the highest balance by a
        date.
        Each league keeps its own board and crowns a winner.
      </p>

      {creating && <CreateLeagueForm onCreated={() => setCreating(false)} />}

      <div className="mt-8">
        <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
          Your leagues
        </h3>
        {myLeagues.isLoading ? (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        ) : myLeagues.data && myLeagues.data.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {myLeagues.data.map((league) => (
              <LeagueRow key={league.id} league={league} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">
            You&apos;re not in a league yet — create one or join below.
          </p>
        )}
      </div>

      <JoinByCode />

      <div className="mt-8">
        <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
          Discover
        </h3>
        {discover.isLoading ? (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        ) : discover.data && discover.data.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {discover.data.map((league) => (
              <LeagueRow key={league.id} league={league} action={<JoinButton league={league} />} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No public leagues open right now.</p>
        )}
      </div>
    </section>
  );
}
