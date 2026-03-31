export interface ESPNPlayerStats {
  id: string;
  stats: Record<string, number>;
  appliedTotal: number;
}

export interface ESPNPlayer {
  id: number;
  fullName: string;
  defaultPositionId: number;
  injuryStatus?: "ACTIVE" | "DAY_TO_DAY" | "OUT" | "QUESTIONABLE" | "DOUBTFUL";
  proTeamId?: number;
  stats?: ESPNPlayerStats[];
}

/** ESPN position ID to readable abbreviation. */
export const ESPN_POSITION_MAP: Record<number, string> = {
  1: "PG",
  2: "SG",
  3: "SF",
  4: "PF",
  5: "C",
};

export interface ESPNRosterEntry {
  playerPoolEntry: {
    player: ESPNPlayer;
    ratings?: Record<string, { totalRating: number }>;
  };
  lineupSlotId: number;
}

export interface ESPNRecord {
  overall: {
    wins: number;
    losses: number;
  };
}

export interface ESPNOwner {
  displayName: string;
}

export interface ESPNTeam {
  id: number;
  name: string;
  abbrev: string;
  owners: string[];
  record: ESPNRecord;
  roster: {
    entries: ESPNRosterEntry[];
  };
  currentProjectedRank: number;
  rankCalculatedFinal: number;
}

export interface ESPNMember {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

export interface ESPNLeagueResponse {
  settings: {
    name: string;
  };
  teams: ESPNTeam[];
  members: ESPNMember[];
}

// ---- Scoreboard / Matchup types ----

export interface ESPNStatScore {
  score: number;
  result: string | null;
}

export interface ESPNCumulativeScore {
  wins: number;
  losses: number;
  ties: number;
  scoreByStat: Record<string, ESPNStatScore>;
}

export interface ESPNMatchupSide {
  teamId: number;
  totalPoints: number;
  cumulativeScore: ESPNCumulativeScore;
}

export interface ESPNScheduleEntry {
  id: number;
  away: ESPNMatchupSide;
  home: ESPNMatchupSide;
  winner: "HOME" | "AWAY" | "UNDECIDED";
}

export interface ESPNScoreboardResponse {
  schedule: ESPNScheduleEntry[];
  teams: ESPNTeam[];
  members: ESPNMember[];
  settings: {
    name: string;
    scheduleSettings: {
      matchupPeriodCount: number;
    };
  };
  status: {
    currentMatchupPeriod: number;
  };
}
