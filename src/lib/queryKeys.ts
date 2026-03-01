/**
 * Typed query key factories for every data domain in the app.
 *
 * Centralizing keys here means a useQuery call and its corresponding
 * invalidateQueries call always use the same shape. Change the key once
 * and every reference stays in sync.
 *
 * Each factory returns `as const` so TypeScript knows the exact tuple type,
 * which TanStack Query uses for precise cache matching.
 */
export const queryKeys = {
  /** Current logged-in user's name and email from /api/me. */
  me: () => ["me"] as const,

  calendar: {
    /**
     * Calendar events for a specific date window. Keyed by start and end
     * so navigating months never serves stale data for the wrong range.
     */
    events: (range: { start: string; end: string }) =>
      ["calendar", "events", range] as const,
  },

  nba: {
    /** Full list of NBA teams, used to populate the team selector. */
    teams: () => ["nba", "teams"] as const,

    /** Roster for a specific team, keyed by team id. */
    players: (teamId: number) => ["nba", "players", teamId] as const,

    /** Season stats for a single player, keyed by player id. */
    stats: (playerId: number) => ["nba", "stats", playerId] as const,

    /** Fantasy league history for a given season year. */
    league: (season: number) => ["nba", "league", season] as const,
  },

  tcg: {
    /**
     * TCG card list. Params include any combination of search query, type
     * filter, and set id. Each unique combo gets its own cache entry, which
     * is what we want for infinite scroll pages with URL-synced filters.
     */
    cards: (params: { q?: string; type?: string; setId?: string }) =>
      ["tcg", "cards", params] as const,
  },

  graphql: {
    /**
     * GraphQL Pokemon list. Name and type are both part of the key so
     * switching filters always fetches fresh data from the right offset.
     */
    pokemon: (params: { name: string; type: string }) =>
      ["graphql", "pokemon", params] as const,
  },
} as const;
