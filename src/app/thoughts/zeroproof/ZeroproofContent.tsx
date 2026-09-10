import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { Update, WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";
const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

export default function ZeroproofContent() {
  return (
    <ThoughtLayout
      breadcrumb="ZeroProof"
      title="Building a no-loss sportsbook, ledger first"
      intro={
        <>
          The idea is sports betting with the loss taken out. You lock a deposit
          for a term, bet it freely on real lines, and at the end you get the
          original deposit back no matter your record. What you keep forever is
          the record — every bet, every swing, a bankroll curve, a profile you
          can show off. The catch is that holding people&apos;s deposits and
          investing the float is the legally hard part, so the first cut draws a
          hard line: the ledger is real, the dollars are simulated. Every
          deposit, stake, payout and refund is a real double-entry row, and
          &quot;deposit $100&quot; is a button, not a charge. This is what I
          built into the API behind this site, and why I built it in that order.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">
          Balances are a lie you should only tell once
        </h2>
        <p className="text-muted">
          The first decision was the one I could not take back later, so I spent
          the most time on it: money is never a number in a column. It is
          derived from a ledger, and every movement is a set of lines that sum
          to zero across three accounts — the user&apos;s bankroll, an escrow
          that holds the locked principal, and the house. A wallet&apos;s
          balance is the running total of its user-account lines, computed on
          read, never stored.
        </p>
        <p className="mt-3 text-muted">
          It is more code than a <code className={code}>balance</code> column,
          and it is the whole reason the fake-money version can become the
          real-money version without a rewrite. Placing a bet moves the stake
          from the user to escrow; settling it pays out or sweeps to the house;
          the term ends and the principal comes back — and every one of those is
          a pair that nets to zero, checked by a pure function before it ever
          reaches Postgres.
        </p>
        <pre className={pre}>
          {`// a $25 win at +122, in ledger lines that sum to 0
user   payout  +2500   // stake returned from escrow
escrow payout  -2500
user   payout  +3050   // profit paid by the house
house  payout  -3050`}
        </pre>
        <p className="mt-3 text-muted">
          The refund at the end is the part that makes it &quot;no-loss&quot;:
          it returns exactly the principal, whatever the record. A wallet up 40%
          and a wallet that went to zero both get the same deposit back. The
          paper profit was always a stat, not cash — which is the honest version
          of what a real book&apos;s screenshot never tells you.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The moat isn&apos;t the lines, it&apos;s what you did with them
        </h2>
        <p className="text-muted">
          Anyone can buy the same odds API I did; the inputs are a commodity.
          The thing that compounds and cannot be bootstrapped is the output of
          play — a record of decisions made at a frozen line with a known
          outcome. Real books know whether you won money. They do not know
          whether you were <em>good</em>, because variance hides skill. The
          public proxy that cuts through it is closing-line value: did the price
          you took beat where the line closed.
        </p>
        <p className="mt-3 text-muted">
          So the odds worker snapshots every pull instead of overwriting, and at
          settlement I read the last snapshot before kickoff and stamp the
          closing odds and the CLV onto the bet. It is unrecoverable if you
          don&apos;t capture it live, which is exactly why it was in the first
          cut and not a &quot;later.&quot; A bet at -110 that closes at -130
          beat the market, and the number says so:
        </p>
        <pre className={pre}>
          {`computeClv(-110, -130)  →  +7.91   // took 1.909, closed 1.769
computeClv(-130, -110)  →  -7.33   // the other side of the same move`}
        </pre>
        <p className="mt-3 text-muted">
          Roll CLV up with ROI and volume over a few hundred bets and you get a
          sharp score — a single number a competitor can&apos;t fake on day one
          and that gets more accurate the longer someone plays. It is also the
          targeting signal for the one revenue line that needs no licensing:
          refer the provably-sharp users to a real book and take the affiliate
          fee. The moat and the first dollar are the same asset.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Seven pull requests, and each one deploys
        </h2>
        <p className="text-muted">
          I built it as a stack, not a big bang: ledger and wallets, then odds
          ingestion, then placing a bet, then settlement, then the term-end
          unlock, then the profile and leaderboard, then the house view and
          referrals. Each one is a clean break — it has its own migration, its
          own tests, and it deploys on its own — so I could ship and check a
          stage before the next one built on it, and so a reviewer reads one
          idea at a time instead of a wall.
        </p>
        <p className="mt-3 text-muted">
          The settler is the piece I was most careful with, because the failure
          mode is paying twice. It is idempotent: it only grades open bets and
          skips events already marked final, so running it again over the same
          results is a no-op. The messy tail — pushes, voids, an exact spread
          cover, a postponed game — is graded first-class and tested first,
          because that is where settlement disputes actually live.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The vendor is allowed to be down
        </h2>
        <p className="text-muted">
          Odds and results both sit behind one interface, with three
          implementations: the real API, a fixtures provider that replays a
          captured slate for zero credits, and — for results — the quota-free
          scores endpoint. Dev, test and seeding never spend a credit, and the
          provider is chosen explicitly by an environment variable rather than
          guessed.
        </p>
        <p className="mt-3 text-muted">
          The rule I held to there was to fail loud, not fall back quietly. A
          dead vendor or an exhausted quota throws — it does not return an empty
          slate that reads as &quot;no games today,&quot; which is the kind of
          silent default that becomes a 2am mystery. User traffic never touches
          the vendor at all: the events feed serves from the database, so quota
          is a worker&apos;s problem, not a scaling one.
        </p>
      </section>

      <Update
        id="update-2026-09-03-lobby"
        date="September 3, 2026"
        title="The front end starts where the API is safest to show: read-only"
      >
        <p>
          The API shipped as eight stacked backend PRs, and the front end is
          following the same discipline: small, stacked, each one deployable. The
          first slice is the part that can&apos;t go wrong, because it can&apos;t
          do anything — a read-only lobby.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Show the board before the bet slip
        </h3>
        <p className="text-muted">
          The lobby at <code className={code}>/zeroproof</code> renders the
          public events board — upcoming games with their latest moneyline,
          spread and total lines — straight from the same DB-backed endpoint the
          settler reads, so no vendor call rides on a visitor. Under it sits the
          sharp leaderboard: players ranked by closing-line value rolled up with
          return and volume. There is nothing to click that spends anything,
          which is exactly why it&apos;s the honest first thing to ship.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The raw sub never reaches the page
        </h3>
        <p className="text-muted">
          The leaderboard endpoint returns the Auth0{" "}
          <code className={code}>sub</code> per row, which is a user identifier
          and has no business on a public page. The front end derives a stable,
          opaque handle from it instead — the same player always reads the same
          token, and the token can&apos;t be walked back — and a test asserts the{" "}
          <code className={code}>sub</code> string never appears in the rendered
          DOM.
        </p>
        <pre className={pre}>
          {`playerHandle("auth0|abc123")  →  "P-1F9K2"   // stable, opaque
board.textContent  →  never contains "auth0|"`}
        </pre>
      </Update>

      <Update
        id="update-2026-09-03-live-and-horizon"
        date="September 3, 2026"
        title="Going live turned up a bug the tests couldn't have caught, and the board grew a horizon"
      >
        <p>
          With the lobby merged and real odds flowing from The Odds API on a
          cron, two things surfaced that only a live product does: the first bet
          you try to place fails, and a weekly sport makes the board look empty.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The wallet you couldn&apos;t open
        </h3>
        <p className="text-muted">
          Opening a Season wallet returned{" "}
          <code className={code}>Validation failed</code>. The body looked right
          from the browser, so I chased the schema first — wrong. The frontend
          proxies the write through a BFF route, and that route forwarded the
          body to the API with only an Authorization header. Express&apos;s{" "}
          <code className={code}>express.json()</code> only parses when the
          content-type says JSON, so the API received an empty body and the
          first required field failed. Every integration test passed because
          supertest sets the header for you — the gap was in the one seam the
          tests mocked.
        </p>
        <pre className={pre}>
          {`headers: buildHeaders(token, null)   // Authorization only, no Content-Type
// → express.json() skips the body → req.body = {} → "mode is required"
headers: buildHeaders(token, null, { "Content-Type": "application/json" })  // fixed`}
        </pre>
        <p className="text-muted">
          One more layer down: the Season button posted a bare{" "}
          <code className={code}>{`{ mode }`}</code> with no amount, which the
          backend rejects because a Season wallet needs a deposit. It defaults to
          $500 now; a real deposit-amount input is the follow-up.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Three days at a time
        </h3>
        <p className="text-muted">
          MLB is a daily slate, but NFL is weekly — point the odds cron at
          football and the board shows a wall of games a week out, or nothing for
          days. So the board defaults to the next three days and grows from
          there: a load-more that adds three days, a toggle to auto-load as you
          scroll instead, and a collapse back to three. The window is a client
          filter over the same served-from-DB list — the endpoint already returns
          every upcoming game in kickoff order, so &quot;load more&quot; costs no
          fetch and no vendor credit.
        </p>
        <pre className={pre}>
          {`cutoff = now + daysAhead * ONE_DAY        // daysAhead starts at 3
visible = events.filter(e => e.commenceTime <= cutoff)
// load more → daysAhead += 3 ; collapse → daysAhead = 3`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Three tabs, not one scroll
        </h3>
        <p className="text-muted">
          The lobby had grown three jobs on one page — the board you bet from,
          the leaderboard you compare on, and your own record — and they read as
          one long scroll. They&apos;re tabs now: Board, Leaderboard, Your
          record. All three panels stay mounted so their data preloads and a
          switch is instant; the inactive ones are{" "}
          <code className={code}>hidden</code>, which also drops them out of the
          accessibility tree, so a screen reader and the keyboard only ever see
          the panel you&apos;re on. The tablist is a proper ARIA one — arrow
          keys move between tabs, and the selected tab is the only one in the tab
          order.
        </p>
      </Update>

      <Update
        id="update-2026-09-04-board-days"
        date="September 4, 2026"
        title="The board reads by day, and remembers the games you're in"
      >
        <p>
          Two board refinements once real football lines were flowing, both about
          not losing the game you care about in a list.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A wall of games becomes a few days
        </h3>
        <p className="text-muted">
          A weekend NFL slate is a lot of games at once. The board groups them by
          day under a heading each — the events already arrive sorted by kickoff,
          so it&apos;s a grouping over the same list, no new fetch.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A fixture you&apos;re in is flagged, and never hidden
        </h3>
        <p className="text-muted">
          Any fixture the caller already has a bet on gets a{" "}
          <code className={code}>Your bet</code> badge, and stays on the board
          even when it&apos;s past the day-horizon — so a game you&apos;re in
          can&apos;t scroll off behind the three-day default. The board reuses the
          profile&apos;s bets query and shows nothing extra when you&apos;re
          signed out.
        </p>
        <pre className={pre}>
          {`visible = events.filter(e => e.commenceTime <= cutoff || betOn.has(e.id))
// bet-on fixtures are always in, horizon or not`}
        </pre>
      </Update>

      <Update
        id="update-2026-09-08-leagues"
        date="September 8, 2026"
        title="Leagues, without touching how a bet works"
      >
        <p>
          People wanted to run their own contests — set the bankroll, the size,
          how you win — and compete on a private board. The temptation was a whole
          second system. It didn&apos;t need one.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A league is a scope, not a new game
        </h3>
        <p className="text-muted">
          Every member bets from a league-scoped wallet — a new{" "}
          <code className={code}>mode=&apos;league&apos;</code> row tagged with a{" "}
          <code className={code}>league_id</code>. Placement, the ledger and the
          settler never learned the word &quot;league&quot;; a league only decides
          which wallet you bet from and whose bankroll your standing compares
          against. The board ranks by balance, ROI breaking ties — the same pure
          ranking the global leaderboard already used.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The one place it wasn&apos;t free: keeping league play out of your record
        </h3>
        <p className="text-muted">
          League wallets belong to you, so they&apos;d have quietly leaked into the
          global sharp leaderboard and your <code className={code}>/me</code> stats
          — a for-fun contest inflating the record that&apos;s the actual product.
          So the global scans are scoped to season and challenge play only, and
          because a user can now hold an active wallet in many leagues at once, the
          one-active-wallet index had to split.
        </p>
        <pre className={pre}>
          {`-- season/challenge: still one active wallet per mode
CREATE UNIQUE INDEX ... ON (user_sub, mode) WHERE status='active' AND mode <> 'league';
-- league wallets: unique per league instead
CREATE UNIQUE INDEX ... ON (user_sub, league_id) WHERE status='active' AND mode='league';`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Winning is a sweep, not a hook in every bet
        </h3>
        <p className="text-muted">
          A cron settles finished leagues — threshold once a member crosses the
          target, timeline once the deadline passes — stamps the winner and freezes
          the final board. The winner is the leader the moment a crossing is first
          seen rather than strictly the first to cross: a deliberate simplification
          that keeps settlement a decoupled sweep instead of logic threaded into
          every bet&apos;s settlement.
        </p>
      </Update>

      <Update
        id="update-2026-09-08-espn"
        date="September 8, 2026"
        title="Fantasy matchups are just events, so they were nearly free"
      >
        <p>
          The ask was betting on ESPN fantasy weekly matchups, and binding a
          league so its members only bet one ESPN league. The surprise was how
          little new machinery it needed.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          ESPN hands you scores, not a line
        </h3>
        <p className="text-muted">
          The matchup feed has projected and actual scores and a winner, but no
          odds — so there&apos;s no line to normalise. v1 prices every matchup as
          a pick&apos;em (both sides -110); a projected-score moneyline is the next
          step. There&apos;s also no kickoff timestamp, so the commence time is
          synthesised and betting stays open until the matchup settles.
        </p>
        <pre className={pre}>
          {`{ "matchupPeriodId": 1, "winner": "UNDECIDED",
  "home": { "teamId": 5, "totalPoints": 0 },
  "away": { "teamId": 4, "totalPoints": 0 } }`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A matchup is an event; a binding is a prefix check
        </h3>
        <p className="text-muted">
          The provider writes each matchup as an event with a stable key —{" "}
          <code className={code}>espn:&#123;game&#125;:&#123;season&#125;:&#123;leagueId&#125;:…</code>{" "}
          — so a bet, the ledger and settlement never learned the word
          &quot;fantasy.&quot; Binding a league to one ESPN league is then just a
          prefix match at placement: a bound league&apos;s wallet may only bet
          events whose key names that game, season and league, and anything else
          is refused. No new state, no new settlement path — the weekly score
          grades it like any other result.
        </p>
      </Update>

      <Update
        id="update-2026-09-08-espn-additive"
        date="September 8, 2026"
        title="I built the binding as a cage, then realised it should be a shelf"
      >
        <p>
          A day after shipping the ESPN binding, I changed the shape of it. The
          first version tied a league to one ESPN league and refused everything
          else — and that turned out to be the wrong instinct.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          &quot;Only bet this&quot; is a worse contest than &quot;also bet this&quot;
        </h3>
        <p className="text-muted">
          A league locked to one ESPN league is a narrower product than the one
          it&apos;s inside. The point of a contest is a shared bankroll and a
          leaderboard; forcing every bet to be one fantasy league&apos;s weekly
          matchup makes it thinner, not more focused. What a commissioner actually
          wants is to <em>add</em> their league&apos;s matchups to the board their
          members already bet — a shelf you put things on, not a cage you lock
          them in.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The whole feature was one gate, so inverting it was mostly deletion
        </h3>
        <p className="text-muted">
          The restriction lived in exactly one place — a check at placement that
          refused a league wallet betting outside its bound key. Taking it out is
          the core of the change:
        </p>
        <pre className={pre}>
          {`-  if (wallet.mode === 'league' && wallet.leagueId) {
-    const binding = espnBindingOf(await getLeagueById(wallet.leagueId));
-    if (binding && !isEventInEspnLeague(event.providerKey, binding))
-      throw new ForbiddenError('This league only bets its bound ESPN matchups');
-  }`}
        </pre>
        <p className="text-muted">
          What replaces it is additive: a per-league table of ESPN leagues a
          commissioner has added, whose keys are unioned into the ingest list so
          their matchups show up on the board — and nothing stops a member betting
          anything else. The single-bind columns are still there, unused; the new
          many-to-many is the real model. Managing it moved off the create form and
          onto the league page, where only the commissioner sees the add and remove
          controls.
        </p>
      </Update>

      <Update
        id="update-2026-09-09-espn-health"
        date="September 9, 2026"
        title="A cron died on one bad league, and the fix opened a quieter hole"
      >
        <p>
          The ESPN settle cron went red in staging. The reflex read was &quot;no
          bets to settle&quot; — but that&apos;s a clean no-op. It took three passes
          to get the real shape of it, and the first fix created the problem the
          third one solved.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          One unreachable league failed settlement for all of them
        </h3>
        <p className="text-muted">
          The provider looped its configured leagues and <code className={code}>await</code>ed
          each fetch with no isolation. One league returning a non-2xx — a private
          league, a wrong id, an off-season season — threw, and the throw aborted
          the loop, so <em>nothing</em> settled, not just the bad one.
        </p>
        <pre className={pre}>
          {`ESPN fantasy returned 401 for fba:449389534:2027
  → getResults() threw → settle() threw → cron exit 1 (nothing graded)`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Making it resilient made the failure invisible
        </h3>
        <p className="text-muted">
          The fix was to skip a league that won&apos;t fetch and settle the rest.
          Correct — but now a commissioner&apos;s misconfigured league just silently
          never appears, with nothing on the page to say why. Resilience without
          observability is a worse bug wearing a calmer face. So the skip had to
          become something you can see.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Health belongs to the key, not the row that added it
        </h3>
        <p className="text-muted">
          The same ESPN league can sit in the registry, in several contests, and in
          an env fallback — its reachability is identical everywhere, so storing a
          status per row would duplicate it. It&apos;s one health record per key
          (<code className={code}>game:leagueId:season</code>), written by the sync
          as it fetches (an observer on the fetch, so no extra call), and left-joined
          onto the league detail. The page now says which league it can&apos;t reach
          and when it last worked, instead of quietly dropping it.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Then the real-sports path had the exact same bug
        </h3>
        <p className="text-muted">
          Once I&apos;d named the shape, it was obvious the odds-vendor providers did
          it too: one sport&apos;s quota blip threw and sank the whole board sync and
          settle. Same fix — isolate per sport, log and skip, let the reachable ones
          through. No per-league page there to surface it on, so that one stays in the
          logs, where the operator who set the sport list can see it.
        </p>
      </Update>

      <Update
        id="update-2026-09-09-tour"
        date="September 9, 2026"
        title="The lobby made sense to me and to no one else"
      >
        <p>
          I sat someone new in front of the ZeroProof lobby and watched them not
          know where to start. Board, Leagues, Leaderboard, Your record — obvious
          to me, who built it, and a wall of tabs to anyone else. So the lobby now
          offers to walk you through itself, one coach-mark at a time.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Ask before you take over the screen
        </h3>
        <p className="text-muted">
          A tour that just seizes the page on arrival is a tour you resent. The
          first step is a plain question — take a quick tour, yes or no — and
          &quot;No thanks&quot; closes it for good. Only &quot;Show me around&quot;
          starts spotlighting things. It auto-opens on a first visit and never
          again once you&apos;ve seen or dismissed it, and a &quot;Take the tour&quot;
          button in the header brings it back whenever you want it.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A spotlight the linter wouldn&apos;t let me measure
        </h3>
        <p className="text-muted">
          Each step highlights a real element — a tab, the intro — by measuring its
          box with <code className={code}>getBoundingClientRect()</code> and cutting a
          hole in a dimmed backdrop over it. The obvious place to measure is an
          effect, and the obvious place to store the result is state. That is exactly
          the shape the hooks lint refuses:
        </p>
        <pre className={pre}>
          {`error  Do not call setState synchronously in an effect
       react-hooks/set-state-in-effect`}
        </pre>
        <p className="text-muted">
          The fix is to measure inside a{" "}
          <code className={code}>requestAnimationFrame</code> callback — which runs
          after the tab switch has re-rendered the lobby, so the element is where it
          will actually sit — and set the rect from there. Switching tabs happens in
          the Next handler, an event, not an effect; and rendering the tour only while
          it&apos;s open means it mounts fresh at the consent step every time, so there
          is no reset effect to trip over either.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          While I was in there: the header dropdown was painted over
        </h3>
        <p className="text-muted">
          The theme menu in the page header opened <em>behind</em> the board&apos;s
          sticky &quot;Auto-load as I scroll&quot; bar. Both sat at{" "}
          <code className={code}>z-20</code>, and the board bar comes later in the DOM,
          so it won — the menu&apos;s own <code className={code}>z-50</code> meant
          nothing, capped inside the header&apos;s stacking context. Lifting just the
          ZeroProof header to <code className={code}>z-30</code> puts the dropdown back
          on top.
        </p>
      </Update>

      <Update
        id="update-2026-09-09-tour-engine"
        date="September 9, 2026"
        title="The tour was too good to leave on one page"
      >
        <p>
          The ZeroProof tour did its job, and the obvious next thought was that
          every dense page on the site has the same cold-start problem. So I
          pulled the tour out of ZeroProof and made it a thing any page can wear.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          One engine, five more pages
        </h3>
        <p className="text-muted">
          The coach-mark overlay, the consent-first flow, the measure-in-a-frame
          spotlight and the auto-open-once logic all moved into a shared{" "}
          <code className={code}>GuidedTour</code> engine — a component, a{" "}
          <code className={code}>useGuidedTour</code> hook, and a{" "}
          <code className={code}>FeatureTour</code> drop-in that a page wires up
          with a label, a storage key, and its own steps. ZeroProof now uses it
          too, so there is one implementation, not two. Fantasy, the Pokémon TCG
          browser, the operator and vitals dashboards, and the design-system
          gallery each got a tour built from a few lines of step config.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The auto-open modal fought the test suite
        </h3>
        <p className="text-muted">
          A tour that opens itself on a first visit is a modal that covers the
          page — and the E2E suite lands on every page as a first-time visitor.
          The operator dashboard&apos;s a11y scan started measuring the tour
          instead of the page, and the restock and card-browser flows had a
          backdrop over the thing they were trying to click.
        </p>
        <pre className={pre}>
          {`// e2e/helpers/tours.ts — pin every tour "seen" before the page runs,
// the same way the theme is pinned, so a coach-mark can't cover a scan.
await disableTours(page);`}
        </pre>
        <p className="text-muted">
          The fix was the same shape as the theme-pinning the a11y scans already
          do: a shared helper that marks every tour seen before the page&apos;s
          scripts run. The tours&apos; own behaviour — and the overlay&apos;s
          accessibility — stay covered by the unit suite instead.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          One page said no
        </h3>
        <p className="text-muted">
          The 3D world is the exception. Its HUD is a set of corner panels, some
          of them keyboard-only, over a WebGL canvas that doesn&apos;t render in
          jsdom — so a coach-mark tour there wants more than a step config and a
          couple of ids, and I left it for its own pass. The engine is ready when
          the world&apos;s HUD is.
        </p>
      </Update>

      <Update
        id="update-2026-09-10-tour-consume"
        date="September 10, 2026"
        title="The tour went to the design system and came back"
      >
        <p>
          I&apos;d pulled the tour into a reusable{" "}
          <code className={code}>GuidedTour</code> in{" "}
          <code className={code}>@paul-portfolio/react</code>. The obvious next
          step was to stop maintaining a second copy here and consume the
          published one — dogfood my own primitive.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Most of the tours swapped over cleanly
        </h3>
        <p className="text-muted">
          Fantasy, the Pokémon TCG browser, and the operator, vitals and
          design-system tours are just coach-marks — spotlight a thing, describe
          it, move on. Those now render the package&apos;s{" "}
          <code className={code}>GuidedTour</code> straight off, with{" "}
          <code className={code}>FeatureTour</code> mapping the app&apos;s step
          shape to the package&apos;s. The tour&apos;s CSS rode in for free — it
          lives in the same <code className={code}>components.css</code> the app
          already imports.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          ZeroProof is the one that didn&apos;t
        </h3>
        <p className="text-muted">
          The lobby tour switches tabs as it walks them, and I&apos;d deliberately
          shipped the design-system primitive <em>without</em> a per-step side
          effect — a coach-mark library shouldn&apos;t assume its host has tabs.
          So the published version literally can&apos;t drive ZeroProof&apos;s
          tab-switching. Rather than regress it, <code className={code}>FeatureTour</code>{" "}
          keeps any tour with an <code className={code}>onEnter</code> step on the
          local engine and routes the rest to the package:
        </p>
        <pre className={pre}>
          {`const needsLocalEngine = steps.some((step) => step.onEnter);
// ZeroProof (onEnter) -> local engine; the rest -> @paul-portfolio/react`}
        </pre>
        <p className="text-muted">
          Then I added the missing piece upstream — a per-step{" "}
          <code className={code}>onEnter</code> hook on the design-system{" "}
          <code className={code}>GuidedTour</code>. Once that version publishes,
          ZeroProof folds onto the package too and the local overlay goes away.
          The right shape for the primitive turned out to be the one the hardest
          consumer needed, which is exactly what dogfooding is for.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "ESPN fantasy matchup betting: a provider ingests a league's weekly head-to-head matchups as pick'em events — badged Fantasy on the board — settled by the weekly score. A league's commissioner adds public ESPN leagues to their contest on the league page; their matchups show on the board and members bet them alongside everything else.",
          "Resilient ingestion with health you can see: one unreachable ESPN league — or one failing sport on the odds vendor — is skipped and logged instead of sinking the whole sync or settle, and a league page shows which of its ESPN leagues can't be reached, why, and when it last worked.",
          "Leagues: run your own contest with its own rules — starting bankroll, size, and a first-to-a-target or highest-by-a-date win condition. Public leagues are searchable, invite ones share a code, and each has its own bankroll-ranked board and a winner. You bet from a league-scoped wallet, so league play stays out of the global record.",
          "A double-entry ledger with derived balances, and Season and Challenge wallets that open with a simulated deposit.",
          "Odds ingestion behind a swappable provider, snapshotted on every pull, served to users from the database only.",
          "Placing a bet with the odds frozen at placement, an available-balance check inside the transaction, and a stale-line gate.",
          "An idempotent settler that grades h2h, spread and total, pays the ledger, and stamps closing-line value on every bet.",
          "Term-end principal refunds, challenge bust archiving, a profile with a sharp score, a leaderboard, and the house/referral revenue plumbing.",
          "A read-only front-end lobby: the public events board and the sharp leaderboard, built in a stack over this API.",
          "A signed-in profile on the lobby — record, ROI, sharp score, CLV, streaks, wallets and accolades, read from an authed /me endpoint.",
          "The interactive loop: open a Season or Challenge wallet, pick an outcome to fill a bet slip, and place a stake against the live board — the frontend names the outcome and the backend freezes the line.",
          "Bet history on the profile — each graded bet with its result and the closing-line value the settler stamped, read from an authed /bets endpoint, so a decision sits next to how the market moved on it.",
          "A Sharp/ROI toggle on the leaderboard, forwarding ?board through the proxy — sharp for skill, ROI for the variance a sharp score would talk you out of.",
          "Live settlement: the profile and bet history poll while you're signed in, so a bet the settler grades in the background lands on the open page — result, closing line and updated balance — with no reload. The front end is now a book you can sit in front of.",
          "Real odds on a cron: The Odds API feeds the board through the odds-sync worker, snapshotted to the DB, so the lobby shows live football lines without a vendor call on the page.",
          "A board horizon: the lobby shows the next three days by default, with a load-more that adds three days, an auto-load-on-scroll toggle, and a collapse back — a client filter over the served-from-DB list, so it costs no fetch.",
          "Tabs: Board, Leaderboard and Your record are separate tabs now — a proper ARIA tablist with arrow-key navigation, panels kept mounted so their data preloads and inactive ones out of the a11y tree.",
          "The board groups fixtures by day, and a fixture you've already bet on is badged and always shown — even past the day-horizon.",
          "A bankroll trend on Your record: cumulative profit and loss over your settled bets, a line for the season and a line for everything, with the figures printed in text under the chart.",
          "A guided tour: a first visit opens with a consent step, then walks the lobby a coach-mark at a time — what ZeroProof is, then the board, leagues, leaderboard and record — spotlighting each real surface and switching to its tab. It asks before it starts, never nags twice, and a Take-the-tour button in the header reopens it any time.",
          "That tour is now a shared engine: the same consent-first coach-mark runs on Fantasy, the Pokémon TCG browser, the operator and vitals dashboards, and the design-system gallery, each built from a small per-page step config.",
        ]}
        couldImprove={[
          "Season wallets open at a hardcoded $500 default; a real deposit-amount input (any amount ≥ $20) is the follow-up the default is standing in for.",
          "The sharp score is a simple CLV + ROI + volume rollup for now; the formula wants calibration against real outcomes before it means much.",
          "Results only match by the vendor's own event ids. An ESPN fallback would need fuzzy team-and-time matching, which I left as a deliberate later problem.",
          "Bust is a periodic sweep rather than instant on the losing bet — fine at this scale, worth tightening for the feel of it.",
          "It's all simulated dollars on purpose. Real deposits and investing the float is custody and money-transmission territory, and that waits on counsel, not code.",
          "League betting reuses the board's wallet picker rather than a league-scoped bet slip; auto-selecting your league wallet when you arrive from a league page, and a 'you' marker on the standings, are the obvious follow-ups.",
        ]}
        upcoming={[
          "Real money, which is the whole reason the ledger came first: custody and money transmission are a licensing-and-counsel problem, not a code one. The simulated version is complete; the real one waits on lawyers.",
          "Accolades — the milestone and speed badges — surfaced on the profile once it ships, so there's something to show off besides the numbers.",
          "Pricing fantasy matchups off ESPN's projected scores instead of the -110 pick'em they ship as now — a real favourite and underdog, derived from each side's projected starters.",
          "Adding ESPN leagues without a redeploy: the sync reads its league list from env today, so a small registry (and an admin endpoint) would let a league be added as data, not a config change.",
        ]}
      />
    </ThoughtLayout>
  );
}
