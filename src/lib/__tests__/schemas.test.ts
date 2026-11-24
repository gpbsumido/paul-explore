import { describe, it, expect } from "vitest";
import {
  vitalsBeaconSchema,
  updateTodoBodySchema,
  createTodoBodySchema,
  revertTodoBodySchema,
  playoffPicksBodySchema,
  calendarWriteResponseSchema,
  zeroproofTrackBatchSchema,
} from "../schemas";

describe("vitalsBeaconSchema", () => {
  // Matches exactly what WebVitalsReporter sends on each beacon.
  const beacon = {
    metric: "LCP",
    value: 1234.5,
    rating: "good",
    page: "/",
    nav_type: "navigate",
    app_version: "0.16.5",
  };

  it("keeps app_version so the backend records the real version, not 'unknown'", () => {
    const parsed = vitalsBeaconSchema.parse(beacon);
    expect(parsed.app_version).toBe("0.16.5");
  });

  it("keeps nav_type", () => {
    const parsed = vitalsBeaconSchema.parse(beacon);
    expect(parsed.nav_type).toBe("navigate");
  });

  it("still validates the core metric fields", () => {
    const parsed = vitalsBeaconSchema.parse(beacon);
    expect(parsed).toMatchObject({
      metric: "LCP",
      value: 1234.5,
      rating: "good",
      page: "/",
    });
  });

  it("rejects a metric the backend doesn't record", () => {
    expect(vitalsBeaconSchema.safeParse({ ...beacon, metric: "FID" }).success).toBe(false);
  });

  it("rejects a beacon that left nav_type or app_version out", () => {
    const { nav_type: _navType, ...withoutNavType } = beacon;
    const { app_version: _appVersion, ...withoutVersion } = beacon;
    expect(vitalsBeaconSchema.safeParse(withoutNavType).success).toBe(false);
    expect(vitalsBeaconSchema.safeParse(withoutVersion).success).toBe(false);
  });
});

