"use client";

import { responseError } from "@/lib/responseError";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  type EspnLeague,
  espnLeaguesResponseSchema,
} from "@/lib/zeroproof/schemas";
import AdminBackLink from "../AdminBackLink";
import EspnLeagueForm from "../../EspnLeagueForm";

async function fetchEspnLeagues(): Promise<EspnLeague[]> {
  const res = await fetch("/api/zeroproof/espn-leagues");
  if (!res.ok) throw await responseError(res, `Couldn't load ESPN leagues (${res.status})`);
  return espnLeaguesResponseSchema.parse(await res.json()).leagues;
}

function RemoveButton({ league }: { league: EspnLeague }) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/zeroproof/espn-leagues/${league.id}`, { method: "DELETE" });
      if (!res.ok) throw await responseError(res, `Couldn't remove the league (${res.status})`);
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
      <AdminBackLink current="ESPN leagues" />
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

      <div className="mt-4">
        <EspnLeagueForm
          endpoint="/api/zeroproof/espn-leagues"
          listQueryKey={queryKeys.zeroproof.espnLeagues()}
          idPrefix="espn"
        />
      </div>

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
