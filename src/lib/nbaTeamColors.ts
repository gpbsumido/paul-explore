export type TeamInfo = {
  /** Primary brand color (hex). Used for winner highlights. */
  primary: string;
  /** Secondary brand color (hex). Used for accents and gradients. */
  secondary: string;
};

/**
 * Brand colors for 2025-26 playoff teams.
 * Keyed by the team abbreviation used in the bracket data.
 */
export const TEAM_INFO: Record<string, TeamInfo> = {
  ATL: { primary: "#e03a3e", secondary: "#c1d32f" },
  BOS: { primary: "#007a33", secondary: "#ba9653" },
  CLE: { primary: "#860038", secondary: "#fdbb30" },
  DEN: { primary: "#0e2240", secondary: "#fec524" },
  DET: { primary: "#1d42ba", secondary: "#c8102e" },
  HOU: { primary: "#ce1141", secondary: "#c4ced4" },
  LAL: { primary: "#552583", secondary: "#fdb927" },
  MIN: { primary: "#0c2340", secondary: "#78be20" },
  NY: { primary: "#006bb6", secondary: "#f58426" },
  OKC: { primary: "#007ac1", secondary: "#ef3b24" },
  ORL: { primary: "#0077c0", secondary: "#c4ced4" },
  PHI: { primary: "#006bb6", secondary: "#ed174c" },
  PHX: { primary: "#1d1160", secondary: "#e56020" },
  POR: { primary: "#e03a3e", secondary: "#000000" },
  SA: { primary: "#6d6e71", secondary: "#000000" },
  TOR: { primary: "#ce1141", secondary: "#000000" },
};

export function getTeamInfo(abbreviation: string): TeamInfo | undefined {
  return TEAM_INFO[abbreviation];
}

/**
 * Returns the ESPN CDN logo URL for a team by its ESPN numeric teamId.
 * Returns null for TBD teams (empty teamId).
 */
export function getTeamLogoUrl(teamId: string): string | null {
  if (!teamId) return null;
  return `https://a.espncdn.com/i/teamlogos/nba/500/${teamId}.png`;
}
