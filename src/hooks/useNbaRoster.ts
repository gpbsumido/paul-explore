"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryKeys } from "@/lib/queryKeys";
import { responseError } from "@/lib/responseError";
import type { Player, Team } from "@/types/nba";

const teamSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  abbreviation: z.string(),
  city: z.string(),
  conference: z.string(),
  division: z.string(),
  name: z.string(),
});

const playerSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  position: z.string(),
  team: teamSchema.optional(),
});

// portfolio_api wraps the two lists differently: the controller puts the
// paginated teams result inside its own `data`, while a roster is sent as-is.
const teamsBodySchema = z.object({ data: z.object({ data: z.array(teamSchema) }) });
const rosterBodySchema = z.object({ data: z.array(playerSchema) });

const ROSTER_STALE_MS = 5 * 60_000;

/** Every NBA team, sorted by full name for a team picker. */
export function useNbaTeams() {
  return useQuery({
    queryKey: queryKeys.nba.teams(),
    queryFn: async (): Promise<Team[]> => {
      const res = await fetch("/api/nba/teams");
      if (!res.ok) throw await responseError(res, "Failed to load teams");
      const teams = teamsBodySchema.parse(await res.json()).data.data;
      return teams.toSorted((a, b) => a.full_name.localeCompare(b.full_name));
    },
    staleTime: ROSTER_STALE_MS,
  });
}

/** One team's roster. Idle until a team is picked. */
export function useNbaPlayers(teamId: number | null) {
  return useQuery({
    queryKey: queryKeys.nba.players(teamId ?? 0),
    queryFn: async (): Promise<Player[]> => {
      const res = await fetch(`/api/nba/players/${teamId}`);
      if (!res.ok) throw await responseError(res, "Failed to load players");
      return rosterBodySchema.parse(await res.json()).data;
    },
    enabled: teamId !== null,
    staleTime: ROSTER_STALE_MS,
  });
}
