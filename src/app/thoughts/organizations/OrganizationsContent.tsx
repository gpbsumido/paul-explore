import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import styles from "@/app/thoughts/_shared/chat.module.css";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";
const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

export default function OrganizationsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Organizations"
      title="One customer must never see another"
      intro={
        <>
          I wanted a demo that says something true about B2B identity, not
          another login form. Auth0 Organizations exists because a SaaS app
          has customers, and each customer has its own people, roles and
          sign-in method. So I built a small lab that models the contract: an
          email routes to its customer&rsquo;s connection, the login mints a
          session scoped to one org, and every request is checked against that
          org before the role is looked at. It&rsquo;s a model, not a call to
          Auth0, and I say so on the page.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 2:40 PM</Timestamp>

          <Received pos="first">
            so what&apos;s the actual risk in a multi-tenant app
          </Received>
          <Received pos="last">auth works, everyone&apos;s logged in</Received>

          <Sent pos="first">
            an admin at one customer reading another customer&apos;s data
          </Sent>
          <Sent pos="last">
            and it&apos;s almost never a login bug. it&apos;s a missing check
            on a request that had a perfectly valid token
          </Sent>

          <Timestamp>2:46 PM</Timestamp>

          <Received>so where does the check go</Received>

          <Sent pos="first">
            first. before the role. the token says which org it was minted
            for, the resource says which org it belongs to, and if those
            differ nothing else matters
          </Sent>
          <Sent pos="last">
            an admin role is only an admin of the org it came from
          </Sent>

          <div className={styles.typingDots}>
            <span />
            <span />
            <span />
          </div>
        </ChatThread>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">What the lab does</h2>
        <p className="text-muted">
          At <code className={code}>/learn/organizations</code> you type an
          email. Home realm discovery matches its domain to a connection, so{" "}
          <code className={code}>priya@acme.com</code> lands on Acme&rsquo;s
          SAML connection and a gmail address falls back to the shared
          database connection, which belongs to no org. Signing in mints a
          session with an <code className={code}>org_id</code> and only the
          roles that user holds in that org. Then you fire requests at one org
          or the other and watch an audit log fill with allow and deny
          decisions and the reason for each.
        </p>
        <p className="mt-3 text-muted">
          The three pieces are pure functions in{" "}
          <code className={code}>src/lib/organizations/organizations.ts</code>:{" "}
          <code className={code}>discoverConnection</code>,{" "}
          <code className={code}>startSession</code> and{" "}
          <code className={code}>authorize</code>. No React, no clock, no
          network, which is why the 12 behavior tests run in a few
          milliseconds.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The order of the checks</h2>
        <p className="text-muted">
          <code className={code}>authorize</code> asks three questions in a
          fixed order: does the session have an org at all, is the resource in
          that org, and only then does the role grant the action. The order is
          the design. Put the role check first and a Globex member who happens
          to be an admin at Acme gets waved through on a Globex resource,
          because admin is a perfectly good role. Each failure also has its own
          reason, so the audit log says why rather than just no.
        </p>
        <pre className={pre}>{`cross-tenant: admin in Acme asking for a Globex resource
  -> deny (cross_tenant)
member asking to manage a connection in their own org
  -> deny (missing_permission)
database login, no org in the session
  -> deny (no_org_in_session)`}</pre>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Discovery matches the whole domain</h2>
        <p className="text-muted">
          The easy way to write home realm discovery is{" "}
          <code className={code}>endsWith(&quot;acme.com&quot;)</code>, and
          it&rsquo;s wrong: it would send{" "}
          <code className={code}>eve@acme.com.evil.io</code> to Acme&rsquo;s
          connection. I compare the domain after the last{" "}
          <code className={code}>@</code> as a whole, lower-cased, and there is
          a test for the lookalike so the shortcut can&rsquo;t creep back in.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The table underneath</h2>
        <p className="text-muted">
          The lab keeps its tenants in a fixture file, but the model is shaped
          by what I&rsquo;d want in PostgreSQL. The part worth stealing is
          that a membership&rsquo;s role lives on the row that ties a user to
          an org, and child tables carry the org id too, so the isolation rule
          is something the database can help enforce instead of something every
          query has to remember.
        </p>
        <pre className={pre}>{`create table memberships (
  org_id  uuid not null references organizations (id),
  user_id uuid not null references users (id),
  role    text not null check (role in ('admin','member','billing')),
  primary key (org_id, user_id)
);

-- every tenant-owned row repeats org_id, and the join must agree
create table invitations (
  org_id  uuid not null,
  email   text not null,
  invited_by uuid not null,
  foreign key (org_id, invited_by) references memberships (org_id, user_id)
);`}</pre>
        <p className="mt-3 text-muted">
          That schema is the shape I&rsquo;d put under the model, not something
          this page runs. The composite foreign key is the point: an invitation
          can&rsquo;t be created by someone who isn&rsquo;t a member of that
          same org, no matter what the application code does.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Accessibility</h2>
        <p className="text-muted">
          A decision that only changes a colour isn&rsquo;t a decision a screen
          reader user gets. There is one{" "}
          <code className={code}>role=&quot;status&quot;</code> region, and
          every discovery result and every allow or deny is written into it in
          words, with the reason. The resource picker is a fieldset of
          labelled radios, the audit log is a real table with column headers,
          and the decision column spells out allow or deny next to the reason.
          The tests find things by role and name, so the contract is checked,
          not assumed.
        </p>
      </section>

      <WhatsNext
        nowShipped={[
          "Home realm discovery by whole-domain match, with a database fallback that carries no org.",
          "Org-scoped sessions: org_id plus only that org's roles, and a refusal for orgs you don't belong to.",
          "authorize with the tenant check ahead of the role check, and an immutable audit log of every decision.",
        ]}
        couldImprove={[
          "Invitations and self-service connection setup, the management half of Organizations.",
          "A real tenant behind it, so the token comes from Auth0 and the lab validates the org_id claim on the way in.",
        ]}
        upcoming={[
          "Back the model with the Postgres schema above and test the isolation rule against a real database.",
        ]}
      />
    </ThoughtLayout>
  );
}
