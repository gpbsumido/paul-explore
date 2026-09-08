"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  type EspnLeague,
  espnLeaguesResponseSchema,
} from "@/lib/zeroproof/schemas";

async function fetchEspnLeagues(): Promise<EspnLeague[]> {
  const res = await fetch("/api/zeroproof/espn-leagues");
  if (!res.ok) throw new Error(`Couldn't load ESPN leagues (${res.status})`);
  return espnLeaguesResponseSchema.parse(await res.json()).leagues;
}

const controlClass =
  "h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none";
const primaryButtonClass =
  "inline-flex h-9 items-center rounded-full bg-primary-600 px-4 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none disabled:opacity-60";

function AddLeagueForm() {
  const queryClient = useQueryClient();
  const [game, setGame] = useState("ffl");
  const [leagueId, setLeagueId] = useState("");
  const [season, setSeason] = useState("");
  const [label, setLabel] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        game,
        leagueId: leagueId.trim(),
        season: season.trim(),
      };
      if (label.trim()) body.label = label.trim();
      const res = await fetch("/api/zeroproof/espn-leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Couldn't add the league (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.espnLeagues() });
      setLeagueId("");
      setSeason("");
      setLabel("");
    },
  });

  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-raised p-4"
      onSubmit={(event) => {
        event.preventDefault();
        add.mutate();
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="espn-game" className="text-xs text-muted">
          Sport
        </label>
        <select
          id="espn-game"
          value={game}
          onChange={(event) => setGame(event.target.value)}
          className={`${controlClass} w-32`}
        >
          <option value="ffl">Football</option>
          <option value="fba">Basketball</option>
          <option value="flb">Baseball</option>
          <option value="fhl">Hockey</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="espn-id" className="text-xs text-muted">
          ESPN league id
        </label>
        <input
          id="espn-id"
          inputMode="numeric"
          required
          value={leagueId}
          onChange={(event) => setLeagueId(event.target.value)}
          placeholder="836777691"
          className={`${controlClass} w-40`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="espn-season" className="text-xs text-muted">
          Season
        </label>
        <input
          id="espn-season"
          inputMode="numeric"
          required
          value={season}
          onChange={(event) => setSeason(event.target.value)}
          placeholder="2026"
          className={`${controlClass} w-24`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="espn-label" className="text-xs text-muted">
          Label (optional)
        </label>
        <input
          id="espn-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="The office league"
          className={`${controlClass} w-56`}
        />
      </div>
      <button type="submit" disabled={add.isPending} className={primaryButtonClass}>
        {add.isPending ? "Adding…" : "Add league"}
      </button>
      {add.isError && (
        <p className="w-full text-xs text-error-600 dark:text-error-300">
          {(add.error as Error).message}
        </p>
      )}
    </form>
  );
}

function RemoveButton({ league }: { league: EspnLeague }) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/zeroproof/espn-leagues/${league.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        throw new Error(`Couldn't remove the league (${res.status})`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.espnLeagues() });
    },
  });
  return (
    <button
      type="button"
      onClick={() => remove.mutate()}
      disabled={remove.isPending}
      className="rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-error-500/50 hover:text-error-600 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none disabled:opacity-60"
      aria-label={`Remove ${league.game}:${league.leagueId}:${league.season}`}
    >
      {remove.isPending ? "Removing…" : "Remove"}
    </button>
  );
}

export default function AdminEspnLeaguesContent() {
  const query = useQuery({
    queryKey: queryKeys.zeroproof.espnLeagues(),
    queryFn: fetchEspnLeagues,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ESPN leagues
        </h1>
        <p className="mt-1 text-sm text-muted">
          The ESPN fantasy leagues the sync/settle crons ingest. Added here take
          effect on the next cron run — no redeploy. The <code>ESPN_FANTASY_LEAGUES</code>{" "}
          env fallback still works alongside this.
        </p>
      </header>

      <AddLeagueForm />

      <section aria-labelledby="registered-title" className="mt-8">
        <h2 id="registered-title" className="text-sm font-semibold tracking-wide text-muted uppercase">
          Registered
        </h2>
        {query.isLoading ? (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        ) : query.isError ? (
          <p className="mt-2 text-sm text-error-600 dark:text-error-300">
            {(query.error as Error).message}
          </p>
        ) : query.data && query.data.length > 0 ? (
          <table className="mt-3 w-full text-sm" aria-label="Registered ESPN leagues">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th scope="col" className="py-2 pr-2 font-medium">Sport</th>
                <th scope="col" className="py-2 pr-2 font-medium">League</th>
                <th scope="col" className="py-2 pr-2 font-medium">Season</th>
                <th scope="col" className="py-2 pr-2 font-medium">Label</th>
                <th scope="col" className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {query.data.map((league) => (
                <tr key={league.id} className="border-t border-border text-foreground">
                  <td className="py-2 pr-2 font-mono">{league.game}</td>
                  <td className="py-2 pr-2 font-mono">{league.leagueId}</td>
                  <td className="py-2 pr-2 tabular-nums">{league.season}</td>
                  <td className="py-2 pr-2 text-muted">{league.label ?? "—"}</td>
                  <td className="py-2 text-right">
                    <RemoveButton league={league} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No leagues registered yet. Add one above, or set <code>ESPN_FANTASY_LEAGUES</code>.
          </p>
        )}
      </section>
    </div>
  );
}
