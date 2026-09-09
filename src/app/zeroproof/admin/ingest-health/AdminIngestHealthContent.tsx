"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  type IngestEspnHealthRow,
  type IngestHealthRow,
  ingestHealthResponseSchema,
} from "@/lib/zeroproof/schemas";

type Health = { sports: IngestHealthRow[]; espnLeagues: IngestEspnHealthRow[] };

async function fetchIngestHealth(): Promise<Health> {
  const res = await fetch("/api/zeroproof/ingest-health");
  if (!res.ok) throw new Error(`Couldn't load ingest health (${res.status})`);
  return ingestHealthResponseSchema.parse(await res.json());
}

/** A short, human date-time for when a cron last touched a source. */
function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** The status cell: a green "OK" when healthy, a red reason when not. */
function StatusCell({
  lastCheckedAt,
  lastOkAt,
  lastError,
}: {
  lastCheckedAt: string;
  lastOkAt: string | null;
  lastError: string | null;
}) {
  if (lastError) {
    return (
      <span className="text-error-600 dark:text-error-300">
        {lastError}
        <span className="text-muted">
          {" "}
          ({`checked ${formatWhen(lastCheckedAt)}`}
          {lastOkAt ? `, last ok ${formatWhen(lastOkAt)}` : ", never resolved"})
        </span>
      </span>
    );
  }
  return (
    <span className="text-success-600 dark:text-success-300">
      OK <span className="text-muted">· checked {formatWhen(lastCheckedAt)}</span>
    </span>
  );
}

export default function AdminIngestHealthContent() {
  const query = useQuery({
    queryKey: queryKeys.zeroproof.ingestHealth(),
    queryFn: fetchIngestHealth,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ingest health
        </h1>
        <p className="mt-1 text-sm text-muted">
          What the sync and settle crons last managed to resolve. A row goes red
          when a sport or ESPN league can&apos;t be reached — it&apos;s skipped
          (not fatal) and retried next run, but bets on it won&apos;t settle until
          it&apos;s back.
        </p>
      </header>

      {query.isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : query.isError ? (
        <p className="mt-6 text-sm text-error-600 dark:text-error-300">
          {(query.error as Error).message}
        </p>
      ) : query.data ? (
        <>
          <section aria-labelledby="sports-title" className="mt-8">
            <h2 id="sports-title" className="text-sm font-semibold tracking-wide text-muted uppercase">
              Real sports
            </h2>
            {query.data.sports.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                Nothing recorded yet — the crons write this as they run (or you&apos;re on fixtures).
              </p>
            ) : (
              <table className="mt-3 w-full text-sm" aria-label="Real-sports ingest health">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th scope="col" className="py-2 pr-2 font-medium">Sport</th>
                    <th scope="col" className="py-2 pr-2 font-medium">Stage</th>
                    <th scope="col" className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.sports.map((row) => (
                    <tr
                      key={`${row.source}:${row.stage}`}
                      className="border-t border-border align-top text-foreground"
                    >
                      <td className="py-2 pr-2 font-mono">{row.source}</td>
                      <td className="py-2 pr-2">{row.stage}</td>
                      <td className="py-2">
                        <StatusCell {...row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section aria-labelledby="espn-title" className="mt-8">
            <h2 id="espn-title" className="text-sm font-semibold tracking-wide text-muted uppercase">
              ESPN leagues
            </h2>
            {query.data.espnLeagues.length === 0 ? (
              <p className="mt-2 text-sm text-muted">None checked yet.</p>
            ) : (
              <table className="mt-3 w-full text-sm" aria-label="ESPN league ingest health">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th scope="col" className="py-2 pr-2 font-medium">League</th>
                    <th scope="col" className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.espnLeagues.map((row) => (
                    <tr
                      key={`${row.game}:${row.leagueId}:${row.season}`}
                      className="border-t border-border align-top text-foreground"
                    >
                      <td className="py-2 pr-2 font-mono">
                        {row.game}:{row.leagueId} ({row.season})
                      </td>
                      <td className="py-2">
                        <StatusCell {...row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
