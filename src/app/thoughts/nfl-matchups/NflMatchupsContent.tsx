import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import styles from "@/app/thoughts/_shared/chat.module.css";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

export default function NflMatchupsContent() {
  return (
    <ThoughtLayout
      breadcrumb="NFL Fantasy Matchups"
      title="NFL Fantasy Matchups"
      intro={
        <>
          Head-to-head matchups for my ESPN fantasy football league: team
          scores, each starter&apos;s actual and projected points, and a win
          probability that ESPN&apos;s API doesn&apos;t give you — so I built
          one.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 2:00 PM</Timestamp>

          <Received pos="first">isn&apos;t this just the NBA matchups page again</Received>
          <Received pos="last">why does it need its own build</Received>

          <Sent pos="first">
            same shape — team scores, a card per matchup, a win bar — but the
            data underneath is a different game entirely. NBA fantasy here is
            category scoring: seven stats, most-categories-won wins the week
          </Sent>
          <Sent pos="last">
            NFL is points. One number per team, and the roster is what feeds
            it — 16 starters each carrying a stat line, way more surface area
            per matchup than seven category totals
          </Sent>

          <Received>how do you even get the NFL data</Received>

          <Sent pos="first">
            same ESPN endpoint family as the NBA feature, different view.
            <code className="rounded bg-surface/60 px-1 py-0.5 text-[12px] font-mono">
              view=mMatchup&amp;view=mRoster&amp;scoringPeriodId=N
            </code>{" "}
            — NFL weeks are ESPN&apos;s scoring periods, so you have to pass
            one explicitly
          </Sent>
          <Sent pos="last">
            leave scoringPeriodId off entirely and ESPN just returns whatever
            the current week is. That turned out to matter more than I
            expected
          </Sent>

          <Timestamp>2:06 PM</Timestamp>

          <Received>why would that matter</Received>

          <Sent pos="first">
            first pass, I estimated the current NFL week from the calendar
            date client-side — kickoff plus however many 7-day blocks had
            passed — then corrected it once the real payload came back,
            inside a useEffect that called setWeek
          </Sent>
          <Sent pos="middle">
            ESLint killed it immediately.{" "}
            <code className="rounded bg-surface/60 px-1 py-0.5 text-[12px] font-mono">
              react-hooks/set-state-in-effect
            </code>
            . And it deserved to die — a date guess is a worse source of
            truth than the payload that&apos;s already telling you the
            answer
          </Sent>
          <Sent pos="last">
            deleted the guess. week is either the user&apos;s explicit pick
            or null, and null means &quot;ask ESPN for the current period and
            read the answer off status.currentMatchupPeriod.&quot; No effect,
            no cascading render, one source of truth
          </Sent>

          <Timestamp>2:11 PM</Timestamp>

          <Received>ESPN doesn&apos;t have a win probability for fantasy?</Received>

          <Sent pos="first">
            no field for it anywhere in the payload. Makes sense — it&apos;s
            a betting-market concept ESPN has no reason to compute for a
            private league&apos;s box score
          </Sent>
          <Sent pos="middle">
            I already had the sibling for this: the ZeroProof board converts
            an American betting price to a probability with{" "}
            <code className="rounded bg-surface/60 px-1 py-0.5 text-[12px] font-mono">
              impliedProbability
            </code>
            . No price exists for a fantasy matchup, so I built the fantasy
            equivalent — project each side&apos;s final score, run the margin
            through a normal model
          </Sent>
          <Sent pos="last">
            the part that made it feel honest rather than decorative: the
            spread widens with how many points are still unplayed. Monday
            night, half the league hasn&apos;t kicked off, the probability
            sits close to a coin flip even with a 20-point lead. By Sunday
            night with everyone&apos;s starters done, the same margin reads
            as near-certain
          </Sent>

          <Timestamp>2:15 PM</Timestamp>

          <Received>how did you test a probability model with no ground truth to check against</Received>

          <Sent pos="first">
            invariants, not exact numbers. Equal projections have to land at
            50/50. A finished matchup with any lead has to read near-certain.
            Swapping home and away has to complement — if home reads 62%,
            away in the same spot reads 38%
          </Sent>
          <Sent pos="last">
            and the one that actually caught the design intent: two matchups
            with the identical 15-point projected margin, one early in the
            week with 110 points still unplayed and one late with 5, have to
            produce different probabilities. That test is what proves the
            model treats a lead differently depending on how much game is
            left, which was the entire point of building it
          </Sent>

          <Timestamp>2:19 PM</Timestamp>

          <Received>what got left out of this PR</Received>

          <Sent pos="first">
            the plays ticker — a live feed of the actual plays contributing
            to each score. That&apos;s a different API entirely:
            site.api.espn.com&apos;s public game summaries, not the fantasy
            league endpoint, and it only means anything while games are
            actually being played
          </Sent>
          <Sent pos="last">
            stitching a scoring play back to a specific rostered player and
            translating it into a fantasy-point delta is real work on its
            own, and it&apos;s the kind of thing you want to build and verify
            separately rather than bolt onto a PR that&apos;s otherwise
            done. Stacked as a follow-up
          </Sent>

          <div className={styles.typingDots}>
            <span />
            <span />
          </div>
        </ChatThread>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-09-22-plays-ticker",
            date: "Sept 22, 2026",
            title: "The plays ticker this page said was deferred",
          },
        ]}
      />

      <section>
        <h2 className="mb-3 text-lg font-bold">Points, not categories</h2>
        <p className="text-muted">
          The NBA matchups page compares seven stat categories per team and
          counts who won more of them. NFL fantasy is a single number: total
          points scored by the active roster for the week. That collapses the
          team-level comparison to one bar, but it pushes all the interesting
          detail down to the player level — sixteen starters per side, each
          with an actual score and a projection, rather than seven category
          totals.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Weeks are scoring periods</h2>
        <p className="text-muted">
          ESPN&apos;s fantasy football endpoint takes{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            scoringPeriodId
          </code>{" "}
          as the week number, and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            rosterForCurrentScoringPeriod
          </code>{" "}
          only carries stats for whatever period you asked for. Omit the
          param entirely and ESPN defaults to the league&apos;s current week —
          which turned out to be the better design than guessing at it
          client-side.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Deleting a date guess for a payload read
        </h2>
        <p className="text-muted">
          My first pass estimated the live NFL week from the calendar date,
          then self-corrected once the real scoreboard loaded — a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useEffect
          </code>{" "}
          that called{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            setWeek
          </code>{" "}
          when the guess and the server disagreed.{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            react-hooks/set-state-in-effect
          </code>{" "}
          flagged it, and the fix was better than a workaround: the API
          already tells you the current week when you don&apos;t ask for a
          specific one, so there was never a reason to guess. The selected
          week is now either the visitor&apos;s explicit choice or{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            null
          </code>
          , and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            null
          </code>{" "}
          means read the answer off the payload&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            status.currentMatchupPeriod
          </code>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Win probability ESPN doesn&apos;t provide
        </h2>
        <p className="text-muted">
          There&apos;s no fantasy win-probability field anywhere in the
          payload. The closest thing already in the codebase is{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            impliedProbability
          </code>{" "}
          on the ZeroProof betting board, which turns an American price into a
          0–1 probability. A fantasy matchup has no price, so I built the
          equivalent from what a matchup does have: each side&apos;s current
          score plus what its unfinished starters are still projected to add.
          The margin between those two projected finals feeds a normal-CDF
          approximation whose spread widens with how many points are still
          unplayed — a lead means less on Monday morning than it does once
          Sunday&apos;s games are done.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Testing a model with no ground truth</h2>
        <p className="text-muted">
          There&apos;s no dataset of &quot;this matchup was actually a 62%
          favorite&quot; to check the model against, so the tests pin
          invariants instead of exact numbers: equal projections split 50/50,
          a settled matchup with any lead reads near-certain, and swapping
          home and away complements the result. The test that actually
          verifies the design intent compares two matchups with the identical
          projected margin — one with most of the week&apos;s points still
          unplayed, one with almost none — and asserts the early one sits
          closer to a coin flip. That&apos;s the property the whole model
          exists to have.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Deferred: the plays ticker</h2>
        <p className="text-muted">
          A live ticker of the plays contributing to each score was out of
          scope for this PR. It needed a second, unrelated ESPN surface — the
          public game-summary API rather than the fantasy league endpoint —
          and it&apos;s only meaningful while games are live, which makes it
          harder to verify than everything else here. Shipping the scores and
          win probability first, and building the ticker as its own stacked
          PR, kept this one small enough to actually finish. It shipped
          shortly after — see the update below.
        </p>
      </section>

      <Update
        id="update-2026-09-22-plays-ticker"
        date="Sept 22, 2026"
        title="The plays ticker this page said was deferred"
      >
        <p>
          Shipped as a stacked follow-up, and it landed simpler than the plan
          for it described.
        </p>
        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          I planned a fantasy-point delta per play. I built a name tag instead.
        </h3>
        <p className="text-muted">
          The original plan for this ticker said each play would carry the
          fantasy points it contributed — &quot;+6.4 pts&quot; next to the
          play text. Once I actually looked at what ESPN&apos;s public
          game-summary API returns, that number doesn&apos;t exist anywhere
          upstream. Computing it would mean re-implementing my league&apos;s
          entire scoring-rule table (points per passing yard, per rushing
          touchdown, per reception, and so on) against each play&apos;s raw
          stat line — a second scoring engine, running client-side, that
          could silently drift from the number ESPN&apos;s own fantasy API
          already reports. That&apos;s a worse trade than just not having
          the number.
        </p>
        <p className="mt-3 text-muted">
          What shipped instead: the real play text ESPN already writes —{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            &quot;Dyami Brown 9 Yd pass from Trevor Lawrence (Cam Little
            Kick)&quot;
          </code>{" "}
          — tagged with whichever fantasy team rosters the player it
          mentions. Attribution is a plain substring match against each
          starter&apos;s exact name, not a player-id join, because the
          play-by-play text carries names, not ids. It&apos;s honest about
          what it is: the actual event, not a derived number I&apos;d have
          to keep in sync with ESPN&apos;s.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`Q1 10:51  TD  Dyami Brown 9 Yd pass from Trevor Lawrence (Cam Little Kick)
                Paul's Perfect Team`}
        </pre>
        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          One team&apos;s own numbering, reused for free
        </h3>
        <p className="text-muted">
          The scoring-play feed lives on a completely different ESPN host (
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            site.api.espn.com
          </code>
          ) from the fantasy league endpoint, and it identifies teams by
          abbreviation, not the fantasy payload&apos;s numeric{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            proTeamId
          </code>
          . I expected to need a lookup table hand-built from a reference
          site. Instead the public site API&apos;s own team-list endpoint
          uses the identical numbering — id 4 is CIN on both surfaces,
          confirmed against a real rostered Bengals player — so the map is
          just those 32 pairs, not a scraped or guessed table.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "Weekly matchups for my ESPN fantasy football league: team totals, and every starter's actual vs. projected points for the week.",
          "A win-probability bar derived from projected final scores, with a spread that narrows as a week's games finish rather than reading a mid-week blowout as a certainty.",
          "The week selector reads ESPN's own current-period default instead of guessing from the calendar date, which is also what got the page past a set-state-in-effect lint failure.",
          "A live scoring-plays ticker: real ESPN play text tagged with the fantasy team it belongs to, stacked on this PR once the core matchups page shipped.",
        ]}
        couldImprove={[
          "The win-probability model is a hand-picked spread function, not fit to any real outcome data — it's directionally right, not calibrated.",
          "Bench players parse and store correctly but the card doesn't surface them; only starters render.",
          "The ticker attributes a play by matching a rostered starter's exact name as a substring, so a short-form or nickname mismatch would miss a mention.",
        ]}
        upcoming={[
          "A playoff-week ticker (the plays feed is regular-season only right now — seasontype=2 — since the league's schedule already bounds most use to it).",
        ]}
      />
    </ThoughtLayout>
  );
}
