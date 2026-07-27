"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import type { ReactNode } from "react";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

/**
 * Inline code span styled to match the other thoughts pages.
 */
function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
      {children}
    </code>
  );
}

export default function FeatureFlagsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Feature Flags Service"
      title="Feature Flags Service"
      intro={
        <>
          The feature-flags console on this site used to persist nothing — every
          toggle lived in memory and reset on reload. This is the backend that
          gave it a real spine: a feature-flags service in{" "}
          <C>portfolio_api</C> with public reads, an Auth0-gated write path, an
          audit trail, and a cron that resets the demo to a known state every
          six hours. It mirrors the referrals module, so there was a proven
          shape to follow rather than a new one to invent.
        </>
      }
      chat={
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 2:04 PM</Timestamp>

              <Received pos="first">
                the flags console has no real backend right?
              </Received>
              <Received pos="last">toggles reset on reload</Received>

              <Sent pos="first">
                right, it&apos;s all in-memory. going to give it the same
                treatment as referrals: public reads, drizzle repo, knex
                migration
              </Sent>
              <Sent pos="last">
                one table per flag with the per-env config as jsonb, matching the
                console&apos;s Flag shape 1:1 so the api and the ui never drift
              </Sent>

              <Timestamp>2:07 PM</Timestamp>

              <Received>who can flip a flag</Received>

              <Sent pos="first">
                reads are public. the PATCH that toggles a kill switch or rollout
                for one environment needs a real Auth0 user via checkJwt, same
                gate as the nba picks writes
              </Sent>
              <Sent pos="last">
                every change writes an audit row attributed to the actual
                user&apos;s email and sub. signed out gets a 401, no ghost edits
              </Sent>

              <Timestamp>2:11 PM</Timestamp>

              <Received>it&apos;s a demo though, people will break it</Received>

              <Sent pos="first">
                that&apos;s the reset cron. every six hours it restores the
                canonical five flags and reseeds the audit log
              </Sent>
              <Sent pos="last">
                the migration and the reset share one seed module, so the
                &quot;correct&quot; state is defined once. no drift between how it
                starts and how it recovers
              </Sent>

              <Timestamp>2:14 PM</Timestamp>

              <Received>tests?</Received>

              <Sent pos="first">
                80 pass, 7 new for this module: list, audit, patch enabled, patch
                rollout, 404, 400 validation, 401 signed-out. tsc, biome, and the
                build are all clean
              </Sent>
              <Sent pos="last">
                couldn&apos;t run the migration unattended though — no db access.
                flagged it in the PR as the deploy step: run it, confirm the
                seeded five, set the railway cron
              </Sent>

              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">The starting point</h2>
        <p className="text-muted">
          paul-explore has an operator console for feature flags — kill switches
          and percentage rollouts, sliced per environment. It rendered and
          toggled fine, but nothing behind it was real. State lived in memory,
          so a reload wiped every change and two tabs never agreed. To make the
          console honest, the flags needed to live somewhere: a service that
          could read them, write them under auth, and remember who changed what.
        </p>
        <p className="mt-3 text-muted">
          The good news was that <C>portfolio_api</C> already had the exact shape
          this needed. The referrals module does public reads through a Drizzle
          repository over a Knex-migrated table. Rather than invent a pattern, I
          copied a proven one — the risk of a fresh design is that it drifts from
          the rest of the codebase, and this had a template sitting right there.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Schema and migration</h2>
        <p className="text-muted">
          Migration <C>012_feature_flags</C> creates two tables. The first,{" "}
          <C>feature_flags</C>, is one row per flag with its per-environment
          config stored as <C>JSONB</C>. The shape matches the console&apos;s{" "}
          <C>Flag</C> type 1:1 — same fields, same nesting — so a flag read from
          the API drops straight into the UI with no translation layer to keep in
          sync. Any mismatch there is a bug waiting to happen, and the cleanest
          way to avoid it is to not have two shapes at all.
        </p>
        <p className="mt-3 text-muted">
          The second, <C>feature_flag_audit</C>, records every change: a UUID
          primary key and a newest-first index so the audit view can page from
          the most recent edit without a sort scan. The migration seeds the
          canonical five flags plus a seed audit entry, so a fresh database comes
          up already populated rather than empty and confusing.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The module and its routes</h2>
        <p className="text-muted">
          The module lives in <C>src/modules/feature-flags/</C> and exposes three
          endpoints. <C>GET /api/feature-flags</C> returns{" "}
          <C>{"{ flags, environments }"}</C> and is public.{" "}
          <C>GET /api/feature-flags/audit</C> returns <C>{"{ audit }"}</C>, also
          public — the history is meant to be visible, that&apos;s half the point
          of an audit trail on a demo.
        </p>
        <p className="mt-3 text-muted">
          The write path is <C>PATCH /api/feature-flags/:flagKey</C>, which
          toggles the kill switch or rollout for a single environment. It
          requires a real Auth0 user via <C>checkJwt</C> — the same gate the NBA
          picks writes use — so there is one auth story across the API rather
          than a bespoke one here. Each change is attributed to the caller&apos;s
          actual email and sub in the audit row, and a signed-out request gets a{" "}
          <C>401</C> before anything is written. No anonymous edits, no
          made-up actor.
        </p>
        <p className="mt-3 text-muted">
          The Zod contract was ported verbatim from paul-explore. The API and the
          console validate against the same schema, so a change to the flag shape
          has to move both together or fail loudly — the two ends can&apos;t
          quietly drift apart.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The reset cron</h2>
        <p className="text-muted">
          A public demo is going to get poked at. Someone will flip every switch,
          crank a rollout to 100%, and leave it there. The <C>reset-feature-flags</C>{" "}
          cron restores the demo to its canonical seed every six hours — the five
          flags back to their defined state, the audit log back to its seed entry
          — so the console always presents a coherent starting point rather than
          whatever the last visitor left behind.
        </p>
        <p className="mt-3 text-muted">
          It&apos;s wired into <C>start.js</C> through{" "}
          <C>CRON_JOB=reset-feature-flags</C>, and the existing renewal cron keeps
          its own default so nothing else changed. The important detail: the
          migration and the reset share one seed module. The canonical state is
          defined in exactly one place, so how the demo first comes up and how it
          recovers can never disagree. If I&apos;d hand-written the seed twice,
          they would eventually drift; sharing the module makes that impossible by
          construction.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Verification and the deploy step</h2>
        <p className="text-muted">
          Eighty tests pass, seven of them new for this module: the list read,
          the audit read, a PATCH that enables a flag, a PATCH that sets a
          rollout, a 404 for an unknown flag, a 400 for a bad payload, and a 401
          for a signed-out write. <C>tsc --noEmit</C>, <C>biome lint</C>, and the{" "}
          <C>tsc</C> build all come back clean.
        </p>
        <p className="mt-3 text-muted">
          The one thing I couldn&apos;t do unattended was run{" "}
          <C>pnpm migrate</C> — there&apos;s no database access from here. That&apos;s
          called out in the PR as the deploy step: run the migration, confirm the
          five seeded flags landed, and set the Railway cron. The PR is a self-
          contained draft so that migration can happen before it&apos;s marked
          ready.
        </p>
      </section>
    </ThoughtLayout>
  );
}
