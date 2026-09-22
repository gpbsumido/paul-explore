/**
 * Turns an ESPN fantasy football league payload into the week's matchups,
 * validating the shape at the boundary so a malformed or unauthorized response
 * degrades to an empty board rather than a throw — the same posture as
 * espn-performances.ts. ESPN keys the roster by the requested scoringPeriodId,
 * so the caller passes the week and reads `rosterForCurrentScoringPeriod`.
 */
import { z } from "zod";
import {
  NFL_BENCH_SLOTS,
  type NflMatchup,
  type NflMatchupSide,
  type NflPlayerLine,
  type NflScoreboard,
} from "@/types/espn-nfl";

const statSchema = z.object({
  scoringPeriodId: z.number().optional(),
  statSourceId: z.number().optional(),
  statSplitTypeId: z.number().optional(),
  appliedTotal: z.number().optional(),
});

const rosterEntrySchema = z.object({
  lineupSlotId: z.number().optional(),
  playerPoolEntry: z.object({
    player: z.object({
      id: z.number(),
      fullName: z.string().min(1),
      proTeamId: z.number().optional(),
      defaultPositionId: z.number().optional(),
      stats: z.array(statSchema).optional(),
    }),
  }),
});

const sideSchema = z.object({
  teamId: z.number(),
  totalPoints: z.number().optional(),
  rosterForCurrentScoringPeriod: z
    .object({ entries: z.array(z.unknown()) })
    .optional(),
});

const scheduleSchema = z.object({
  id: z.number().optional(),
  matchupPeriodId: z.number().optional(),
  winner: z.string().optional(),
  home: sideSchema.optional(),
  away: sideSchema.optional(),
});

const memberSchema = z.object({
  id: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
});

const teamSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  abbrev: z.string().optional(),
  owners: z.array(z.string()).optional(),
});

const leagueSchema = z.object({
  status: z
    .object({
      currentMatchupPeriod: z.number().optional(),
      latestScoringPeriod: z.number().optional(),
    })
    .optional(),
  settings: z
    .object({
      scheduleSettings: z
        .object({ matchupPeriodCount: z.number().optional() })
        .optional(),
    })
    .optional(),
  members: z.array(memberSchema).optional(),
  teams: z.array(teamSchema).optional(),
  schedule: z.array(scheduleSchema).optional(),
});

type Member = z.infer<typeof memberSchema>;
type Team = z.infer<typeof teamSchema>;
type Side = z.infer<typeof sideSchema>;
type Stat = z.infer<typeof statSchema>;

/** The player's actual (source 0) or projected (source 1) points for the week. */
function pointsFor(
  stats: Stat[] | undefined,
  week: number,
  statSourceId: number,
): number {
  const stat = stats?.find(
    (s) => s.scoringPeriodId === week && s.statSourceId === statSourceId,
  );
  return stat?.appliedTotal ?? 0;
}

/** The owner's name: real name when both parts are set, else the handle. */
function ownerName(team: Team | undefined, members: Member[]): string {
  const ownerId = team?.owners?.[0];
  if (!ownerId) return "Unknown";
  const member = members.find((m) => m.id === ownerId);
  if (!member) return "Unknown";
  return member.firstName && member.lastName
    ? `${member.firstName} ${member.lastName}`
    : (member.displayName ?? "Unknown");
}

function playerLine(
  entry: z.infer<typeof rosterEntrySchema>,
  week: number,
): NflPlayerLine {
  const player = entry.playerPoolEntry.player;
  const slot = entry.lineupSlotId ?? -1;
  return {
    playerId: player.id,
    name: player.fullName,
    proTeamId: player.proTeamId ?? 0,
    positionId: player.defaultPositionId ?? 0,
    lineupSlotId: slot,
    actual: pointsFor(player.stats, week, 0),
    projected: pointsFor(player.stats, week, 1),
    started: !NFL_BENCH_SLOTS.has(slot),
  };
}

function buildSide(
  side: Side,
  week: number,
  teams: Team[],
  members: Member[],
): NflMatchupSide {
  const team = teams.find((t) => t.id === side.teamId);
  const starters: NflPlayerLine[] = [];
  const bench: NflPlayerLine[] = [];

  for (const raw of side.rosterForCurrentScoringPeriod?.entries ?? []) {
    const parsed = rosterEntrySchema.safeParse(raw);
    if (!parsed.success) continue;
    const line = playerLine(parsed.data, week);
    (line.started ? starters : bench).push(line);
  }

  const remaining = starters.reduce(
    (sum, p) => sum + Math.max(0, p.projected - p.actual),
    0,
  );

  return {
    teamId: side.teamId,
    name: team?.name ?? `Team ${side.teamId}`,
    abbrev: team?.abbrev ?? "",
    ownerName: ownerName(team, members),
    totalPoints: side.totalPoints ?? 0,
    remaining,
    starters,
    bench,
  };
}

/** Parse a league payload into one week's matchups and the selector bounds. */
export function parseNflScoreboard(
  payload: unknown,
  { season, week }: { season: number; week: number },
): NflScoreboard {
  const parsed = leagueSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      season,
      currentWeek: week,
      regularSeasonWeeks: 0,
      totalWeeks: 0,
      matchups: [],
    };
  }

  const league = parsed.data;
  const teams = league.teams ?? [];
  const members = league.members ?? [];
  const schedule = league.schedule ?? [];

  const matchups: NflMatchup[] = [];
  for (const s of schedule) {
    if (s.matchupPeriodId !== week || !s.home || !s.away) continue;
    matchups.push({
      id: s.id ?? 0,
      matchupPeriodId: week,
      winner: s.winner ?? "UNDECIDED",
      away: buildSide(s.away, week, teams, members),
      home: buildSide(s.home, week, teams, members),
    });
  }

  return {
    season,
    currentWeek: league.status?.currentMatchupPeriod ?? week,
    regularSeasonWeeks: league.settings?.scheduleSettings?.matchupPeriodCount ?? 0,
    totalWeeks: schedule.reduce(
      (max, s) => Math.max(max, s.matchupPeriodId ?? 0),
      0,
    ),
    matchups,
  };
}
