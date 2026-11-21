import { describe, it, expect } from "vitest";
import type { Budget } from "./types";
import { encodeInvite, decodeInvite, buildInviteLink, parseJoinToken } from "./share";

const budget: Budget = {
  people: [{ id: "p-1", name: "Paul" }],
  activePersonId: "p-1",
  cycleStartDay: 1,
  visibility: "private",
  joinRequests: [],
  expenses: [
    {
      id: "e-1",
      categoryId: "food",
      amountCents: 1234,
      occurredAt: "2026-09-14T12:00:00.000Z",
      personId: "p-1",
      tags: ["necessary"],
    },
  ],
};

describe("invite encoding", () => {
  it("round-trips a budget through an opaque token", () => {
    const token = encodeInvite(budget);
    expect(token).not.toContain("{");
    expect(decodeInvite(token)).toEqual(budget);
  });

  it("keeps non-ASCII names intact through the round trip", () => {
    const named: Budget = {
      ...budget,
      people: [{ id: "p-1", name: "Jos\u00e9 \u{1F354}" }],
    };
    expect(decodeInvite(encodeInvite(named))).toEqual(named);
  });

  it("only uses characters that are safe in a URL, even when the JSON would encode to + and /", () => {
    const awkward: Budget = {
      ...budget,
      people: [{ id: "p-1", name: "???>>>~~~???>>>" }],
    };
    expect(encodeInvite(awkward)).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeInvite(encodeInvite(awkward))).toEqual(awkward);
  });

  it("returns null for a token that decodes to JSON but not a budget", () => {
    expect(decodeInvite(btoa(JSON.stringify({ people: [] })))).toBeNull();
  });

  it("returns null for a token that isn't a valid budget", () => {
    expect(decodeInvite("not-a-real-token")).toBeNull();
  });
});

describe("buildInviteLink", () => {
  it("points at /budget with a join token", () => {
    const link = buildInviteLink(budget, "https://paulsumido.com");
    expect(link.startsWith("https://paulsumido.com/budget?join=")).toBe(true);
    expect(decodeInvite(parseJoinToken(new URL(link).search)!)).toEqual(budget);
  });
});

describe("parseJoinToken", () => {
  it("reads the join token from a search string", () => {
    expect(parseJoinToken("?join=abc")).toBe("abc");
  });

  it("is null when there is no join token", () => {
    expect(parseJoinToken("?foo=1")).toBeNull();
  });
});
