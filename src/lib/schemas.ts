import { z } from "zod";

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

const syncModeSchema = z.enum(["none", "push", "two_way"]);
const calendarRoleSchema = z.enum(["owner", "editor", "viewer"]);

export const calendarSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  syncMode: syncModeSchema,
  googleCalId: z.string().optional(),
  googleCalName: z.string().optional(),
  role: calendarRoleSchema,
  ownerSub: z.string().optional(),
  ownerEmail: z.string().optional(),
});

/** POST /api/calendar/calendars — create */
export const createCalendarBodySchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  syncMode: syncModeSchema,
});

/** PUT /api/calendar/calendars/:id — update */
export const updateCalendarBodySchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  syncMode: syncModeSchema.optional(),
  googleCalId: z.string().optional(),
  googleCalName: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Calendar members
// ---------------------------------------------------------------------------

const memberRoleSchema = z.enum(["editor", "viewer"]);

export const calendarMemberSchema = z.object({
  id: z.string().nullable(),
  userSub: z.string(),
  email: z.string(),
  role: calendarRoleSchema,
  invitedBy: z.string().optional(),
  createdAt: z.string().optional(),
});

/** POST /api/calendar/calendars/:id/members — invite */
export const inviteMemberBodySchema = z.object({
  email: z.email(),
  role: memberRoleSchema,
});

/** PUT /api/calendar/calendars/:id/members/:memberSub — update role */
export const updateMemberRoleBodySchema = z.object({
  role: memberRoleSchema,
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  color: z.string(),
  allDay: z.boolean(),
  calendarId: z.string().optional(),
});

/** POST /api/calendar/events — create */
export const createEventBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  color: z.string().min(1),
  allDay: z.boolean(),
  calendarId: z.string().optional(),
});

/** PUT /api/calendar/events/:id — update */
export const updateEventBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  allDay: z.boolean().optional(),
  calendarId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Event cards
// ---------------------------------------------------------------------------

export const eventCardSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  cardId: z.string(),
  cardName: z.string(),
  cardSetId: z.string().optional(),
  cardSetName: z.string().optional(),
  cardImageUrl: z.string().optional(),
  quantity: z.number(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

/** POST /api/calendar/events/:id/cards — attach card */
export const addCardBodySchema = z.object({
  cardId: z.string().min(1),
  cardName: z.string().min(1),
  cardSetId: z.string().optional(),
  cardSetName: z.string().optional(),
  cardImageUrl: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  notes: z.string().optional(),
});

/** PUT /api/calendar/events/:id/cards/:entryId — update card */
export const updateCardBodySchema = z.object({
  quantity: z.number().int().min(1).optional(),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Countdowns
// ---------------------------------------------------------------------------

export const countdownSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  targetDate: z.string(),
  color: z.string(),
  createdAt: z.string(),
});

/** POST /api/calendar/countdowns — create */
export const createCountdownBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetDate: z.string().min(1),
  color: z.string().min(1),
});

/** PUT /api/calendar/countdowns/:id — update */
export const updateCountdownBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  targetDate: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});

// ---------------------------------------------------------------------------
// API response wrappers (for client-side parsing)
// ---------------------------------------------------------------------------

export const eventsResponseSchema = z.object({ events: z.array(calendarEventSchema) });
export const eventResponseSchema = z.object({ event: calendarEventSchema });
export const calendarsResponseSchema = z.object({ calendars: z.array(calendarSchema) });
export const calendarResponseSchema = z.object({ calendar: calendarSchema });
export const membersResponseSchema = z.object({ members: z.array(calendarMemberSchema) });
export const memberResponseSchema = z.object({ member: calendarMemberSchema });
export const cardsResponseSchema = z.object({ cards: z.array(eventCardSchema) });
export const cardResponseSchema = z.object({ card: eventCardSchema });
export const countdownResponseSchema = z.object({ countdown: countdownSchema });
export const countdownPageResponseSchema = z.object({
  countdowns: z.array(countdownSchema),
  nextCursor: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// GraphQL response wrapper
// ---------------------------------------------------------------------------

/**
 * Builds a Zod schema for PokeAPI GraphQL responses. The data shape is
 * generic so callers pass the inner schema.
 */
export function graphqlResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    errors: z.array(z.object({ message: z.string() })).optional(),
  });
}

export const pokemonStatEntrySchema = z.object({
  base_stat: z.number(),
  pokemon_v2_stat: z.object({ name: z.string() }),
});

export const pokemonTypeEntrySchema = z.object({
  pokemon_v2_type: z.object({ name: z.string() }),
});

export const pokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  pokemon_v2_pokemontypes: z.array(pokemonTypeEntrySchema),
  pokemon_v2_pokemonstats: z.array(pokemonStatEntrySchema),
});

export const pokemonListResultSchema = z.object({
  pokemon_v2_pokemon: z.array(pokemonSchema),
  pokemon_v2_pokemon_aggregate: z.object({
    aggregate: z.object({ count: z.number() }),
  }),
});

export const pokemonGraphQLResponseSchema = graphqlResponseSchema(pokemonListResultSchema);
