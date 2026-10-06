import { describe, it, expect } from "vitest";
import {
  attempt,
  authorize,
  discoverConnection,
  startSession,
} from "./organizations";
import { CONNECTIONS, USERS } from "./fixtures";

const priya = USERS.find((u) => u.email === "priya@acme.com")!;
const sam = USERS.find((u) => u.email === "sam@acme.com")!;

const sessionFor = (user: typeof priya, orgId: string | null) => {
  const result = startSession(user, orgId);
  if (!result.ok) throw new Error(`expected a session, got ${result.reason}`);
  return result.session;
};

describe("home realm discovery", () => {
  it("routes an email to the connection that owns its domain", () => {
    const connection = discoverConnection("priya@acme.com", CONNECTIONS);
    expect(connection.orgId).toBe("org_acme");
  });

  it("matches the domain case-insensitively", () => {
    expect(discoverConnection("Priya@ACME.com", CONNECTIONS).orgId).toBe(
      "org_acme",
    );
  });

  it("falls back to the database connection, with no org, for an unknown domain", () => {
    const connection = discoverConnection("someone@gmail.com", CONNECTIONS);
    expect(connection.orgId).toBeNull();
  });

  it("does not match a lookalike domain", () => {
    const connection = discoverConnection("eve@acme.com.evil.io", CONNECTIONS);
    expect(connection.orgId).toBeNull();
  });
});

describe("org-scoped sessions", () => {
  it("carries org_id and only the roles held in that org", () => {
    expect(sessionFor(priya, "org_acme")).toMatchObject({
      org_id: "org_acme",
      roles: ["admin"],
    });
    expect(sessionFor(priya, "org_globex")).toMatchObject({
      org_id: "org_globex",
      roles: ["member"],
    });
  });

  it("refuses an org the user does not belong to", () => {
    expect(startSession(sam, "org_globex")).toEqual({
      ok: false,
      reason: "not_a_member",
    });
  });

  it("issues an org-less session for a database login", () => {
    expect(sessionFor(priya, null)).toMatchObject({ org_id: null, roles: [] });
  });
});

describe("authorize", () => {
  it("allows what the role grants", () => {
    const admin = sessionFor(priya, "org_acme");
    expect(authorize(admin, "manage_connection", "org_acme").decision).toBe(
      "allow",
    );
  });

  it("denies what the role does not grant", () => {
    const member = sessionFor(sam, "org_acme");
    expect(authorize(member, "manage_connection", "org_acme")).toEqual({
      decision: "deny",
      reason: "missing_permission",
    });
  });

  it("denies another tenant's resource even to an admin elsewhere", () => {
    const admin = sessionFor(priya, "org_acme");
    expect(authorize(admin, "read_members", "org_globex")).toEqual({
      decision: "deny",
      reason: "cross_tenant",
    });
  });

  it("denies everything without an org in the session", () => {
    const loose = sessionFor(priya, null);
    expect(authorize(loose, "read_members", "org_acme")).toEqual({
      decision: "deny",
      reason: "no_org_in_session",
    });
  });
});

describe("audit log", () => {
  it("records allow and deny alike without mutating the log it was given", () => {
    const admin = sessionFor(priya, "org_acme");
    const empty = [] as const;
    const first = attempt(empty, admin, "invite_member", "org_acme");
    const second = attempt(first.log, admin, "read_members", "org_globex");

    expect(empty).toHaveLength(0);
    expect(first.log).toHaveLength(1);
    expect(second.log.map((e) => e.decision)).toEqual(["allow", "deny"]);
    expect(second.log[1]).toMatchObject({
      sub: priya.id,
      org_id: "org_acme",
      action: "read_members",
      resourceOrgId: "org_globex",
      reason: "cross_tenant",
    });
  });
});
