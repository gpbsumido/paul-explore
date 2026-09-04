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
      </Update>

      <WhatsNext
        nowShipped={[
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
        ]}
        couldImprove={[
          "Season wallets open at a hardcoded $500 default; a real deposit-amount input (any amount ≥ $20) is the follow-up the default is standing in for.",
          "The sharp score is a simple CLV + ROI + volume rollup for now; the formula wants calibration against real outcomes before it means much.",
          "Results only match by the vendor's own event ids. An ESPN fallback would need fuzzy team-and-time matching, which I left as a deliberate later problem.",
          "Bust is a periodic sweep rather than instant on the losing bet — fine at this scale, worth tightening for the feel of it.",
          "It's all simulated dollars on purpose. Real deposits and investing the float is custody and money-transmission territory, and that waits on counsel, not code.",
        ]}
        upcoming={[
          "Real money, which is the whole reason the ledger came first: custody and money transmission are a licensing-and-counsel problem, not a code one. The simulated version is complete; the real one waits on lawyers.",
          "Accolades — the milestone and speed badges — surfaced on the profile once it ships, so there's something to show off besides the numbers.",
        ]}
      />
    </ThoughtLayout>
  );
}
