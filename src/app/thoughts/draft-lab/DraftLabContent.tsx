import Image from "next/image";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  Update,
  UpdateTimeline,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import { Sent, Received, Timestamp } from "@/lib/threads";
import styles from "@/app/thoughts/_shared/chat.module.css";

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

export default function DraftLabContent() {
  return (
    <ThoughtLayout
      breadcrumb="Draft Lab"
      title="Draft Lab"
      intro={
        <>
          A Firefox extension that rides along inside the ESPN fantasy draft
          room: it watches picks happen, tracks keepers, knows my league&apos;s
          exact scoring, and answers the three questions that matter on the
          clock — who to take, what survives to my next pick, and where the
          tier cliff is. Benchmarked at top-3 finishes in 81 of 100 simulated
          drafts. Lives in its own repo, not this one.
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
              the draft engine is pure functions — snake order, roster
              legality, value-over-replacement, tier math — so all of it is
              testable without a browser
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
              before you can read them. I stopped trusting structure entirely
              and now run anchored patterns over the page&apos;s rendered text
            </Sent>

            <Received>any real logic bugs or just scraping pain</Received>

            <Sent pos="first">
              two good ones, both caught by a full-draft simulation test before
              any human hit them
            </Sent>
            <Sent pos="middle">
              keepers stayed in the general pool until their assigned pick, so
              another team could draft someone who was already spoken for — the
              same player went twice
            </Sent>
            <Sent pos="last">
              and the AI could strand a team with zero kickers, because its
              candidate window was top-of-ADP and late-round kickers never made
              the cut. the fix forces unfilled starter slots once roster space
              runs low
            </Sent>

            <Received>biggest architecture mistake?</Received>

            <Sent pos="first">
              putting the brains in a separate board tab and having the overlay
              just mirror it
            </Sent>
            <Sent pos="middle">
              close that tab, or leave it holding an old mock draft, and the
              panel confidently shows stale advice — it once recommended a
              player I had literally just drafted
            </Sent>
            <Sent pos="last">
              the fix was moving the whole engine into the content script via
              dynamic import, so the draft room page is self-sufficient and the
              board tab is optional
            </Sent>

            <Received>how do the recommendations actually work</Received>

            <Sent pos="first">
              value over replacement times roster need, blended 50/50 with my
              own rankings, which the extension harvests off the page when I
              sort ESPN&apos;s player list by &quot;My Rankings&quot;
            </Sent>
            <Sent pos="middle">
              each suggestion carries a survival probability — for every team
              picking before my next turn, a softmax over what they&apos;re
              likely to take given their roster and tendency, multiplied
              through
            </Sent>
            <Sent pos="last">
              tiers come from projection gaps and I can override any
              player&apos;s tier by hand; the overrides persist across every
              practice draft
            </Sent>
          </div>
        </main>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-27-season",
            date: "Aug 27, 2026",
            title: "The draft ends, the model keeps going: season and playoff projection",
          },
          {
            id: "update-2026-08-27-multi-sport",
            date: "Aug 27, 2026",
            title: "One engine, three sports: NBA and WNBA join",
          },
          {
            id: "update-2026-08-26-live-fire",
            date: "Aug 26, 2026",
            title: "A day of live-fire mocks: tiers, rankings, and two id bugs",
          },
        ]}
      />
      <section>
        <h2 className="mb-3 text-lg font-bold">Why you&apos;d want this on draft night</h2>
        <p className="text-muted">
          Every draft tool I tried lives in another tab showing someone
          else&apos;s rankings under someone else&apos;s scoring. Draft Lab is
          the opposite: it knows <i>this league</i> — full PPR, the OP
          superflex slot, distance-tiered kicking, the D/ST points-allowed
          brackets — and it sits inside the actual ESPN draft room, reading
          picks as they happen. While everyone else eyeballs an ADP cheat
          sheet, it answers the only three questions that matter on the clock:
          who should I take, what will still be here next turn, and where is
          the cliff.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
          <li>Live recommendations scored by what a player adds to the lineup you can actually field — not raw points, so it never tells you to hoard a third RB while your WR slots starve.</li>
          <li>A survival probability on every suggestion, simulated against the real rosters and drafting personalities picking between you and your next turn.</li>
          <li>Tier supply at a glance, keeper-aware from pick one, blended with your own ESPN rankings, and bounded by your personal rules (max 2 QB, 1 TE — yours to set).</li>
          <li>Benchmarked, not vibes: across 100 simulated drafts against varied opponents it finished top-3 in 81 and won 50 outright.</li>
        </ul>
        <Shot
          src="/thoughts-draft-lab/draft.png"
          alt="Draft Lab board mid-draft: snake grid with locked keepers, pick log, tier outlook and a QB-run alert"
          caption="Round 1, pick 11 of a practice draft: keepers locked at their slots (including one scheduled seven rounds out), a QB run flagged, and a TE tier on last call."
          width={1600}
          height={1066}
        />
        <Shot
          src="/thoughts-draft-lab/recs.png"
          alt="Recommendation table with projected points, value over replacement, survival odds and plain-language reasons"
          caption="On the clock: every suggestion carries its lineup impact, survival odds for your next turn, and a reason in plain language."
          width={1600}
          height={638}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">How it works, end to end</h2>
        <p className="text-muted">
          Three layers, deliberately separated. At the bottom is a pure draft
          engine — snake order, keeper slotting, roster legality, scoring,
          recommendations — plain functions over plain data, no DOM, no
          storage, fully unit-testable. Above it, extension storage acts as
          the message bus: the content script in the draft room and the board
          tab both read and write one shared record, so neither depends on the
          other being open. At the top are two thin render surfaces — a
          shadow-DOM overlay injected into ESPN (so their CSS can&apos;t touch
          it and vice versa) and a full-page board.
        </p>
        <p className="text-muted mt-3">
          The scoring pipeline starts from raw stat projections, not points:
          fetch ESPN&apos;s projection feed (or a CSV), then apply this
          league&apos;s rules locally. That ordering matters — the same stat
          line is worth different points under different rules, and it means a
          new data source re-scores automatically. Recommendations then score
          each candidate as <code>marginalLineupValue + 0.6 × urgency</code>,
          where marginal value comes from greedily filling the actual slot
          structure (QB/2RB/2WR/TE/FLEX/OP/D-ST/K) with and without the
          candidate, and urgency is the drop-off to the best same-position
          player likely to survive to your next pick — survival being a
          product of per-team softmax pick probabilities over each intervening
          opponent&apos;s needs and personality. Tier cliffs (your overrides
          included) amplify urgency; your personal caps hard-filter positions
          you refuse to draft more of.
        </p>
        <Shot
          src="/thoughts-draft-lab/setup.png"
          alt="Setup screen: league mode, position caps, per-team AI tendencies and keeper assignments with computed pick numbers"
          caption="Setup: personal position caps, a drafting personality per opponent, and keepers that show exactly which pick they resolve to — the display that caught a keeper assigned to the wrong franchise."
          width={1600}
          height={1066}
        />
        <Shot
          src="/thoughts-draft-lab/tiers.png"
          alt="Tier editor grouping players by projection gaps with per-player override dropdowns"
          caption="Tiers are auto-derived from projection-gap breaks, editable per player, persistent across every practice draft — and they feed the urgency math, not just the display."
          width={1600}
          height={1066}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Simulate, grade, learn</h2>
        <p className="text-muted">
          One button plays the whole draft out: opponents draft by their
          configured personalities, your picks come from the recommendation
          engine, keepers resolve where they&apos;re pinned. When it ends,
          every team gets a letter grade curved against the room by starting-
          lineup points — which is how the engine indicted itself: an early
          version gave my team the league&apos;s best total points and its
          tenth-best starters, the exact fingerprint of drafting bench depth.
          The Strategy tab is the distilled output of ~2,500 of these
          simulations: what actually works when RBs fly early, why chasing a
          QB run is the worst tested move, and the one moment reaching is
          correct.
        </p>
        <Shot
          src="/thoughts-draft-lab/grades.png"
          alt="Post-draft grade table ranking all twelve teams with letter grades, starter points and weakest positions"
          caption="Grades curve on starter points, not totals — and every team gets told its weakest spot."
          width={1600}
          height={607}
        />
        <Shot
          src="/thoughts-draft-lab/strategy.png"
          alt="Strategy tab with a scenario playbook backed by simulation results"
          caption="The Strategy tab: a playbook by scenario, every claim backed by the simulation table at the bottom."
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
          slotting, positional maximums, VOR, survival odds and tier math are
          pure functions in one module, exercised by fifteen{" "}
          <code>node --test</code> cases including a full 180-pick simulated
          draft and a 30-seed legality stress run. The UI (a board tab and a
          shadow-DOM overlay injected into the draft room) just renders what the
          engine says.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Scraping a page that fights back
        </h2>
        <p className="text-muted">
          Every assumption about ESPN&apos;s draft room broke at least once.
          The pick sidebar virtualizes, so history disappears from the DOM. Row
          text has no whitespace between cells unless you read{" "}
          <code>innerText</code> instead of <code>textContent</code>. The
          Players table changes its button text depending on whose turn it is.
          The approach that survived: treat the rendered text as the interface,
          anchor patterns on stable tokens (the on-the-clock banner, the
          QUEUE/DRAFT buttons, the &quot;R1, P1&quot; pick format), and cross-
          check against ESPN&apos;s unofficial league API where cookies allow.
          Every scraper failure taught the same lesson — make the failure
          visible. The overlay grew a version badge, a detection log, and a
          debug line showing candidate-row counts, because &quot;it&apos;s not
          working&quot; with a screenshot of self-reported diagnostics is a
          one-round fix instead of four.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What the tests caught</h2>
        <p className="text-muted">
          The unit tests pin the league scoring line by line, but the bugs that
          mattered came from one integration test that plays an entire draft:
          keepers being draftable by other teams before their slot resolved,
          and AI rosters finishing without a kicker because the ADP window
          never surfaced one. Neither shows up in any single-function test —
          they only exist across 180 sequential decisions. That test earned its
          keep more than the other fourteen combined.
        </p>
      </section>

      <Update
        id="update-2026-08-27-season"
        date="August 27, 2026"
        title="The draft ends, the model keeps going: season and playoff projection"
      >
        <p>
          The newest tab takes the drafted roster and plays the actual season:
          ESPN&apos;s real schedule and matchups, actual scores once a week is
          played, projections until then — each team&apos;s lineup rebuilt per
          week so bye weeks sit players (with a replacement-level waiver
          pickup streamed into unfillable slots, because nobody starts a
          zero at D/ST). Expanding a week shows the full head-to-head: both
          lineups slot by slot, an edge per position, both teams&apos; byes.
          Draft results snapshot to storage with their values frozen, so two
          strategies can be drafted, saved, and compared as whole seasons.
        </p>
        <p>
          The first version had a bug the user caught instantly: it projected
          their team undefeated. Deterministic comparison — higher projection
          wins, full stop — makes the best roster 14-0 by construction, and a
          second path to fake perfection hid underneath it (rosters that
          failed to resolve projected zero and lost every week). Projections
          are now probabilities: a logistic on the margin, calibrated to real
          weekly variance, so a genuine contender projects 9-5, not perfect.
          There&apos;s a test asserting exactly that — a dominant roster must
          never project undefeated. From there the questions got sharper, so
          the answers did too: a decomposition panel splits a projected record
          into schedule strength (who you face, who you face twice) and week
          profile (what your bye dips cost in wins, and against whom), and a
          Monte Carlo plays 800 seasons through the league&apos;s real playoff
          bracket at the real playoff weeks — where the points-for tiebreak
          finally pays the high-scoring third seed back.
        </p>
        <p>
          The tab grew three roster sources — the board&apos;s simulated
          draft, ESPN&apos;s current rosters for after the real draft, and a
          fully coherent retrospective: last season&apos;s schedule with last
          season&apos;s rosters and last season&apos;s byes, because mixing
          this year&apos;s bye calendar into last year&apos;s matchups is the
          kind of quiet incoherence that poisons conclusions. The
          retrospective mode earns its keep as a validation set: every
          matchup has a real outcome, so a Model Check card reports how often
          the projection&apos;s favorite actually won, the Brier score
          against coin-flipping, and the average weekly points error — with
          the caveat printed on it that today&apos;s values applied to last
          year&apos;s lineups are partly circular. Rounding out the realism:
          absent managers can be marked as ESPN autopick (strict ADP,
          deterministic), which the survival model exploits — a known
          autopicker is information, not noise.
        </p>
      </Update>
      <Update
        id="update-2026-08-27-multi-sport"
        date="August 27, 2026"
        title="One engine, three sports: NBA and WNBA join"
      >
        <p>
          The v2.0.0 question was whether the engine was actually general or
          just football-shaped. Answer: general, once every football constant
          became a lookup. A sport profile now carries the feed coordinates,
          positions, lineup slots, scoring, tier gaps, and caps; the engine
          swaps profiles in place, so all 21 NFL tests pass byte-identical
          while the same marginal-lineup math drafts NBA and WNBA teams. The
          satisfying part: FLEX and OP generalized into G/F/UTIL eligibility
          with zero new engine code — a superflex slot and a UTIL slot are the
          same idea wearing different jerseys.
        </p>
        <p>
          The feeds cooperated after one hunt: NBA lives at game code
          <code> fba</code>, season 2027, with the same stat-block anatomy as
          football; WNBA exists at <code>wfba</code> but 404s behind a
          different league-defaults id than either other sport — the kind of
          fact you only learn by probing, which is why every coordinate in the
          profile was live-verified before being written down. One bug came
          out of verification too: the injury-blend rule guessed each
          sport&apos;s final scoring period and promptly flagged all 290 NBA
          players as season-ending injuries; the final period is now derived
          from the data itself. Basketball draft-room scraping ships built but
          untested against a live room — same position NFL was in three weeks
          ago, and the same self-diagnosing panel will close the gap on first
          contact.
        </p>
      </Update>
      <Update
        id="update-2026-08-26-live-fire"
        date="August 26, 2026"
        title="A day of live-fire mocks: tiers, rankings, and two id bugs"
      >
        <p>
          Running the extension against back-to-back practice drafts grew it
          fast. The overlay now carries a tier system — players auto-tiered
          from projection gaps over the full pool so tier identity survives
          the draft, editable per player from a Tiers tab (overrides persist
          across drafts), rendered as a ruled grid of left/total per position
          with my own fill against the roster caps. Recommendations blend my
          ESPN &quot;My Rankings&quot;, harvested straight off the page when
          that sort is active, and a tier outlook replaced the useless
          &quot;most teams still need an RB&quot; trend with expected
          survivors per tier by my next pick.
        </p>
        <p>
          The bugs were better than the features. ESPN&apos;s Players list and
          Pick History rows collapse to nearly identical text, so the pick
          parser ingested ranking rows as picks — rank numbers became pick
          numbers and the QUEUE button text overwrote real team names. The
          guard is embarrassingly simple: a &quot;team&quot; called QUEUE is a
          button, not a franchise. Separately, keepers stopped being respected
          after switching projection sources, because keeper assignments
          stored player ids and every source uses a different id scheme — the
          reservation pointed at nobody, so the AI happily drafted a keeper
          three rounds early. Keepers now carry names and re-resolve against
          whatever pool is loaded.
        </p>
        <p>
          One honest limit surfaced too: an auto-keeper mode that makes League
          Manager picks in ESPN&apos;s own UI works when it gets the clock,
          but it cannot stop ESPN&apos;s autopick from sniping a
          keeper-designated player early — the reservation only exists in the
          extension. The reliable lock is ESPN&apos;s native Keepers tab; the
          overlay now says so, loudly, when a keeper gets taken before their
          slot.
        </p>
        <p>
          The grades feature then indicted the AI itself. A full simulation
          gave my team the league&apos;s highest TOTAL points and its
          tenth-best STARTING lineup — the fingerprint of drafting by raw
          value: bench depth at stacked positions instead of starters. The
          engine now scores every candidate by marginal lineup value (what
          they add to the lineup I can actually field), &quot;my&quot; picks
          in simulations come from the recommendation engine rather than the
          generic AI, personal caps let me refuse a third QB or second TE
          outright, and my tier board — overrides included — feeds an urgency
          bump when a pick is the last of its tier likely to survive to my
          next turn. Across a twelve-draft benchmark the recommendation-driven
          team now averages second or third in starter points instead of
          bottom-third.
        </p>
        <p>
          The same harness then answered a question no draft tool I know of
          touches: which two players should I actually keep? Feeding in last
          year&apos;s real draft history (keeper cost = round drafted,
          undrafted = last round) and my end-of-season roster, it simulated
          every viable keeper pair — 55 combinations, 30 drafts each, against
          opponents keeping their own best values. The first run confidently
          told me to swap a keeper for a receiver my bundled projections still
          priced as a top-2 WR — he&apos;d actually finished WR21. Re-priced
          at 75% current projection / 25% last-year finish, the answer
          inverted — and with live ESPN projections in the blend, my existing
          pair ranked first outright, top-3 in every simulated draft.
          The lesson is the oldest one in modelling — the optimizer is only as
          good as its prices, and a confident ranking off one projection
          source is a bug that looks like a feature.
        </p>
        <p>
          Worth saying plainly: none of this accounts for injuries, camp
          news, depth-chart changes, or anything else that isn&apos;t already
          baked into the projections it runs on. The keeper sweep briefly
          ranked a QB coming off IR as the best keep in the league, because no
          number in the system knows what a knee looks like. The projections
          are the model&apos;s entire world — which is exactly why swapping
          them (ESPN fetch, CSV, blends) is a first-class operation in the
          extension instead of an afterthought.
        </p>
        <p>
          The blend then shipped INTO the extension rather than living in
          offline scripts: one fetch now pulls current projections and last
          season&apos;s actuals, scores both under the league&apos;s rules
          (validated to the decimal against the league&apos;s own season
          totals on four of six spot checks), and prices every player at
          75/25 — except players who missed their season&apos;s final three
          games, who stay on pure projection so an injury-shortened year
          can&apos;t drag a healthy player&apos;s value. The last calibration
          layer came from the league itself: profiling all eleven opponents
          from the real 2025 draft recap (the QB hoarders, the
          zero-QB-until-round-15 gambler, the team that takes a D/ST in round
          seven), assigning each a drafting personality, and re-running the
          simulations against that specific room — with the actual keeper
          landscape, the engine won all sixty. Not a promise, since real
          humans out-weird any tendency parameter, but the policy the panel
          recommends live is literally the one that produced that record.
        </p>
      </Update>
      <WhatsNext
        nowShipped={[
          "A Firefox MV3 extension in its own repo: practice drafts against configurable AI opponents, a live companion overlay in the ESPN draft room, keeper reservation, editable tiers with a supply grid, personal-rankings blending, and recommendations with survival odds — all under my league's exact scoring.",
        ]}
        couldImprove={[
          "The scrapers are still pattern-matching an unversioned page; ESPN can break them silently on any deploy. The diagnostics make breakage visible, not impossible.",
          "Auto-keeper cannot beat ESPN\u2019s autopick to a sniped player; the native Keepers tab is the real lock and the extension can only warn.",
          "The AI opponents draft by need and ADP but never trade up their tendencies mid-draft the way a human reacting to a run would.",
          "Temporary add-on installs unload on every Firefox restart; it should get signed for a permanent install before next season.",
        ]}
        upcoming={[
          "The real test is draft night — the API path and the pick detection both get their first honest run there. Nothing else scheduled until that verdict is in.",
        ]}
      />
    </ThoughtLayout>
  );
}
