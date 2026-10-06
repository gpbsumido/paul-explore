import type { Connection, Organization, User } from "./types";

export const ORGANIZATIONS: readonly Organization[] = [
  { id: "org_acme", name: "Acme" },
  { id: "org_globex", name: "Globex" },
];

export const CONNECTIONS: readonly Connection[] = [
  { id: "con_acme_sso", name: "Acme SSO (SAML)", domains: ["acme.com"], orgId: "org_acme" },
  { id: "con_globex_okta", name: "Globex Okta (OIDC)", domains: ["globex.com"], orgId: "org_globex" },
  { id: "con_database", name: "Username-Password-Authentication", domains: [], orgId: null },
];

export const USERS: readonly User[] = [
  {
    id: "auth0|priya",
    email: "priya@acme.com",
    memberships: { org_acme: ["admin"], org_globex: ["member"] },
  },
  { id: "auth0|sam", email: "sam@acme.com", memberships: { org_acme: ["member"] } },
  { id: "auth0|bo", email: "bo@globex.com", memberships: { org_globex: ["billing"] } },
];