describe("updateTodoBodySchema", () => {
  it("accepts a single changed field", () => {
    expect(updateTodoBodySchema.safeParse({ done: true }).success).toBe(true);
  });

  it("refuses an empty patch, which would record a revision saying nothing changed", () => {
    const result = updateTodoBodySchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Nothing to change");
  });

  it("trims the title and rejects one that is only spaces", () => {
    expect(updateTodoBodySchema.parse({ title: "  Ship it  " })).toEqual({ title: "Ship it" });
    expect(updateTodoBodySchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("holds the phase to 1 through 4", () => {
    expect(updateTodoBodySchema.safeParse({ phase: 1 }).success).toBe(true);
    expect(updateTodoBodySchema.safeParse({ phase: 4 }).success).toBe(true);
    expect(updateTodoBodySchema.safeParse({ phase: 0 }).success).toBe(false);
    expect(updateTodoBodySchema.safeParse({ phase: 5 }).success).toBe(false);
    expect(updateTodoBodySchema.safeParse({ phase: 2.5 }).success).toBe(false);
  });

  it("lets detail, reason, command and the PR link be cleared with null", () => {
    const patch = { detail: null, reason: null, command: null, pr_repo: null, pr_number: null };
    expect(updateTodoBodySchema.parse(patch)).toEqual(patch);
  });

  it("caps the title at 200 characters", () => {
    expect(updateTodoBodySchema.safeParse({ title: "a".repeat(200) }).success).toBe(true);
    expect(updateTodoBodySchema.safeParse({ title: "a".repeat(201) }).success).toBe(false);
  });

  it("requires a positive whole PR number", () => {
    expect(updateTodoBodySchema.safeParse({ pr_number: 12 }).success).toBe(true);
    expect(updateTodoBodySchema.safeParse({ pr_number: 0 }).success).toBe(false);
    expect(updateTodoBodySchema.safeParse({ pr_number: 1.5 }).success).toBe(false);
  });

  it("strips fields the server owns, so position and done_at can't be set from here", () => {
    const parsed = updateTodoBodySchema.parse({ done: true, position: 3, done_at: "2026-01-01" });
    expect(parsed).toEqual({ done: true });
  });
});

describe("createTodoBodySchema", () => {
  it("takes a trimmed title and project", () => {
    expect(createTodoBodySchema.parse({ title: " Fix login ", project: " paul-explore " })).toEqual({
      title: "Fix login",
      project: "paul-explore",
    });
  });

  it("requires both a title and a project", () => {
    expect(createTodoBodySchema.safeParse({ title: "Fix login" }).success).toBe(false);
    expect(createTodoBodySchema.safeParse({ project: "paul-explore" }).success).toBe(false);
  });

  it("holds the title to 200 characters", () => {
    expect(createTodoBodySchema.safeParse({ title: "t".repeat(200), project: "p" }).success).toBe(true);
    expect(createTodoBodySchema.safeParse({ title: "t".repeat(201), project: "p" }).success).toBe(false);
  });

  it("holds the project to 60 characters", () => {
    expect(createTodoBodySchema.safeParse({ title: "t", project: "p".repeat(60) }).success).toBe(true);
    expect(createTodoBodySchema.safeParse({ title: "t", project: "p".repeat(61) }).success).toBe(false);
  });

  it("won't let a new item declare itself already done", () => {
    const parsed = createTodoBodySchema.parse({ title: "t", project: "p", done: true });
    expect(parsed).not.toHaveProperty("done");
  });
});

describe("revertTodoBodySchema", () => {
  it("wants a positive whole revision number", () => {
    expect(revertTodoBodySchema.safeParse({ revision: 3 }).success).toBe(true);
    expect(revertTodoBodySchema.safeParse({ revision: 0 }).success).toBe(false);
    expect(revertTodoBodySchema.safeParse({ revision: "3" }).success).toBe(false);
  });
});

describe("playoffPicksBodySchema", () => {
  it("accepts a map of short keys to short values", () => {
    expect(playoffPicksBodySchema.safeParse({ picks: { "west-r1-1": "LAL" } }).success).toBe(true);
  });

  it("rejects a key or value that is empty or longer than 64 characters", () => {
    expect(playoffPicksBodySchema.safeParse({ picks: { "": "LAL" } }).success).toBe(false);
    expect(playoffPicksBodySchema.safeParse({ picks: { a: "" } }).success).toBe(false);
    expect(playoffPicksBodySchema.safeParse({ picks: { ["k".repeat(65)]: "LAL" } }).success).toBe(false);
    expect(playoffPicksBodySchema.safeParse({ picks: { a: "v".repeat(65) } }).success).toBe(false);
    expect(playoffPicksBodySchema.safeParse({ picks: { ["k".repeat(64)]: "v".repeat(64) } }).success).toBe(true);
  });

  it("rejects nested values rather than storing them", () => {
    expect(playoffPicksBodySchema.safeParse({ picks: { a: { deep: "x" } } }).success).toBe(false);
  });
});

describe("calendarWriteResponseSchema", () => {
  const written = { id: "c1", name: "Work", color: "#fff", syncMode: "none" };

  it("reads a calendar with no role as one the caller owns", () => {
    expect(calendarWriteResponseSchema.parse({ calendar: written }).calendar.role).toBe("owner");
  });

  it("keeps a role when one is sent", () => {
    const parsed = calendarWriteResponseSchema.parse({ calendar: { ...written, role: "viewer" } });
    expect(parsed.calendar.role).toBe("viewer");
  });
});

describe("zeroproofTrackBatchSchema", () => {
  const event = {
    eventUuid: "6f9c2d3e-8b1a-4c5d-9e7f-0a1b2c3d4e5f",
    name: "page_view",
    page: "/zeroproof",
    seq: 0,
    sessionId: "session-1",
    anonId: "anon-1",
    clientTs: "2026-05-01T12:00:00.000Z",
    appVersion: "6.0.0",
  };

  it("takes between one and a hundred events", () => {
    expect(zeroproofTrackBatchSchema.safeParse({ events: [] }).success).toBe(false);
    expect(zeroproofTrackBatchSchema.safeParse({ events: [event] }).success).toBe(true);
    expect(zeroproofTrackBatchSchema.safeParse({ events: Array(100).fill(event) }).success).toBe(true);
    expect(zeroproofTrackBatchSchema.safeParse({ events: Array(101).fill(event) }).success).toBe(false);
  });

  it("rejects an event whose id isn't a UUID or whose timestamp isn't a datetime", () => {
    expect(zeroproofTrackBatchSchema.safeParse({ events: [{ ...event, eventUuid: "nope" }] }).success).toBe(false);
    expect(zeroproofTrackBatchSchema.safeParse({ events: [{ ...event, clientTs: "yesterday" }] }).success).toBe(false);
  });

  it("rejects a negative sequence number", () => {
    expect(zeroproofTrackBatchSchema.safeParse({ events: [{ ...event, seq: -1 }] }).success).toBe(false);
  });
});
