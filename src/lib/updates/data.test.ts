import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { updateEntrySchema, ticketSchema } from "./types";
import { UPDATE_ENTRIES } from "./entries.data";
import { SEED_TICKETS } from "./tickets.data";

describe("update entries data", () => {
  it("every entry parses against the schema", () => {
    const failures = UPDATE_ENTRIES.flatMap((entry) => {
      const result = updateEntrySchema.safeParse(entry);
      return result.success ? [] : [`${entry.id}: ${result.error.message}`];
    });
    expect(failures).toEqual([]);
  });

  it("has unique ids", () => {
    const ids = UPDATE_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has at least a handful of entries to make the feed worth reading", () => {
    expect(UPDATE_ENTRIES.length).toBeGreaterThanOrEqual(6);
  });
});

describe("the public feed keeps pace with releases", () => {
  const version: string = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf-8"),
  ).version;

  it("gives the current minor or major release a public update entry", () => {
    const patch = version.split(".")[2];
    // Patch releases are small fixes and stay out of the curated feed on
    // purpose. A minor or major bump (X.Y.0) ships a feature or a real change,
    // so it has to be told to a reader here — this is the guard that a version
    // bump can't land without one.
    const needsEntry = patch === "0";
    const shipped = new Set(UPDATE_ENTRIES.map((e) => e.version));
    // Always asserts, so a patch version is a passing check and not an empty
    // test that proves nothing.
    expect(
      !needsEntry || shipped.has(version),
      `${version} is a minor/major release but has no UPDATE_ENTRIES entry — add one to entries.data.ts`,
    ).toBe(true);
  });
});

describe("seed tickets data", () => {
  it("every ticket parses against the schema", () => {
    const failures = SEED_TICKETS.flatMap((ticket) => {
      const result = ticketSchema.safeParse(ticket);
      return result.success ? [] : [`${ticket.id}: ${result.error.message}`];
    });
    expect(failures).toEqual([]);
  });

  it("has unique ids", () => {
    const ids = SEED_TICKETS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every status so the board is never a single column", () => {
    const statuses = new Set(SEED_TICKETS.map((t) => t.status));
    expect(statuses).toEqual(
      new Set(["open", "planned", "in_progress", "shipped"]),
    );
  });
});

describe("cross-links between entries and tickets", () => {
  const entryById = new Map(UPDATE_ENTRIES.map((e) => [e.id, e]));
  const ticketById = new Map(SEED_TICKETS.map((t) => [t.id, t]));

  it("every resolvedTicketId points at a real ticket that points back", () => {
    for (const entry of UPDATE_ENTRIES) {
      for (const ticketId of entry.resolvedTicketIds) {
        const ticket = ticketById.get(ticketId);
        expect(ticket, `entry ${entry.id} -> ticket ${ticketId}`).toBeDefined();
        expect(ticket?.resolvedByEntryId).toBe(entry.id);
      }
    }
  });

  it("every shipped ticket resolves to a real entry that lists it", () => {
    for (const ticket of SEED_TICKETS) {
      if (ticket.status !== "shipped") continue;
      expect(
        ticket.resolvedByEntryId,
        `shipped ticket ${ticket.id} needs an entry`,
      ).toBeDefined();
      const entry = entryById.get(ticket.resolvedByEntryId!);
      expect(entry, `ticket ${ticket.id} -> entry`).toBeDefined();
      expect(entry?.resolvedTicketIds).toContain(ticket.id);
    }
  });

  it("only shipped tickets carry a resolvedByEntryId", () => {
    for (const ticket of SEED_TICKETS) {
      if (ticket.status === "shipped") continue;
      expect(ticket.resolvedByEntryId).toBeUndefined();
    }
  });
});
