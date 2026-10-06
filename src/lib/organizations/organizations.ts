import type {
  Action,
  AuditEntry,
  Connection,
  Decision,
  Role,
  Session,
  StartSessionResult,
  User,
} from "./types";

const PERMISSIONS: Readonly<Record<Role, readonly Action[]>> = {
  admin: ["read_members", "invite_member", "manage_connection", "read_billing"],
  member: ["read_members"],
  billing: ["read_members", "read_billing"],
};

/**
 * Picks the connection that owns an email's domain. The domain is compared
 * whole, so `acme.com.evil.io` doesn't ride on `acme.com`. Anything unmatched
 * gets the shared database connection, which carries no org.
 */
export function discoverConnection(
  email: string,
  connections: readonly Connection[],
): Connection {
  const domain = email.split("@").pop()?.toLowerCase() ?? "";
  return (
    connections.find((c) => c.domains.includes(domain)) ??
    connections.find((c) => c.orgId === null) ??
    connections[0]
  );
}

/** Mints the session for a login. Only the roles held in `orgId` come along. */
export function startSession(user: User, orgId: string | null): StartSessionResult {
  const base = { sub: user.id, email: user.email };
  if (orgId === null) {
    return { ok: true, session: { ...base, org_id: null, roles: [] } };
  }
  const roles = user.memberships[orgId];
  if (!roles) return { ok: false, reason: "not_a_member" };
  return { ok: true, session: { ...base, org_id: orgId, roles } };
}

/**
 * Decides one request. Order matters: the tenant check comes before the role
 * check, so being an admin in one org never opens another.
 */
export function authorize(
  session: Session,
  action: Action,
  resourceOrgId: string,
): Decision {
  if (session.org_id === null) return { decision: "deny", reason: "no_org_in_session" };
  if (session.org_id !== resourceOrgId) return { decision: "deny", reason: "cross_tenant" };
  const allowed = session.roles.some((role) => PERMISSIONS[role].includes(action));
  return allowed
    ? { decision: "allow", reason: "granted" }
    : { decision: "deny", reason: "missing_permission" };
}

/** Authorizes and returns the decision with a new log; the old log is untouched. */
export function attempt(
  log: readonly AuditEntry[],
  session: Session,
  action: Action,
  resourceOrgId: string,
): { decision: Decision; log: readonly AuditEntry[] } {
  const decision = authorize(session, action, resourceOrgId);
  const entry: AuditEntry = {
    sub: session.sub,
    org_id: session.org_id,
    action,
    resourceOrgId,
    decision: decision.decision,
    reason: decision.reason,
  };
  return { decision, log: [...log, entry] };
}

export const ACTIONS: readonly Action[] = [
  "read_members",
  "invite_member",
  "manage_connection",
  "read_billing",
];
