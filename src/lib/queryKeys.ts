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

  /** Admin to-do list from /api/todos. */
  todos: () => ["todos"] as const,

  calendar: {
    /**
     * Calendar events for a specific date window. Keyed by start and end
     * so navigating months never serves stale data for the wrong range.
     */
    events: (range: { start: string; end: string; calendarId?: string }) =>
      ["calendar", "events", range] as const,

    /**
     * Events list page. Keyed by the three backend filter params: date range
     * and card name. Title filtering runs client-side so it does not appear
     * in the key — typing in the title box never triggers a network request.
     */
    eventsList: (filters: {
      startDate: string;
      endDate: string;
      cardName: string;
    }) => ["calendar", "eventsList", filters] as const,

    /**
     * All countdowns for the current user. Not scoped by date range because
     * countdowns are fetched all at once and shown wherever their target date
     * falls in the calendar. One key, one request, no range math needed.
     */
    countdowns: () => ["calendar", "countdowns"] as const,

    /** All named calendars for the current user. */
    calendars: () => ["calendar", "calendars"] as const,

    /** Members of a specific calendar. Keyed by calendar ID. */
    calendarMembers: (calendarId: string) =>
      ["calendar", "members", calendarId] as const,

    /**
     * TCG cards attached to a specific event. Keyed by event ID so opening
     * different events never shares a cache entry.
     */
    eventCards: (eventId: string) =>
      ["calendar", "events", eventId, "cards"] as const,
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

    /** Scoreboard matchups for a given season year. */
    scoreboard: (season: number) => ["nba", "scoreboard", season] as const,

    /** Shot chart zones for a single player. */
    shots: (playerId: number) => ["nba", "shots", playerId] as const,

    /** NBA game schedule for a date range (YYYYMMDD). */
    schedule: (start: string, end: string) =>
      ["nba", "schedule", start, end] as const,

    /** Top free agents for a given season. */
    freeAgents: (season: number) => ["nba", "freeAgents", season] as const,

    /** Playoffs bracket data including series, picks, and Finals MVP. */
    playoffBracket: () => ["nba", "playoffs", "bracket"] as const,

    /** Authenticated user's bracket picks for the current season. */
    playoffPicks: () => ["nba", "playoffs", "picks"] as const,

    /** Public playoff pick leaderboard. */
    playoffLeaderboard: () => ["nba", "playoffs", "leaderboard"] as const,

    /** Public bracket picks for any user by their Auth0 sub. */
    playoffPicksByUser: (sub: string) =>
      ["nba", "playoffs", "picks", sub] as const,
  },

  tcg: {
    /**
     * TCG card list. Params include any combination of search query, type
     * filter, and set id. Each unique combo gets its own cache entry, which
     * is what we want for infinite scroll pages with URL-synced filters.
     */
    cards: (params: { q?: string; type?: string; setId?: string }) =>
      ["tcg", "cards", params] as const,

    /**
     * Debounced card search used in the event modal card picker. Separate
     * from tcg.cards because this is a simple string query with no filters,
     * and we don't want modal searches polluting the browse page cache.
     */
    search: (query: string) => ["tcg", "cards", "search", query] as const,
  },

  graphql: {
    /**
     * GraphQL Pokemon list. Name and type are both part of the key so
     * switching filters always fetches fresh data from the right offset.
     */
    pokemon: (params: { name: string; type: string }) =>
      ["graphql", "pokemon", params] as const,
  },

  google: {
    /**
     * Whether the current user has connected their Google Calendar.
     * Polled every 5 minutes from the calendar header so the sync indicator
     * stays accurate without hammering the backend.
     */
    authStatus: () => ["google", "auth", "status"] as const,
  },

  operator: {
    /** All stores in the fleet. Polled every 30s on the dashboard. */
    stores: () => ["operator", "stores"] as const,

    /** Single store detail, keyed by store id. */
    store: (storeId: string) => ["operator", "stores", storeId] as const,

    /** Inventory for a specific store. Polled every 60s. */
    inventory: (storeId: string) =>
      ["operator", "stores", storeId, "inventory"] as const,

    /** Alerts for a specific store. Polled every 15s. */
    alerts: (storeId: string) =>
      ["operator", "stores", storeId, "alerts"] as const,

    /** Activity events for a specific store. */
    activity: (storeId: string) =>
      ["operator", "stores", storeId, "activity"] as const,

    /** Completed restock sessions for a specific store, newest first. */
    restockHistory: (storeId: string) =>
      ["operator", "stores", storeId, "restock-history"] as const,

    /** Sales history for a specific store. Polled every 60s. */
    sales: (storeId: string) =>
      ["operator", "stores", storeId, "sales"] as const,

    /** Persisted planogram layout for a specific store. Polled every 60s. */
    planogram: (storeId: string) =>
      ["operator", "stores", storeId, "planogram"] as const,

    /** Aggregated alert counts + inventory health for the fleet dashboard. Polled every 15s. */
    fleetSummary: () => ["operator", "fleet-summary"] as const,

    /** Scheduled promotions for a store. */
    promotions: (storeId: string) =>
      ["operator", "stores", storeId, "promotions"] as const,

    /**
     * Fleet-wide sales analytics for a granularity (day/week/month/year).
     * Keyed by zone too: the same granularity in a different timezone is a
     * different set of buckets, so they must not share a cache entry.
     */
    salesAnalytics: (granularity: string, timeZone: string) =>
      ["operator", "sales-analytics", granularity, timeZone] as const,
  },

  research: {
    /**
     * Evidence scan across every curated vascular topic. One key, because the
     * scan is all-or-nothing and Refresh invalidates exactly this.
     */
    topics: () => ["research", "topics"] as const,

    /**
     * Recent publications for a topic or journal, narrowed by demographic
     * facets. Every filter combination is its own cache entry, so toggling a
     * facet off returns to an already-fetched list instantly.
     */
    publications: (params: {
      topicId?: string;
      journalId?: string;
      journalName?: string;
      meshTerm?: string;
      demoIds: string[];
      sources: string[];
    }) => ["research", "publications", params] as const,

    /**
     * The same evidence scan scoped to one population. Its own key so the
     * unscoped scan stays cached alongside it -- the Counts tab reads both at
     * once to work out each topic's share.
     */
    topicsByDemo: (demoId: string) =>
      ["research", "topics", "demo", demoId] as const,

    /**
     * Which populations still have papers once some are already selected.
     * Keyed by scope and selection because the answer changes with both.
     */
    facetAvailability: (
      scope: { topicId?: string; meshTerm?: string },
      selected: string[],
    ) => ["research", "facet-availability", scope, selected] as const,

    /** Recent papers with discussion material, for one topic. */
    journalClub: (topicId: string, innovativeOnly: boolean) =>
      ["research", "journal-club", topicId, innovativeOnly] as const,

    /** Topics derived from the MeSH headings of recent vascular literature. */
    discover: () => ["research", "discover"] as const,

    /**
     * Per-facet literature counts, scoped to a topic or the whole field, and
     * optionally bounded to a recent window. The window is part of the key: an
     * all-time split and a five-year split are different answers.
     */
    demographics: (topicId?: string, windowYears?: number) =>
      [
        "research",
        "demographics",
        topicId ?? "all",
        windowYears ?? "all-time",
      ] as const,
  },

  flags: {
    /** All feature flags and their per-environment config. */
    list: () => ["flags", "list"] as const,

    /** The flag-change audit log, newest first. */
    audit: () => ["flags", "audit"] as const,
  },
} as const;
