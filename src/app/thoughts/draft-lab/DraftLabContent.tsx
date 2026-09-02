import Image from "next/image";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  Update,
  UpdateTimeline,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import { Sent, Received, Timestamp } from "@/lib/threads";
import styles from "@/app/thoughts/_shared/chat.module.css";
import OwnerToggle from "./OwnerToggle";

/** A real screenshot of the extension with a one-line caption. */
function Shot({
  src,
  alt,
  caption,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}) {
  return (
    <figure className="my-6">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        className="w-full rounded-xl border border-border"
      />
      <figcaption className="mt-2 text-center text-xs text-muted">
        {caption}
      </figcaption>
    </figure>
  );
}

/**
 * The Elite-tier write-up. Rendered on the server only when the viewer is the
 * owner (see page.tsx), so it never ships to anyone else — the public sections
 * above cover the free and pro tiers only.
 */
function EliteSections() {
  return (
    <>
      <UpdateTimeline
        entries={[
          {
            id: "elite-mockosheet",
            date: "Aug 31, 2026",
            title: "A second opinion on ADP, and why I can't tell you it's better",
          },
          {
            id: "elite-proj-adjust",
            date: "Aug 31, 2026",
            title: "A manual thumb on the scale, without lying about the number",
          },
          {
            id: "elite-tiers-fallers",
            date: "Aug 30, 2026",
            title: "Finer tiers, and flagging the players who slid",
          },
          {
            id: "elite-playbook",
            date: "Aug 30, 2026",
            title: "When the playbook argued with the model, the playbook was wrong",
          },
          {
            id: "elite-sleeper",
            date: "Aug 30, 2026",
            title: "Better projections, and a room that drafts worse than you",
          },
          {
            id: "elite-adjustments",
            date: "Aug 28, 2026",
            title: "Injuries and news, approved by hand and applied to values",
          },
          {
            id: "elite-engine",
            date: "Aug 27, 2026",
            title: "The recommendation engine, tuned against simulation",
          },
          {
            id: "elite-season-sos",
            date: "Aug 27, 2026",
            title: "Past the draft: strength of schedule, season and playoff model",
          },
          {
            id: "elite-multisport",
            date: "Aug 27, 2026",
            title: "One engine, three sports",
          },
        ]}
      />

      <section>
        <h2 className="mb-3 text-lg font-bold">The tiers (why this is gated)</h2>
        <p className="text-muted">
          Draft Lab is a tiered product. Free and Pro — the public write-up
          above — get custom league scoring, practice drafts, the live companion
          overlay, editable tiers, and recommendations ordered by consensus ADP.
          Elite is the model: recommendations by marginal starting-lineup value,
          My-Rankings blend, personal position caps, full-draft simulation with
          graded rosters, saved snapshots, strength of schedule, the whole
          season and playoff projection, multi-sport, the sourced-injury
          adjustment layer, and the Sleeper projection source. One constant in{" "}
          <code>js/tier.js</code> selects the build; everything gated is removed
          from the DOM entirely for lower tiers, never disabled or blurred — so a
          Free build can&apos;t even see what it&apos;s missing. The line held
          on one honesty rule: lower tiers get <i>fewer features</i>, never{" "}
          <i>worse advice</i> dressed up as the real thing.
        </p>
      </section>

      <Update
        id="elite-mockosheet"
        date="August 31, 2026"
        title="A second opinion on ADP, and why I can't tell you it's better"
      >
        <p>
          ESPN&apos;s ADP is the standing complaint, and Sleeper already gives me
          a stronger board, but the community&apos;s data-driven sheets are their
          own kind of signal. So Elite gains MockoSheet as an optional source: a
          button pulls the public sheet and its ADP overrides mine, while its VAL
          score tilts the recommendation list. One line I held: MockoSheet is a
          ranking-and-value sheet, <i>not</i> point projections, so it never
          touches the projected points the lineup math and schedule model run on
          — it moves ADP and nudges the order, nothing more. Parsing it was the
          unglamorous half: it&apos;s a formatted draft board, not a table, with
          position blocks stacked both across the page and down each column
          (quarterbacks, then tight ends, then defenses beneath them), each with
          its own column order. Reading every field by its header name rather
          than a fixed offset is what survives that — and the next version&apos;s
          reshuffle.
        </p>
        <p>
          The part I want to be honest about is whether it actually helps, because
          I don&apos;t think that&apos;s answerable yet. I benchmarked it the only
          way I could — 400 simulated drafts, my roster with the sheet versus
          without — and scored each one <i>two</i> ways: on my own projections and
          on MockoSheet&apos;s value. With the sheet I gained +138 on my yardstick
          and lost 52 on theirs. That symmetry is the whole point: each yardstick
          flatters the source it came from, so neither is proof. A preseason
          &quot;this projection set is better&quot; has no ground truth until the
          games are played; anyone who tells you otherwise is grading the exam
          they wrote. What I <i>can</i> say is that it isn&apos;t a regression and
          it isn&apos;t noise — its value order agrees with mine at a Spearman
          0.85 while disagreeing sharply on specific names (much higher on Tyler
          Shough and Chris Olave, much lower on Alvin Kamara and George Kittle).
          So it ships as a source you turn on to get a credible second opinion and
          compare live, not as a silent replacement claiming to know more than it
          can.
        </p>
      </Update>

      <Update
        id="elite-proj-adjust"
        date="August 31, 2026"
        title="A manual thumb on the scale, without lying about the number"
      >
        <p>
          The projection is a starting point, not gospel — some nights I just
          know a number is wrong: a beat writer&apos;s note the feed hasn&apos;t
          priced, a coach I trust to feed one back. So the Tiers tab now takes a
          manual per-player adjustment: a flat <code>+5</code> or{" "}
          <code>−3</code> on a player&apos;s projected points, typed right next
          to them.
        </p>
        <p>
          The design rule was the same honesty line the whole product runs on:
          don&apos;t overwrite the projection, and don&apos;t hide that a thumb
          is on the scale. The base number stays exactly as the model computed
          it and stays visible; the adjustment shows as its own value in colour;
          the effective total the tweak produces is what actually feeds the
          engine. So the cell reads <code>337 → 342</code>, not a silent 342 I&apos;d
          later mistake for a real projection. It stacks on top of the
          sourced-injury multipliers rather than fighting them — that layer is
          researched and approved; this one is my own call, kept separate on
          purpose.
        </p>
        <p>
          It isn&apos;t cosmetic. The adjustment lands in the one place every
          downstream number reads from — the scored pool — so a bumped player
          re-sorts, can jump a tier, and shifts every recommendation and survival
          figure that leans on it, the instant I type it. It persists across
          practice drafts like the tier overrides do, and it&apos;s Elite: the
          same gate as the model recommendations it steers, removed from the DOM
          entirely for lower tiers.
        </p>
      </Update>

      <Update
        id="elite-tiers-fallers"
        date="August 30, 2026"
        title="Finer tiers, and flagging the players who slid"
      >
        <p>
          Tiers were assigned by a single rule: walk each position top-down and
          start a new tier wherever the projected-points drop from one player to
          the next clears a per-position threshold. That works where the
          position has real cliffs — running back and tight end break cleanly —
          but it falls apart on the smooth ones. Superflex quarterback and the
          receiver pool are near-continuous: no single drop clears the bar, so
          twenty-one QBs collapsed into one &quot;Tier 2&quot; and fifty
          receivers into one &quot;Tier 3.&quot; A tier that holds a third of
          the pool tells you nothing at the board.
        </p>
        <p>
          The fix keeps the cliff logic and adds a size cap per position. Any
          tier that comes out larger than the cap gets subdivided into roughly
          equal bands, but each new boundary is snapped to the largest
          points-drop within a window around the even split — so the bands stay
          the same size while still landing on whatever local cliff is nearest.
          I tried the obvious thing first, recursively cutting at the single
          largest gap, and it degenerated: on a perfectly smooth run it peels one
          player off at a time and produces a string of singletons. Even bands
          snapped to cliffs was the version that read well on both a smooth pool
          and a cliffy one. Only Elite gets the finer split; the coarse absolute
          threshold is what lower tiers see.
        </p>
        <p>
          The second piece answers a question I kept asking out loud on draft
          night: who&apos;s fallen? Every available player has a consensus ADP,
          and the live draft has an overall pick number, so the slip is just{" "}
          <code>currentPick − ADP</code>. When a player is three or more picks
          late they get a badge — <code>▼N pk</code>, or <code>▼N rd</code> once
          they&apos;re two full rounds past where they should have gone — on the
          pool table, on the recommendation rows, and on the live companion
          overlay that paints ESPN&apos;s own draft screen. It&apos;s the cue to
          take the value that fell to me instead of the name I had queued, and
          it&apos;s gated to Elite alongside the model recommendations it rides
          next to.
        </p>
        <p>
          A cleanup pass followed, the kind that pays for itself later. The
          tier-size caps had been hardcoded with football positions in the shared
          engine, which meant the finer split silently did nothing for the
          basketball profiles — so the caps moved into the per-sport config next
          to the gap thresholds they belong with, and now every sport gets the
          same treatment. The faller badge had been copy-pasted between the board
          and the ESPN overlay; two copies of the same arithmetic drift apart the
          first time only one gets fixed, so it&apos;s one shared function now.
          Neither changes what you see today; both stop a bug I&apos;d otherwise
          ship in a month.
        </p>
      </Update>

      <Update
        id="elite-engine"
        date="August 27, 2026"
        title="The recommendation engine, tuned against simulation"
      >
        <p>
          The Elite recommendation isn&apos;t ADP — it&apos;s marginal
          starting-lineup value plus urgency:{" "}
          <code>marginalLineupValue + w × urgency</code>, where marginal value
          greedily fills the real slot structure (QB/2RB/2WR/TE/FLEX/OP/D-ST/K)
          with and without the candidate, and urgency is the drop-off to the
          best same-position player likely to survive to my next pick — survival
          being a product of per-team softmax pick probabilities over each
          intervening opponent&apos;s needs and personality. Tier cliffs (my
          overrides included) amplify urgency; my personal caps hard-filter
          positions I refuse to draft more of; my tier board mixes in at 25%.
        </p>
        <p>
          The grades feature indicted the whole thing first. A full simulation
          gave my team the league&apos;s highest TOTAL points and its tenth-best
          STARTING lineup — the fingerprint of drafting by raw value: bench
          depth at stacked positions instead of startable slots. Moving from
          value-over-replacement to marginal-lineup scoring fixed it. Then the
          weight <code>w</code> got tuned the honest way: a committed benchmark (
          <code>bench/draft-bench.mjs</code>) runs full 12-team drafts where my
          picks come from the engine and opponents use varied AI tendencies, and
          grades every roster on a fixed, independent yardstick. Sweeping the
          knobs, <code>w = 1.5</code> was a clear, robust win — mean finish
          2.01&nbsp;→&nbsp;1.83, top-3 86%&nbsp;→&nbsp;90%, wins 53%&nbsp;→&nbsp;56%
          over a thousand rooms, holding across four independent seed sets.
          Exact-lineup, tier-cliff and tier-mix variations were all
          neutral-or-worse and not taken — the negative results matter as much
          as the win.
        </p>
        <p>
          The same harness answered a question no draft tool I know of touches:
          which two players should I keep? Feeding in last year&apos;s real draft
          history (keeper cost = round drafted) and my end-of-season roster, it
          simulated all 55 viable keeper pairs, 30 drafts each, against opponents
          keeping their own best values. The first run confidently told me to
          swap a keeper for a receiver my projections priced as top-2 — he&apos;d
          finished WR21. Re-priced at 75% current projection / 25% last-year
          finish, the answer inverted; with live projections in the blend my
          existing pair ranked first outright. The oldest lesson in modelling:
          the optimizer is only as good as its prices, and a confident ranking
          off one projection source is a bug that looks like a feature.
        </p>
      </Update>

      <Update
        id="elite-adjustments"
        date="August 28, 2026"
        title="Injuries and news, approved by hand and applied to values"
      >
        <p>
          Projections don&apos;t know what a knee looks like. So Elite gets a
          sourced-adjustment layer that lives in my own backend (a new
          <code> /api/fantasy/adjustments</code> resource in portfolio_api,
          backed by a Postgres table with a shared-secret write guard). A daily
          research pass turns injury, depth-chart and coaching news into a batch
          of adjustments — each a player, a delta percent, a source URL, a
          confidence — including the ripple effects a raw injury feed misses: the
          RB2 rises when the RB1 is ruled out, other receivers rise when a WR is
          lost for the year. Everything lands as <i>pending</i>.
        </p>
        <p>
          Nothing auto-applies. An Elite-only card in the extension pulls the
          pending list, and I approve or reject each row myself — approval is the
          one thing the daily job never does. An approved row multiplies that
          player&apos;s projection across recommendations, tiers, SOS and the
          season model. The interesting bug surfaced in the dedup key: keyed on
          (player, category, batch_date), a daily refresh re-reporting the same
          injury added a row per day, so a player piled up duplicates. Narrowing
          the key to (player, category) — verified against a real Postgres,
          including that an approved status survives a refresh — made a refresh
          update the one row in place instead. The whole path is a strict
          separation: the model researches and proposes; the human decides.
        </p>
      </Update>

      <Update
        id="elite-playbook"
        date="August 30, 2026"
        title="When the playbook argued with the model, the playbook was wrong"
      >
        <p>
          Draft night surfaced a contradiction the tiers had quietly created.
          The Strategy playbook was written from ~2,500 generic sims and carried
          hard rules — &quot;QBs going early is the biggest trap, don&apos;t
          reach&quot;, &quot;never leave round 6 without two WRs.&quot; But this
          is a superflex OP league, and in Sleeper dual-board mode the
          recommendation engine correctly values QBs as premium and knows the
          ESPN-anchored room under-drafts them — so it was recommending exactly
          the QBs the playbook told me to avoid. The overlay was telling me two
          opposite things at once.
        </p>
        <p>
          The model wins that argument; it&apos;s league-specific and the
          playbook was generic, so the playbook is what changed. The QB advice
          is now superflex-aware — in an OP league it reads &quot;the top QB rec
          is the value, not a reach&quot; instead of the 1-QB trap warning — and
          the positional-need lines (thin at WR) were rewritten to defer to the
          recommendations rather than override them: flag the standing need, but
          never tell me to pass a higher-value pick the model is surfacing. The
          rule I&apos;m keeping: when a heuristic and the model disagree, the UI
          should never show both as commands. Reconcile, or the advice is noise.
        </p>
      </Update>
      <Update
        id="elite-sleeper"
        date="August 30, 2026"
        title="Better projections, and a room that drafts worse than you"
      >
        <p>
          ESPN&apos;s projections are the community&apos;s standing complaint, so
          Elite gains a second source: Sleeper&apos;s free API returns
          stat-level seasonal projections for the skill positions — re-scored
          under my league&apos;s rules exactly like the ESPN path — plus a
          superflex-aware ADP, which is the right board for my OP slot in a way
          ESPN&apos;s 1-QB ADP simply is not. Sleeper&apos;s kicker and D/ST
          projections lack the granularity my distance-tiered kicking and
          points-allowed brackets need, so those stay on the ESPN/bundled values:
          Sleeper where it&apos;s better, ESPN where it still wins.
        </p>
        <p>
          The sharper idea is the dual board. In a practice sim my picks come off
          Sleeper; the AI opponents draft off ESPN&apos;s board — the way a real
          ESPN room actually does — and the survival model predicts them off that
          same ESPN board, so &quot;back next turn?&quot; matches how they pick,
          not how I value players. That models the real edge: I&apos;m drafting
          off better numbers than a room anchored to ESPN. Measured on real
          Sleeper + ESPN data across 250 drafts, graded on a neutral blend of the
          two boards (so the verdict isn&apos;t rigged toward the board I
          optimized for), it roughly doubled the win rate — 17%&nbsp;→&nbsp;36%,
          top-3 56%&nbsp;→&nbsp;65%. Honestly stated on the Strategy tab: on
          ESPN&apos;s own board the dual team grades poorly, so the edge only
          holds if Sleeper is at least as accurate as ESPN. It&apos;s an
          advantage, not a cheat.
        </p>
        <p>
          The mechanism is a structural ADP divergence I could quantify: because
          ESPN prices QBs as if it were a 1-QB league, the room under-drafts
          quarterbacks — the mid-tier starters land 40 to 87 spots later on ESPN
          than on Sleeper — and, as a direct consequence, over-drafts RB/WR/TE by
          40-plus spots. So the strategy the app now surfaces writes itself: let
          the QBs slide to you, and fade the skill players ESPN reaches for. The
          grades table shows every roster on both boards side by side, so the gap
          is visible, not asserted.
        </p>
      </Update>

      <Update
        id="elite-season-sos"
        date="August 27, 2026"
        title="Past the draft: strength of schedule, season and playoff model"
      >
        <p>
          Two players project the same points, but one runs his fantasy-playoff
          gauntlet through three bottom-five defenses and the other through three
          top-five ones. Elite puts that on the board: sortable SOS and Playoff
          SOS columns as percentages around neutral, recommendations that flag
          the extremes in plain language, and per-week matchup scaling in the
          season model. The defensive-strength data (the endpoint behind
          ESPN&apos;s own Opp Rank) is auth-gated and empty pre-season, so last
          season&apos;s finals are the draft-time basis, and the multipliers are
          clamped hard (±10% aggregate, ±20% per week) — SOS is a tiebreaker with
          its uncertainty priced in, since defenses turn over year to year and
          the research says it deserves no more.
        </p>
        <p>
          Then the season tab takes the drafted roster through ESPN&apos;s real
          schedule: actual scores once a week is played, projections until then,
          each lineup rebuilt per week so byes sit players (a replacement-level
          waiver pickup streams into unfillable slots). The first version
          projected my team undefeated — deterministic &quot;higher projection
          wins&quot; makes the best roster 14-0 by construction — so it&apos;s now
          a logistic on the margin calibrated to real weekly variance, with a
          test that forbids a dominant roster from ever projecting perfect. A
          decomposition splits a record into schedule strength and bye timing; an
          800-run Monte Carlo plays the league&apos;s real playoff bracket; and a
          retrospective mode grades the projection against last season&apos;s
          actual outcomes (favorite accuracy, Brier score, points error) with the
          circularity caveat printed on it.
        </p>
      </Update>

      <Update
        id="elite-multisport"
        date="August 27, 2026"
        title="One engine, three sports"
      >
        <p>
          The question was whether the engine was general or just
          football-shaped. General, once every football constant became a lookup:
          a sport profile carries feed coordinates, positions, lineup slots,
          scoring, tier gaps and caps, and the engine swaps profiles in place —
          all the NFL tests pass byte-identical while the same marginal-lineup
          math drafts NBA and WNBA. FLEX and OP generalized into G/F/UTIL
          eligibility with zero new engine code. The feeds took one hunt (NBA at
          game code <code>fba</code>, WNBA behind a different league-defaults id),
          and verification caught a bug where the injury-blend rule guessed each
          sport&apos;s final scoring period and flagged all 290 NBA players as
          season-ending injuries; the final period is now derived from the data.
        </p>
      </Update>
    </>
  );
}

