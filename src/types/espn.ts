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
}

export interface ESPNLeagueResponse {
  settings: {
    name: string;
  };
  teams: ESPNTeam[];
  members: ESPNMember[];
}
