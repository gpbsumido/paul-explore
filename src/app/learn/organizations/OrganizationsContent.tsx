"use client";

import { useState, type FormEvent } from "react";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/ui/Button";
import {
  ACTIONS,
  attempt,
  discoverConnection,
  startSession,
} from "@/lib/organizations/organizations";
import {
  CONNECTIONS,
  ORGANIZATIONS,
  USERS,
} from "@/lib/organizations/fixtures";
import type { AuditEntry, Connection, Session, User } from "@/lib/organizations/types";

const BREADCRUMBS = [
  { label: "Dashboard", href: "/" },
  { label: "Learn", href: "/learn" },
  { label: "Organizations" },
];

const orgName = (id: string | null) =>
  ORGANIZATIONS.find((o) => o.id === id)?.name ?? "no organization";

const field =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground";

/**
 * Models the Auth0 Organizations contract: discovery picks the connection, the
 * login mints a session scoped to one org, and every request is checked against
 * that org before the role is even looked at. Nothing here talks to Auth0.
 */
export default function OrganizationsContent() {
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<{ user: User | null; connection: Connection } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [resourceOrg, setResourceOrg] = useState("");
  const [log, setLog] = useState<readonly AuditEntry[]>([]);
  const [message, setMessage] = useState("");

  const handleFind = (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!address) return;
    const connection = discoverConnection(address, CONNECTIONS);
    const user = USERS.find((u) => u.email === address.toLowerCase()) ?? null;
    setFound({ user, connection });
    setMessage(
      connection.orgId
        ? `${address} routes to ${connection.name}, organization ${orgName(connection.orgId)}.`
        : `${address} has no organization, so it gets the shared database connection.`,
    );
  };

  const handleSignIn = (user: User, orgId: string | null) => {
    const result = startSession(user, orgId);
    if (!result.ok) {
      setMessage(`Sign-in refused: ${result.reason}.`);
      return;
    }
    setSession(result.session);
    setResourceOrg(orgId ?? ORGANIZATIONS[0].id);
    setLog([]);
    setMessage(`Signed in as ${user.email} with org_id ${orgId ?? "null"}.`);
  };

  const handleAction = (action: (typeof ACTIONS)[number]) => {
    if (!session) return;
    const result = attempt(log, session, action, resourceOrg);
    setLog(result.log);
    const verdict = result.decision.decision === "allow" ? "Allowed" : "Denied";
    setMessage(
      `${verdict} (${result.decision.reason}): ${action} on ${orgName(resourceOrg)}.`,
    );
  };

  const handleSignOut = () => {
    setSession(null);
    setFound(null);
    setLog([]);
    setMessage("Signed out.");
  };

  return (
    <>
      <PageHeader breadcrumbs={BREADCRUMBS} />

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <section className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-foreground-secondary text-lg leading-relaxed max-w-2xl">
            A B2B app has customers, and each customer has its own people,
            roles and sign-in method. This lab models that: an email routes to
            its organization, the login mints a session scoped to one org, and
            every request is checked against that org before the role is looked
            at. Try priya@acme.com (admin at Acme, member at Globex),
            sam@acme.com or bo@globex.com.
          </p>
        </section>

        <p
          role="status"
          className="min-h-[3rem] rounded-lg border border-border bg-surface-raised p-3 text-sm"
        >
          {message || "Enter an email to start."}
        </p>

        <section aria-labelledby="discover" className="space-y-3">
          <h2 id="discover" className="text-lg font-bold">
            1. Home realm discovery
          </h2>
          <form onSubmit={handleFind} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
                autoComplete="off"
              />
            </label>
            <Button type="submit" size="sm" disabled={session !== null}>
              Find my organization
            </Button>
          </form>

          {found && !session && (
            <div className="flex flex-wrap gap-2">
              {Object.keys(found.user?.memberships ?? {}).map((orgId) => (
                <Button
                  key={orgId}
                  size="sm"
                  variant="secondary"
                  onClick={() => found.user && handleSignIn(found.user, orgId)}
                >
                  Sign in to {orgName(orgId)}
                </Button>
              ))}
              {found.user && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => found.user && handleSignIn(found.user, null)}
                >
                  Sign in without an organization
                </Button>
              )}
              {!found.user && (
                <span className="text-sm text-foreground-secondary">
                  No account for that email in this demo.
                </span>
              )}
            </div>
          )}
        </section>

        {session && (
          <>
            <section aria-labelledby="token" className="space-y-3">
              <h2 id="token" className="text-lg font-bold">
                2. The org-scoped session
              </h2>
              <pre className="overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
                {JSON.stringify(session, null, 2)}
              </pre>
              <Button size="sm" variant="ghost" onClick={handleSignOut}>
                Sign out
              </Button>
            </section>

            <section aria-labelledby="requests" className="space-y-3">
              <h2 id="requests" className="text-lg font-bold">
                3. Make a request
              </h2>
              <fieldset className="flex flex-wrap gap-4">
                <legend className="mb-2 text-sm text-foreground-secondary">
                  Whose resource is it?
                </legend>
                {ORGANIZATIONS.map((org) => (
                  <label key={org.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="resource-org"
                      value={org.id}
                      checked={resourceOrg === org.id}
                      onChange={() => setResourceOrg(org.id)}
                    />
                    {org.name}
                  </label>
                ))}
              </fieldset>
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAction(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </section>

            <section aria-labelledby="audit" className="space-y-3">
              <h2 id="audit" className="text-lg font-bold">
                4. Audit log
              </h2>
              <div className="overflow-x-auto">
                <table aria-label="Audit log" className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th scope="col" className="py-2 pr-4">Who</th>
                      <th scope="col" className="py-2 pr-4">Session org</th>
                      <th scope="col" className="py-2 pr-4">Action</th>
                      <th scope="col" className="py-2 pr-4">Resource org</th>
                      <th scope="col" className="py-2 pr-4">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-2 text-foreground-secondary">
                          Nothing yet.
                        </td>
                      </tr>
                    )}
                    {log.map((entry, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="py-2 pr-4">{entry.sub}</td>
                        <td className="py-2 pr-4">{orgName(entry.org_id)}</td>
                        <td className="py-2 pr-4 font-mono">{entry.action}</td>
                        <td className="py-2 pr-4">{orgName(entry.resourceOrgId)}</td>
                        <td className="py-2 pr-4">
                          {entry.decision} ({entry.reason})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