export default function DraftLabContent({
  isOwner = false,
}: {
  isOwner?: boolean;
}) {
  return (
    <ThoughtLayout
      breadcrumb="Draft Lab"
      title="Draft Lab"
      intro={
        <>
          A Firefox extension that rides along inside the ESPN fantasy draft
          room: it watches picks happen, tracks keepers, knows my league&apos;s
          exact scoring, and answers the three questions that matter on the
          clock — who to take, what survives to my next pick, and where the tier
          cliff is. Lives in its own repo, not this one.
        </>
      }
      chat={
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <div className={styles.chat}>
            <Timestamp>Draft prep season</Timestamp>

            <Received pos="first">what is draft lab</Received>
            <Received pos="last">another fantasy thing?</Received>

            <Sent pos="first">
              a browser extension for my ESPN draft — practice mode and a live
              companion
            </Sent>
            <Sent pos="middle">
              it overlays a panel right in the draft room: who&apos;s on the
              clock, the last six picks, how many players are left in each tier
              by position, and who I should take next
            </Sent>
            <Sent pos="last">
              all scored under my league&apos;s actual rules — full PPR, an OP
              slot, the weird D/ST points-allowed brackets, everything
            </Sent>

            <Received>why an extension and not just a website</Received>

            <Sent pos="first">
              because the whole point is riding along with the real draft
            </Sent>
            <Sent pos="last">
              a content script can read the draft room as it happens — picks,
              the clock banner, my roster — and feed a recommendation engine
              without me typing anything
            </Sent>

            <Received>what&apos;s it built with</Received>

            <Sent pos="first">
              deliberately boring: plain JavaScript ES modules, no framework, no
              build step
            </Sent>
            <Sent pos="middle">
              Manifest V3, a shadow-DOM overlay so ESPN&apos;s CSS can&apos;t
              touch it, extension storage for state, and node&apos;s built-in
              test runner for the engine
            </Sent>
            <Sent pos="last">
              the draft engine is pure functions — snake order, roster legality,
              scoring, tier math — so all of it is testable without a browser
            </Sent>

            <Received pos="first">okay but scraping ESPN</Received>
            <Received pos="last">that must have gone wrong constantly</Received>

            <Sent pos="first">it went wrong in every way I could invent</Sent>
            <Sent pos="middle">
              the best one: my regexes never matched because ESPN&apos;s markup
              has no whitespace between cells. textContent glues a row into
              &quot;3James Cook IIIBUFRBQUEUE&quot; — innerText is what respects
              rendered boundaries. one word swapped, everything matched
            </Sent>
            <Sent pos="last">
              the pick list is also virtualized, so rows scroll out of the DOM
              before you can read them. I stopped trusting structure entirely and
              now run anchored patterns over the page&apos;s rendered text
            </Sent>

            <Received>biggest architecture mistake?</Received>

            <Sent pos="first">
              putting the brains in a separate board tab and having the overlay
              just mirror it
            </Sent>
            <Sent pos="last">
              close that tab and the panel confidently shows stale advice — it
              once recommended a player I had literally just drafted. the fix
              moved the whole engine into the content script, so the draft room
              is self-sufficient
            </Sent>
          </div>
        </main>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-31-pick-review",
            date: "Aug 31, 2026",
            title: "Grading each pick against the board as it actually was",
          },
          {
            id: "update-2026-08-31-portability",
            date: "Aug 31, 2026",
            title: "Take your setup with you: settings CSV and result files",
          },
          {
            id: "update-2026-08-30-adaptive-tendencies",
            date: "Aug 30, 2026",
            title: "I tried to auto-learn the room, and the simulator said don't",
          },
          {
            id: "update-2026-08-30-draft-night",
            date: "Aug 30, 2026",
            title: "Draft-night hardening: full pick sync and confirmed keepers",
          },
          {
            id: "update-2026-08-26-live-fire",
            date: "Aug 26, 2026",
            title: "A day of live-fire mocks: tiers, rankings, and two id bugs",
          },
        ]}
      />

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Why you&apos;d want this on draft night
        </h2>
        <p className="text-muted">
          Every draft tool I tried lives in another tab showing someone
          else&apos;s rankings under someone else&apos;s scoring. Draft Lab is
          the opposite: it knows <i>this league</i> — full PPR, the OP superflex
          slot, distance-tiered kicking, the D/ST points-allowed brackets — and
          it sits inside the actual ESPN draft room, reading picks as they
          happen. While everyone else eyeballs an ADP cheat sheet, it answers the
          only three questions that matter on the clock: who should I take, what
          will still be here next turn, and where is the cliff.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
          <li>A live companion overlay in the ESPN draft room: who&apos;s on the clock, the last six picks, and recommendations, without typing anything.</li>
          <li>A survival probability on every suggestion, simulated against the real rosters and drafting personalities picking between you and your next turn.</li>
          <li>Tier supply at a glance, keeper-aware from pick one, editable per player and persistent across every practice draft.</li>
          <li>Every value computed under your league&apos;s exact scoring — the same stat line is worth different points under different rules.</li>
        </ul>
        <Shot
          src="/thoughts-draft-lab/draft.png"
          alt="Draft Lab board mid-draft: snake grid with locked keepers, pick log, tier outlook and a QB-run alert"
          caption="Round 1, pick 11 of a practice draft: keepers locked at their slots (including one scheduled seven rounds out), a QB run flagged, and a TE tier on last call."
          width={1600}
          height={1066}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Setting it up</h2>
        <p className="text-muted">
          It&apos;s a Firefox extension — it uses Firefox&apos;s extension APIs,
          so it won&apos;t load in Chrome. Once you have the zip:
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted">
          <li>Unzip it into a folder.</li>
          <li>
            Open <code>about:debugging#/runtime/this-firefox</code> in Firefox.
          </li>
          <li>Click <b>Load Temporary Add-on…</b> and pick the <code>manifest.json</code> inside the folder.</li>
          <li>The Draft Lab icon appears in the toolbar — click it to open the board.</li>
        </ol>
        <p className="text-muted mt-3">
          In Setup, enter your <b>League ID</b> (the <code>leagueId=…</code> in
          your ESPN league URL) or just open your league&apos;s ESPN page once so
          it&apos;s picked up — then your real team names load automatically. Set
          keepers, per-team tendencies, and confirm the roster/scoring match your
          league. Practice against the AI, or run Companion mode inside your live
          ESPN draft room.
        </p>
        <p className="text-muted mt-3">
          One caveat of an unsigned add-on: a <b>temporary</b> install unloads when
          Firefox restarts — reload it the same way. For a permanent install, use
          Firefox Developer Edition, set <code>xpinstall.signatures.required</code>
          to <code>false</code> in <code>about:config</code>, then install the zip
          from <code>about:addons → Install Add-on From File</code>.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">How it works, end to end</h2>
        <p className="text-muted">
          Three layers, deliberately separated. At the bottom is a pure draft
          engine — snake order, keeper slotting, roster legality, scoring, tier
          math — plain functions over plain data, no DOM, no storage, fully
          unit-testable. Above it, extension storage acts as the message bus: the
          content script in the draft room and the board tab both read and write
          one shared record, so neither depends on the other being open. At the
          top are two thin render surfaces — a shadow-DOM overlay injected into
          ESPN (so their CSS can&apos;t touch it and vice versa) and a full-page
          board.
        </p>
        <p className="text-muted mt-3">
          The scoring pipeline starts from raw stat projections, not points:
          fetch a projection feed (ESPN, or import a CSV), then apply this
          league&apos;s rules locally. That ordering matters — the same stat line
          is worth different points under different rules, and it means a new
          data source re-scores automatically. Tiers come from projection-gap
          breaks, override any player&apos;s by hand, and the overrides persist
          across every practice draft.
        </p>
        <Shot
          src="/thoughts-draft-lab/tiers.png"
          alt="Tier editor grouping players by projection gaps with per-player override dropdowns"
          caption="Tiers are auto-derived from projection-gap breaks, editable per player, and persistent across every practice draft."
          width={1600}
          height={1066}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The stack, on purpose</h2>
        <p className="text-muted">
          Vanilla ES modules loaded straight from the extension directory: no
          bundler, no framework, no dependencies at all. An extension I reload
          twenty times during a draft is the wrong place for a build step. The
          split that matters is engine versus surface — snake order, keeper
          slotting, positional maximums, tier and survival math are pure
          functions in one module, exercised by <code>node --test</code> cases
          including a full 180-pick simulated draft and a legality stress run.
          The UI just renders what the engine says.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Scraping a page that fights back
        </h2>
        <p className="text-muted">
          Every assumption about ESPN&apos;s draft room broke at least once. The
          pick sidebar virtualizes, so history disappears from the DOM. Row text
          has no whitespace between cells unless you read <code>innerText</code>{" "}
          instead of <code>textContent</code>. The Players table changes its
          button text depending on whose turn it is. The approach that survived:
          treat the rendered text as the interface, anchor patterns on stable
          tokens (the on-the-clock banner, the QUEUE/DRAFT buttons, the
          &quot;R1, P1&quot; pick format), and cross-check against ESPN&apos;s
          unofficial league API where cookies allow. Every scraper failure taught
          the same lesson — make the failure visible. The overlay grew a version
          badge, a detection log, and a debug line showing candidate-row counts,
          because &quot;it&apos;s not working&quot; with a screenshot of
          self-reported diagnostics is a one-round fix instead of four.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What the tests caught</h2>
        <p className="text-muted">
          The unit tests pin the league scoring line by line, but the bugs that
          mattered came from one integration test that plays an entire draft:
          keepers being draftable by other teams before their slot resolved, and
          AI rosters finishing without a kicker because the ADP window never
          surfaced one. Neither shows up in any single-function test — they only
          exist across 180 sequential decisions. That test earned its keep more
          than the rest combined.
        </p>
      </section>

      <Update
        id="update-2026-08-30-draft-night"
        date="August 30, 2026"
        title="Draft-night hardening: full pick sync and confirmed keepers"
      >
        <p>
          The first real draft found the two places the companion could lie. It
          only ever read the ESPN <b>Board</b> tab, which is a virtualized grid —
          it only keeps the rounds near your scroll position in the DOM — so
          late-round picks that had scrolled off were never synced, and the
          overlay flashed &quot;12 picks missing&quot; that flipping tabs
          couldn&apos;t fix. It now also polls ESPN&apos;s league draft API,
          which returns every pick regardless of what&apos;s on screen. The
          catch: the API gives numeric player ids, so it harvests id→name off
          the team rosters and feeds each pick through the same name-match path
          the scraper uses — which means it backfills into any pool, not just an
          ESPN one. The DOM scraping stays as the fallback; the API is the
          authoritative fill.
        </p>
        <p>
          The subtler lie was keepers. You pre-configure keepers — yours, and
          your best guess for every other team from last year&apos;s recap — and
          the overlay had been reserving all of them and counting them toward
          rosters whether or not the league actually set them. Now a configured
          keeper only counts when ESPN confirms it: the sync rebuilds the keeper
          reservations from the ones ESPN flags as genuinely kept, so a keeper
          the room didn&apos;t set stops reserving a player, stops filling a
          position in the recommendations, and returns to the pool. It falls
          back to trusting the config only when ESPN exposes no keeper flags at
          all, so a real keeper whose late slot the draft hasn&apos;t reached is
          never wrongly dropped.
        </p>
      </Update>
      <Update
        id="update-2026-08-26-live-fire"
        date="August 26, 2026"
        title="A day of live-fire mocks: tiers, rankings, and two id bugs"
      >
        <p>
          Running the extension against back-to-back practice drafts grew it
          fast. The overlay now carries a tier system — players auto-tiered from
          projection gaps over the full pool so tier identity survives the draft,
          editable per player from a Tiers tab (overrides persist across drafts),
          rendered as a ruled grid of left/total per position with my own fill
          against the roster caps. A tier outlook replaced the useless
          &quot;most teams still need an RB&quot; trend with expected survivors
          per tier by my next pick.
        </p>
        <p>
          The bugs were better than the features. ESPN&apos;s Players list and
          Pick History rows collapse to nearly identical text, so the pick parser
          ingested ranking rows as picks — rank numbers became pick numbers and
          the QUEUE button text overwrote real team names. The guard is
          embarrassingly simple: a &quot;team&quot; called QUEUE is a button, not
          a franchise. Separately, keepers stopped being respected after
          switching projection sources, because keeper assignments stored player
          ids and every source uses a different id scheme — the reservation
          pointed at nobody, so the AI happily drafted a keeper three rounds
          early. Keepers now carry names and re-resolve against whatever pool is
          loaded.
        </p>
        <p>
          One honest limit surfaced too: an auto-keeper mode that makes League
          Manager picks in ESPN&apos;s own UI works when it gets the clock, but
          it cannot stop ESPN&apos;s autopick from sniping a keeper-designated
          player early — the reservation only exists in the extension. The
          reliable lock is ESPN&apos;s native Keepers tab; the overlay now says
          so, loudly, when a keeper gets taken before their slot.
        </p>
      </Update>

      <Update
        id="update-2026-08-30-adaptive-tendencies"
        date="August 30, 2026"
        title="I tried to auto-learn the room, and the simulator said don't"
      >
        <p>
          Every survival number — &quot;72% he&apos;s still here next turn&quot;
          — rests on a guess about how each opponent drafts, and right now that
          guess is a label you pick once at setup: Balanced, Zero-RB, reaches for
          QBs. Companion mode watches the whole room draft for real, so the
          obvious idea is to stop trusting the label and start trusting the
          picks: infer each team&apos;s lean from what they&apos;ve actually
          taken, and feed that back into the odds. I built it — position lean
          versus the room, how tightly their picks tracked ADP, blended with the
          label by how many picks I&apos;d seen.
        </p>
        <p>
          Then I made it prove itself before it shipped, and it couldn&apos;t.
          The test measures the thing the feature actually changes — the survival
          numbers — not whether my auto-pick finished higher. Across 3,000
          simulated drafts I scored each prediction three ways on the identical
          board: the static label, my inferred profile, and an oracle that gets
          told each opponent&apos;s true setting. Lower Brier score is
          better-calibrated:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`3,000 drafts · 922,656 predictions
static (fixed label)   Brier 0.1928   ← the bar
adaptive (inferred)    Brier 0.1941   +0.65%  worse
oracle (true settings) Brier 0.1895   -1.72%  better`}
        </pre>
        <p>
          Two things in that table killed the feature. My inference lands{" "}
          <i>worse</i> than doing nothing — a lean read off a handful of early
          picks is mostly noise, and the noise costs more than the signal is
          worth. And the oracle, with perfect knowledge, only buys 1.7%: even
          knowing every opponent&apos;s true style barely moves the odds, because
          ADP and roster need already explain most of who survives. A tiny
          ceiling with a noisy estimator underneath is a bad trade, so it&apos;s
          shelved — the extension keeps the static label. I&apos;d rather ship the
          negative result than a feature that quietly makes the numbers you trust
          a little worse. The prototype and its benchmark live in the repo as the
          record of why.
        </p>
      </Update>

      <Update
        id="update-2026-08-31-pick-review"
        date="August 31, 2026"
        title="Grading each pick against the board as it actually was"
      >
        <p>
          When a draft finishes, every one of your picks now gets a grade — and
          the grade isn&apos;t &quot;did this player score well,&quot; which you
          can&apos;t know in August. It&apos;s &quot;of everyone still on the
          board when you were on the clock, how close was this to the best move
          for your lineup.&quot; A pick is measured by how much it added to the
          startable lineup you could field at that moment, so a third quarterback
          scores near zero even if he projects well, and the receiver who filled
          a real hole grades out. The column next to each pick names the best
          alternative you passed, and the hover lists the others at that
          position. It&apos;s all tiers — the review reads a finished draft, it
          doesn&apos;t need the live model.
        </p>
        <p>
          The whole thing lives or dies on two words: <i>available then</i>. The
          first cut got this subtly wrong — the alternatives hover reused the
          board&apos;s &quot;other options at this position&quot; popup, which
          answers who&apos;s left <i>now</i>. So a first-round pick&apos;s hover
          suggested the dregs — the quarterbacks nobody wanted — when the players
          who mattered, the ones actually on the board in round one, had all been
          drafted by the time you looked. The fix reconstructs the pool pick by
          pick: walk the draft in order, and at each of your selections the
          available set is everyone not yet taken and not a keeper — keepers were
          never draftable, so they can&apos;t be the answer either. Grade and
          alternatives both read from that point-in-time board. A review that
          judges you against players who weren&apos;t available is worse than no
          review, because it sounds authoritative while being wrong.
        </p>
      </Update>

      <Update
        id="update-2026-08-31-portability"
        date="August 31, 2026"
        title="Take your setup with you: settings CSV and result files"
      >
        <p>
          The extension keeps everything in the browser&apos;s own storage, which
          is fast and private right up until the moment it isn&apos;t there — a
          reload, a reinstall, a second machine, and the league you spent twenty
          minutes configuring is gone. I learned that the unglamorous way. So two
          small round-trips now cover it, and neither touches a server.
        </p>
        <p>
          <b>Settings CSV</b>, for everyone: one button in Setup writes your
          league — team names, keepers, per-manager tendencies, position caps —
          to a plain CSV, and another reads it back. It&apos;s config only, not
          the projection pool, so the file stays small and human-readable, and it
          restores in one click after a reset or onto a laptop that&apos;s never
          seen the extension. The importer refuses a file from the wrong sport
          rather than quietly loading a 12-team football setup over a basketball
          league.
        </p>
        <p>
          <b>Result files</b>, for the free and pro tiers: when a draft finishes
          you can download the whole thing as JSON — every pick, who took it, the
          final projected-lineup standings — and load it back to review later or
          hand to a leaguemate. Each pick carries whether it was yours or the
          simulator&apos;s, so an imported result reads honestly: &quot;fully
          simulated&quot; versus &quot;nine of your own picks, finished second.&quot;
          It&apos;s the same shape the tool records internally, just written to a
          file you own instead of a database you don&apos;t.
        </p>
      </Update>

      {isOwner && (
        <OwnerToggle>
          <EliteSections />
        </OwnerToggle>
      )}

      <WhatsNext
        nowShipped={[
          "A Firefox MV3 extension in its own repo: practice drafts against configurable AI opponents, a live companion overlay in the ESPN draft room, keeper reservation, editable tiers with a supply grid, and recommendations with survival odds — all under my league's exact scoring.",
        ]}
        couldImprove={[
          "The scrapers are still pattern-matching an unversioned page; ESPN can break them silently on any deploy. The diagnostics make breakage visible, not impossible.",
          "Auto-keeper cannot beat ESPN’s autopick to a sniped player; the native Keepers tab is the real lock and the extension can only warn.",
          "Temporary add-on installs unload on every Firefox restart; it should get signed for a permanent install before next season.",
        ]}
        upcoming={[
          "The real test is draft night — the API path and the pick detection both get their first honest run there.",
        ]}
      />
    </ThoughtLayout>
  );
}
