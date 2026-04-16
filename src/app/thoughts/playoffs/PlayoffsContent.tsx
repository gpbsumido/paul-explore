"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function PlayoffsContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "NBA Playoffs Bracket" },
        ]}
        right={<ViewToggle view={view} setView={setView} />}
        showLogout={false}
        maxWidth="max-w-3xl"
      />

      {view === "summary" ? (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50">
              Dev notes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              NBA Playoffs Bracket
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              An interactive bracket picker with debounced saves, TBD team
              resolution, a public leaderboard, and responsive layout — built
              test-first with Vitest, Testing Library, and MSW.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">Data flow</h2>
              <p className="text-muted">
                The bracket data comes from ESPN via a BFF proxy route. Picks
                are stored per-user in the portfolio API and fetched
                server-side. Both queries run in parallel on mount — bracket
                structure and saved picks land independently so neither blocks
                the other.
              </p>
              <p className="mt-3 text-muted">
                User edits are tracked in a separate{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  userEdits
                </code>{" "}
                state object. A{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useMemo
                </code>{" "}
                merges server picks with local edits:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  {"{ ...(serverPicks ?? {}), ...userEdits }"}
                </code>
                . When picks load from the server, they slot in as the base.
                Every user click layers on top. No effect needed.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Derived state instead of effects
              </h2>
              <p className="text-muted">
                The first version initialized picks state from the server
                response inside a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useEffect
                </code>
                . ESLint flagged it immediately:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  react-hooks/set-state-in-effect
                </code>
                . Calling{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  setState
                </code>{" "}
                synchronously inside an effect triggers a second render
                immediately, which can cascade.
              </p>
              <p className="mt-3 text-muted">
                The fix was to stop treating the server data as something to
                copy into state. It already lives in the TanStack Query cache —
                a stable reference that updates when the fetch completes.
                Merging it with local edits in a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useMemo
                </code>{" "}
                means the component always sees the latest combined view with no
                extra renders and no lint rule violations.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">TBD team resolution</h2>
              <p className="text-muted">
                Later-round matchups start with teams listed as TBD — the winner
                of an earlier series. The bracket needs to show the actual team
                abbreviation in those slots rather than a blank or
                &quot;TBD&quot; label, but only if the user has already picked a
                winner for that preceding series.
              </p>
              <p className="mt-3 text-muted">
                A static{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  PRECEDING
                </code>{" "}
                map encodes which earlier matchup feeds each TBD slot. A{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  resolveTeam
                </code>{" "}
                function looks up the appropriate entry in the map, reads the
                user&apos;s pick for that matchup, and returns the winner
                abbreviation or{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  &quot;?&quot;
                </code>{" "}
                if no pick exists yet. Buttons for unresolved TBD slots are
                disabled so you can&apos;t pick a winner before picking their
                opponent.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Debounced saves</h2>
              <p className="text-muted">
                Every time the merged picks object changes, a debounced effect
                fires a PUT to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/nba/playoffs/picks
                </code>{" "}
                after 800ms of quiet. A ref (
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  userHasPickedRef
                </code>
                ) starts false and flips on first user interaction — the save
                effect bails early until that flag is set, so loading server
                data on mount never triggers a spurious write back to the
                backend.
              </p>
              <p className="mt-3 text-muted">
                A{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  SaveIndicator
                </code>{" "}
                component reads a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  saveState
                </code>{" "}
                enum to show &quot;Saving...&quot; or &quot;Saved&quot; — the
                kind of quiet acknowledgment that lets you keep clicking without
                wondering whether your picks are persisting.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Responsive layout</h2>
              <p className="text-muted">
                The bracket is a three-column grid: East rounds on the left,
                Finals in the center, West rounds on the right. At large
                breakpoints, the two conference sides sit at opposite ends of
                the viewport with the Finals column bridging them. On mobile,
                each conference section is an independently scrollable row with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  overflow-x-auto
                </code>{" "}
                and negative horizontal margin bleed so the scroll area extends
                edge-to-edge.
              </p>
              <p className="mt-3 text-muted">
                The West side uses{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  lg:flex-row-reverse
                </code>{" "}
                to mirror its column order — R1, R2, WCF reads left-to-right on
                mobile for natural scrolling, but at{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  lg:
                </code>{" "}
                it flips so WCF is visually closest to the Finals column in the
                center.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Finals card extra fields
              </h2>
              <p className="text-muted">
                The Finals card adds two extra inputs: a number field for the
                combined score of the last game (the tiebreaker for equal
                bracket scores) and a text field for the Finals MVP. Both use
                local state initialized from the pick prop rather than
                controlled inputs tied to the parent&apos;s state, for the same
                reason as the series score selector — the mock in tests
                doesn&apos;t update the prop on change, so accumulating multiple
                keystrokes requires local state that React re-renders with each
                character.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Leaderboard</h2>
              <p className="text-muted">
                A public leaderboard sits below the bracket. It proxies to the
                portfolio API which scores all submitted picks against actual
                results and returns ranked entries with a per-round breakdown.
                The current user&apos;s row highlights in orange — the component
                receives{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  currentUserSub
                </code>{" "}
                from the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/me
                </code>{" "}
                query and matches it against{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  entry.sub
                </code>
                . Unauthenticated visitors see the full leaderboard, just
                without any row highlighted.
              </p>
              <p className="mt-3 text-muted">
                The leaderboard response is cached at{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  s-maxage=300
                </code>{" "}
                — fresh enough to reflect new results within a few minutes,
                stale enough to avoid hammering the backend during busy playoff
                windows.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Testing approach</h2>
              <p className="text-muted">
                Each component has its own test file:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  SeriesPickCard
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  FinalsCard
                </code>
                , and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  PlayoffLeaderboard
                </code>
                . Tests render the component, fire user events, and assert on
                DOM state — no internal implementation details.
              </p>
              <p className="mt-3 text-muted">
                The leaderboard tests use MSW to intercept{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  GET /api/nba/playoffs/leaderboard
                </code>{" "}
                in three scenarios: loading (infinite delay proves the skeleton
                renders), success (five entries, current user highlight, round
                badges), and error (error message renders). The wrapper factory
                creates a fresh{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  QueryClient
                </code>{" "}
                per test with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  retry: false
                </code>{" "}
                so errors surface immediately without TanStack&apos;s default
                three retries.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Submit vs. auto-save</h2>
              <p className="text-muted">
                The initial build had a single debounced PUT that fired
                automatically as you picked. That works, but it creates an
                ambiguous UX: users don&apos;t know whether their picks are
                &quot;tentative&quot; or &quot;submitted.&quot; An explicit
                submit button makes the contract clear and mirrors how most
                bracket contests work — you fill it out, then commit.
              </p>
              <p className="mt-3 text-muted">
                Auto-save is kept as an opt-in checkbox (default off). The two
                modes are mutually exclusive: when auto-save is on, the Submit
                button is disabled. This avoids double-writing and removes the
                ambiguity of having both active at once. On a successful
                explicit submit, the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  saveStatus
                </code>{" "}
                is cleared to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  idle
                </code>{" "}
                so any lingering &quot;Saving...&quot; from a pending debounce
                doesn&apos;t persist after the request settles.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Leaderboard before results
              </h2>
              <p className="text-muted">
                The first version showed a placeholder message until at least
                one official result existed. The problem: the leaderboard is
                part of the social contract of a bracket contest. People want to
                see who else has submitted even before the first series
                concludes — it confirms participation and creates anticipation.
              </p>
              <p className="mt-3 text-muted">
                The backend was changed to always fetch submitted brackets,
                scoring them as 0 when no results exist yet. Ties at 0 are
                broken by submission date ascending — earlier submissions rank
                higher, which is a mild incentive to lock in picks before the
                first game tips off. The BFF adds a transformation layer since
                the portfolio API field names (
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  userSub
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  maxPossible
                </code>
                , flat{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  breakdown
                </code>
                ) differ from the frontend types (
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  sub
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  maxScore
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  roundBreakdown
                </code>{" "}
                array).
              </p>
            </section>
          </div>
        </main>
      ) : (
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 11:00 AM</Timestamp>

              <Received pos="first">what is the playoffs bracket page</Received>
              <Received pos="last">like what does it actually do</Received>

              <Sent pos="first">
                you pick the winner of every playoff series before the season
                starts. winner, series length, how many games. the Finals card
                adds a combined score for the last game and an MVP pick
              </Sent>
              <Sent pos="last">
                your picks get saved automatically and a leaderboard shows how
                everyone scored once results come in
              </Sent>

              <Received>where does the bracket data come from</Received>

              <Sent pos="first">
                ESPN has a public endpoint for the playoff bracket. a BFF proxy
                route fetches it and normalizes the structure into typed
                matchups with seeds, abbreviations, and conference
              </Sent>
              <Sent pos="last">
                picks live in the portfolio API per user. both queries run in
                parallel on mount — bracket structure and your saved picks
                don&apos;t wait on each other
              </Sent>

              <Timestamp>11:04 AM</Timestamp>

              <Received>
                how do you merge server picks with local edits
              </Received>

              <Sent pos="first">
                separate state objects. server picks come from the TanStack
                Query cache. local edits are their own state that starts empty
              </Sent>
              <Sent pos="middle">
                a useMemo merges them:{" "}
                <code className="rounded bg-surface/60 px-1 py-0.5 text-[12px] font-mono">
                  {"{ ...(serverPicks ?? {}), ...userEdits }"}
                </code>{" "}
                — server data is the base, every click layers on top
              </Sent>
              <Sent pos="last">
                when the server picks land the memo recomputes automatically. no
                effect needed, no second render from calling setState in an
                effect
              </Sent>

              <Timestamp>11:08 AM</Timestamp>

              <Received pos="first">
                why not just initialize picks state from the server response in
                a useEffect
              </Received>
              <Received pos="last">that seems simpler</Received>

              <Sent pos="first">
                ESLint flags it. react-hooks/set-state-in-effect catches any
                setState call that runs synchronously inside an effect body — it
                can trigger cascading renders
              </Sent>
              <Sent pos="middle">
                more importantly it&apos;s the wrong model. the server data
                isn&apos;t something you copy once — it updates whenever the
                query refreshes. copying it to state creates a stale fork
              </Sent>
              <Sent pos="last">
                the useMemo pattern means the component always sees the latest
                server data merged with the latest user edits. one source of
                truth each, combined at read time
              </Sent>

              <Timestamp>11:13 AM</Timestamp>

              <Received>what are TBD teams</Received>

              <Sent pos="first">
                later rounds have teams listed as TBD — the winner of an earlier
                series that hasn&apos;t been decided yet
              </Sent>
              <Sent pos="middle">
                a PRECEDING map encodes which earlier matchup feeds each TBD
                slot. resolveTeam looks up the right entry, reads the
                user&apos;s pick for that matchup, and returns the winner
                abbreviation
              </Sent>
              <Sent pos="last">
                if you haven&apos;t picked that earlier series yet it shows
                &quot;?&quot; and the button is disabled. you can&apos;t pick a
                winner before you&apos;ve picked who they&apos;re playing
                against
              </Sent>

              <Timestamp>11:17 AM</Timestamp>

              <Received>how do saves work</Received>

              <Sent pos="first">
                debounced effect on the merged picks object. waits 800ms after
                the last change then fires a PUT. fast enough to feel
                responsive, slow enough to batch rapid clicks into one request
              </Sent>
              <Sent pos="middle">
                a ref starts false and flips on first user interaction. the save
                effect bails early until that flag is set — loading server picks
                on mount doesn&apos;t accidentally write them back to the
                backend
              </Sent>
              <Sent pos="last">
                a SaveIndicator shows &quot;Saving...&quot; during the request
                and &quot;Saved&quot; after it settles. quiet enough to ignore,
                visible enough to confirm your picks are persisting
              </Sent>

              <Timestamp>11:22 AM</Timestamp>

              <Received>how does the responsive layout work</Received>

              <Sent pos="first">
                three-column grid at lg: — East rounds, Finals, West rounds.
                below that, each conference is a horizontally scrollable row
                that bleeds edge-to-edge with negative margin
              </Sent>
              <Sent pos="middle">
                the West side uses lg:flex-row-reverse to mirror its column
                order. on mobile R1→R2→WCF reads left to right for natural
                scrolling. at lg: it flips so WCF is closest to the Finals
                column in the center
              </Sent>
              <Sent pos="last">
                the bracket feels like a real bracket on desktop. on mobile it
                scrolls like a card list, which is fine — picking a series
                doesn&apos;t require seeing the whole bracket at once
              </Sent>

              <Timestamp>11:27 AM</Timestamp>

              <Received>tell me about the leaderboard</Received>

              <Sent pos="first">
                public — no auth needed to view. the portfolio API scores all
                submitted picks against actual results and returns ranked
                entries with a per-round breakdown showing earned vs max points
                for each round
              </Sent>
              <Sent pos="middle">
                the component receives the current user&apos;s sub from /api/me
                and matches it against entry.sub to highlight your row in
                orange. if you&apos;re not logged in the leaderboard still
                renders, just with no highlight
              </Sent>
              <Sent pos="last">
                cached at s-maxage=300 on the BFF route. fresh enough to reflect
                new results within a few minutes, not so fresh that it hammers
                the backend during busy playoff nights
              </Sent>

              <Timestamp>11:31 AM</Timestamp>

              <Received>how were the components tested</Received>

              <Sent pos="first">
                SeriesPickCard, FinalsCard, and PlayoffLeaderboard each have a
                test file. render the component, fire user events, assert on DOM
                state — no implementation details
              </Sent>
              <Sent pos="middle">
                the leaderboard tests use MSW to intercept the leaderboard
                endpoint. loading test uses infinite delay to prove the skeleton
                renders. success test checks rank medals, score display, round
                badges, and the current user row highlight
              </Sent>
              <Sent pos="last">
                each test gets a fresh QueryClient with retry: false so errors
                surface immediately instead of TanStack retrying three times and
                making the test wait
              </Sent>

              <Timestamp>11:36 AM</Timestamp>

              <Received>why is there a submit button AND auto-save</Received>

              <Sent pos="first">
                the debounced auto-save is opt-in and off by default. submit is
                the primary way to commit your bracket — it matches how most
                pick contests work. you fill it out, then lock it in
              </Sent>
              <Sent pos="middle">
                the two modes are mutually exclusive. when auto-save is on,
                submit is disabled. no double-writing, no ambiguity about which
                one is in charge
              </Sent>
              <Sent pos="last">
                on a successful submit, any lingering &quot;Saving...&quot; from
                a pending debounce gets cleared immediately. the save indicator
                resets to idle so the UI doesn&apos;t show stale state after the
                request settles
              </Sent>

              <Timestamp>11:41 AM</Timestamp>

              <Received>
                why does the leaderboard show before any results are in
              </Received>

              <Sent pos="first">
                the leaderboard is part of the social contract. people want to
                see who else submitted even before game one tips off — it
                confirms participation and creates anticipation
              </Sent>
              <Sent pos="middle">
                0-score entries are shown and sorted by submission date
                ascending. earlier submissions rank higher, which is a mild
                incentive to lock in picks before the season starts
              </Sent>
              <Sent pos="last">
                the backend change was straightforward — remove the early return
                that checked for results and add updatedAt as a tiebreaker. the
                BFF needed a transform layer because the portfolio API field
                names don&apos;t match the frontend types
              </Sent>

              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
