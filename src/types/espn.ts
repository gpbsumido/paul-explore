export interface ESPNPlayer {
  id: number;
  fullName: string;
  defaultPositionId: number;
}

export interface ESPNRosterEntry {
  playerPoolEntry: {
    player: ESPNPlayer;
  };
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
