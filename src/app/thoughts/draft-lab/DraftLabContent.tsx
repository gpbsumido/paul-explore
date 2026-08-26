import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { Sent, Received, Timestamp } from "@/lib/threads";
import styles from "@/app/thoughts/_shared/chat.module.css";

export default function DraftLabContent() {
  return (
    <ThoughtLayout
      breadcrumb="Draft Lab"
      title="Draft Lab"
      intro={
        <>
          A Firefox extension that rides along inside the ESPN fantasy draft
          room: it watches picks happen, tracks keepers, knows my league&apos;s
          exact scoring, and floats a panel with tier supply and live
          recommendations. Lives in its own repo, not this one.
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

      <WhatsNext
        nowShipped={[
          "A Firefox MV3 extension in its own repo: practice drafts against configurable AI opponents, a live companion overlay in the ESPN draft room, keeper reservation, editable tiers with a supply grid, personal-rankings blending, and recommendations with survival odds — all under my league's exact scoring.",
        ]}
        couldImprove={[
          "The scrapers are still pattern-matching an unversioned page; ESPN can break them silently on any deploy. The diagnostics make breakage visible, not impossible.",
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
