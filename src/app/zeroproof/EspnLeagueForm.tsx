"use client";

import { useState } from "react";
import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { responseError } from "@/lib/responseError";
import { ESPN_GAMES } from "@/lib/zeroproof/espnGames";
import { controlClass, primaryButtonClass } from "./controls";

type EspnLeagueFormProps = {
  /** Where the new league is POSTed. */
  endpoint: string;
  /** The query that lists the leagues, refetched once one is added. */
  listQueryKey: QueryKey;
  /** Prefix for the field ids, so two forms on one page don't share them. */
  idPrefix: string;
};

/**
 * Adds an ESPN fantasy league by sport, league id and season. The admin page
 * registers leagues for the whole site and a commissioner adds them to one
 * ZeroProof league; the fields and the rules are the same, only where it posts
 * differs. Clears on success and keeps what was typed when the add is refused.
 */
export default function EspnLeagueForm({
  endpoint,
  listQueryKey,
  idPrefix,
}: EspnLeagueFormProps) {
  const queryClient = useQueryClient();
  const [game, setGame] = useState<string>(ESPN_GAMES[0].code);
  const [espnLeagueId, setEspnLeagueId] = useState("");
  const [season, setSeason] = useState("");
  const [label, setLabel] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        game,
        leagueId: espnLeagueId.trim(),
        season: season.trim(),
      };
      if (label.trim()) body.label = label.trim();
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await responseError(res, `Couldn't add the league (${res.status})`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      setEspnLeagueId("");
      setSeason("");
      setLabel("");
    },
  });

  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-raised p-3"
      onSubmit={(event) => {
        event.preventDefault();
        add.mutate();
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-game`} className="text-xs text-muted">
          Sport
        </label>
        <select
          id={`${idPrefix}-game`}
          value={game}
          onChange={(event) => setGame(event.target.value)}
          className={`${controlClass} w-32`}
        >
          {ESPN_GAMES.map(({ code, sport }) => (
            <option key={code} value={code}>
              {sport}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-id`} className="text-xs text-muted">
          ESPN league id
        </label>
        <input
          id={`${idPrefix}-id`}
          inputMode="numeric"
          required
          value={espnLeagueId}
          onChange={(event) => setEspnLeagueId(event.target.value)}
          placeholder="836777691"
          className={`${controlClass} w-40`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-season`} className="text-xs text-muted">
          Season
        </label>
        <input
          id={`${idPrefix}-season`}
          inputMode="numeric"
          required
          value={season}
          onChange={(event) => setSeason(event.target.value)}
          placeholder="2026"
          className={`${controlClass} w-24`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-label`} className="text-xs text-muted">
          Label (optional)
        </label>
        <input
          id={`${idPrefix}-label`}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="The office league"
          className={`${controlClass} w-52`}
        />
      </div>
      <button type="submit" disabled={add.isPending} className={primaryButtonClass}>
        {add.isPending ? "Adding…" : "Add league"}
      </button>
      {add.isError && (
        <p className="w-full text-xs text-error-600 dark:text-error-300">
          {add.error.message}
        </p>
      )}
    </form>
  );
}
