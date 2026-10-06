export type Role = "admin" | "member" | "billing";

export type Action =
  | "read_members"
  | "invite_member"
  | "manage_connection"
  | "read_billing";

export type Connection = {
  readonly id: string;
  readonly name: string;
  readonly domains: readonly string[];
  /** Null for the shared database connection, which belongs to no org. */
  readonly orgId: string | null;
};

export type Organization = { readonly id: string; readonly name: string };

export type User = {
  readonly id: string;
  readonly email: string;
  /** Roles per org id. A role only means something inside its own org. */
  readonly memberships: Readonly<Record<string, readonly Role[]>>;
};

/** The claims a login mints. `org_id` mirrors Auth0's claim of the same name. */
export type Session = {
  readonly sub: string;
  readonly email: string;
  readonly org_id: string | null;
  readonly roles: readonly Role[];
};

export type StartSessionResult =
  | { readonly ok: true; readonly session: Session }
  | { readonly ok: false; readonly reason: "not_a_member" };

export type DenyReason =
  | "missing_permission"
  | "cross_tenant"
  | "no_org_in_session";

export type Decision =
  | { readonly decision: "allow"; readonly reason: "granted" }
  | { readonly decision: "deny"; readonly reason: DenyReason };

export type AuditEntry = {
  readonly sub: string;
  readonly org_id: string | null;
  readonly action: Action;
  readonly resourceOrgId: string;
  readonly decision: Decision["decision"];
  readonly reason: Decision["reason"];
};
