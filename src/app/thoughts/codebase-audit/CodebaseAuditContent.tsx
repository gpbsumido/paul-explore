import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { Update, WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

/** Inline code chip, matching the rest of the write-ups. */
const C = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
    {children}
  </code>
);

const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

const beat = "mt-6 mb-2 text-[15px] font-semibold text-foreground";

const linkClass = "text-primary-600 hover:underline dark:text-primary-400";

/** The audit write-up: the method, the cross-cutting bugs, and where the rest went. */
export default function CodebaseAuditContent() {
  return (
    <ThoughtLayout
      breadcrumb="Codebase Audit"
      title="Thirteen bugs that looked fine"
      intro={
        <>
          I sat down to audit this codebase for structure, not bugs: where the
          same idea lives in six places, where a boundary leaks, what I would
          redesign. Thirteen bugs fell out anyway. What made me write this up is
          that nearly all of them had the same shape. Something failed, and
          the code reported a plausible result instead. A 500 became
          &ldquo;not connected&rdquo;. A rejected write became a success. A
          prop became nothing. None of them crashed, which is exactly why none
          of them had been noticed.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">
          An audit that wasn&rsquo;t allowed to fix anything
        </h2>
        <p className="text-muted">
          I used the first half of an untangle-the-codebase method: list every
          problem, then redesign from first principles, and stop there. No code
          changed during the audit. That rule mattered more than I expected. The
          moment you are allowed to fix things, you stop reading the next file
          and start fixing the first one, and the list ends up as long as your
          patience rather than as long as the problems.
        </p>
        <p className="mt-3 text-muted">
          The evidence was an import graph I could query for upward and
          cross-feature imports, grep sweeps for repeated idioms, read-throughs
          of each area, and <C>git log</C> co-change counts to find files that
          always move together. Anything I had only read and not run got marked{" "}
          <em>reasoned</em>, so the bugs I was confident about and the ones I
          was guessing at didn&rsquo;t look the same on the page.
        </p>
        <p className="mt-3 text-muted">
          The bugs went in their own table, separate from the redesign. The
          method says not to hunt bugs, and I didn&rsquo;t, but these turned up
          while tracing how things connect. Keeping them apart meant I could fix
          them one by one without the redesign riding along.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The ones that weren&rsquo;t about any single feature
        </h2>
        <p className="text-muted">
          Most of the thirteen live inside one feature, and those write-ups
          carry them now (the list is further down). Five belonged to the site
          as a whole.
        </p>

        <h3 className={beat}>
          Every write-up told search engines it was the homepage
        </h3>
        <p className="text-muted">
          The root layout set a canonical URL. Next merges metadata shallowly,
          so any page that didn&rsquo;t set <C>alternates</C> itself inherited
          it, and the shared helper every write-up uses didn&rsquo;t set one:
        </p>
        <pre className={pre}>
          {`export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },`}
        </pre>
        <p className="mt-3 text-muted">
          Each write-up was declaring itself a duplicate of <C>/</C>. Nothing
          looks wrong in a browser, which is the whole problem. The root
          canonical is gone, <C>buildArticleMetadata</C> emits the page&rsquo;s
          own path, and an integration check renders real pages instead of only
          inspecting the root metadata object.
        </p>

        <h3 className={beat}>
          <C>encodeURIComponent</C> does not stop <C>..</C>
        </h3>
        <p className="text-muted">
          Nine API routes put the id from the URL into the backend URL like
          this:
        </p>
        <pre className={pre}>
          {`\`\${API_URL}/api/zeroproof/leagues/\${encodeURIComponent(id)}/join\``}
        </pre>
        <p className="mt-3 text-muted">
          It reads as safe. But Next decodes <C>%2e%2e</C> to <C>..</C>{" "}
          before the handler runs, <C>encodeURIComponent(&quot;..&quot;)</C>{" "}
          is still <C>..</C>, and <C>fetch</C> resolves it. So{" "}
          <C>/api/zeroproof/leagues/%2e%2e/join</C> went out as{" "}
          <C>/api/zeroproof/join</C> with the caller&rsquo;s token attached.
          Every other route already used <C>safeSegment</C>; these nine were
          older. They use it now, and a test fails if any route goes back to{" "}
          <C>encodeURIComponent</C> for a path id.
        </p>

        <h3 className={beat}>
          A link button threw away everything I passed it
        </h3>
        <p className="text-muted">
          <C>Button</C> with an <C>href</C> only forwarded its own styling
          props:
        </p>
        <pre className={pre}>
          {`const shared = { ref, variant, size, loading, disabled, className } as const;

if (href) {
  return (
    <PaulButton {...shared} href={href}>
      {children}
    </PaulButton>
  );
}`}
        </pre>
        <p className="mt-3 text-muted">
          An <C>aria-label</C>, a <C>target</C> or an <C>onClick</C> on a link
          button type-checked and then vanished. <C>Chip</C> had the same habit
          in its link form, and <C>Input</C> with <C>hideLabel</C> rendered a{" "}
          <C>&lt;label htmlFor&gt;</C> pointing at an id the input never got.
          The fix that holds is in the types: Button is a union of a button and
          a link, everything is passed through, and the link form of Chip
          refuses the handlers it can&rsquo;t honour at compile time instead of
          accepting and dropping them.
        </p>

        <h3 className={beat}>
          Six feature colours had drifted from their own tokens
        </h3>
        <p className="text-muted">
          Each feature has a theme-aware token and one hex in the feature data
          for places that can&rsquo;t switch on theme. The hex is supposed to be
          derived from the token. When I swapped the palette, some of them
          weren&rsquo;t:
        </p>
        <pre className={pre}>
          {`vitals      #2d8f66  ->  #7b68ce   green in the data, purple in the token
learn       #718d2d  ->  #218c62
nba         #be5d68  ->  #937322
calendar    #9f7d27  ->  #218c6a
zeroproof   #6451ba  ->  #7b6bc4   2.89:1 on the dark surface
mind-reader #7c4fa3  ->  #9065b5   2.95:1 on the dark surface`}
        </pre>
        <p className="mt-3 text-muted">
          The hub card painted its dot from the data and its tint from the
          token, so the drift was visible as two colours on one card, and I
          still hadn&rsquo;t seen it. The dot reads the token now, and a test
          checks every feature&rsquo;s hue against its token and its contrast
          against both themes, so the next palette swap fails a build instead of
          waiting for me to notice.
        </p>

        <h3 className={beat}>
          Asking for less motion made every page mount twice
        </h3>
        <p className="text-muted">
          The route template picked its wrapper from a preference the server
          can&rsquo;t see:
        </p>
        <pre className={pre}>
          {`if (reduced) return <>{children}</>;

return (
  <m.div initial={isFirstLoad ? false : { opacity: 0 }} ...>`}
        </pre>
        <p className="mt-3 text-muted">
          The flag only turns on after hydration. Swapping the element above
          the page at that moment makes React throw the page away and mount it
          again, so for visitors who asked for less motion every effect ran
          twice and every first-load fetch went out twice. I had marked this one{" "}
          <em>reasoned</em> in the audit. The test I wrote first counted two
          mounts, which turned it from a guess into a bug. The wrapper now
          stays put and reduced motion just skips the fade.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The rest live with the features they broke
        </h2>
        <p className="text-muted">
          A bug in the calendar belongs on the calendar&rsquo;s page, where
          someone reading about the calendar will find it. Each of these is a
          dated update there:
        </p>
        <ul className="mt-3 space-y-1.5 text-muted">
          <li>
            <Link href="/thoughts/operator-dashboard" className={linkClass}>
              Operator Dashboard
            </Link>{" "}
            &mdash; rejected writes reported as successes, and a resume that
            forgot the restock on any network blip.
          </li>
          <li>
            <Link href="/thoughts/calendar" className={linkClass}>
              Calendar
            </Link>{" "}
            &mdash; card saves that failed silently, an e2e test writing to my
            real calendar, and a status check that called an outage a
            disconnect.
          </li>
          <li>
            <Link href="/thoughts/playoffs" className={linkClass}>
              Playoffs
            </Link>{" "}
            &mdash; an auto-save that could only ever report success.
          </li>
          <li>
            <Link href="/thoughts/zeroproof" className={linkClass}>
              ZeroProof
            </Link>{" "}
            &mdash; a 401 on every signed-out visit, under a comment saying it
            didn&rsquo;t happen.
          </li>
          <li>
            <Link href="/thoughts/fantasy-tcg" className={linkClass}>
              Fantasy TCG
            </Link>{" "}
            &mdash; packs drawn from a pool you weren&rsquo;t looking at.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Thirteen fixes, one stack, each failing first
        </h2>
        <p className="text-muted">
          Every fix started as a test that failed against the code as it was,
          committed and pushed on its own before the fix. For bugs whose whole
          character was looking fine, that first red run was the point: it is
          the only evidence that the bug was real and not something I talked
          myself into while reading.
        </p>
        <p className="mt-3 text-muted">
          They went out as stacked pull requests, one bug each, in audit order,
          each with its own patch version. Thirteen small diffs were easy to
          review. One diff touching thirteen features wouldn&rsquo;t have been,
          and a revert of one fix would have taken the other twelve with it.
        </p>
        <p className="mt-3 text-muted">
          Two of the fixes turned up worse bugs underneath. Making the calendar
          say when a card failed to save showed that on a new event every card
          had <em>always</em> failed, because the cards went to an id the
          modal made up. And the operator&rsquo;s resume fix showed that the
          saved counts were also being dropped on the floor. Reading found the
          first bug in each case. Only writing the test found the second.
        </p>
      </section>

      <Update
        id="update-2026-11-19-second-pass"
        date="November 19, 2026"
        title="Reading the fixes back found the same bug one level up"
      >
        <p>
          A day after the stack went up I reviewed the fixes as if someone
          else had written them, one bug shape at a time, and checked
          whether each shape still lived anywhere else. It did, in seven
          places, and they went out as seven more stacked PRs, each failing
          first like the originals.
        </p>

        <h3 className={beat}>
          The fallback I was going to delete was holding something up
        </h3>
        <p>
          The flags console showed the built-in demo flags whenever the flags
          API didn&rsquo;t answer, with nothing to say so. The BFF knew which
          one it had, and the route threw that away:
        </p>
        <pre className={pre}>
          {`const { flags, environments } = await loadFleet();
return NextResponse.json({ flags, environments });`}
        </pre>
        <p>
          My notes said to throw instead of falling back. That would have
          been wrong: the server-side gate for the Pocket page reads through
          the same <C>loadFleet</C>, and it is supposed to keep working when
          the API is asleep. So the fallback stays, the route passes{" "}
          <C>source</C> along, and the console says when it&rsquo;s showing
          demo data. The operator reads had the opposite problem. A real
          restock session isn&rsquo;t in the seed, so a 500 came back as
          &ldquo;not found&rdquo; and the resume hook forgot the session. Now
          only the API saying 404 means gone.
        </p>

        <h3 className={beat}>A test I wrote was pinning the bug</h3>
        <p>
          The Pokémon set page caught every SDK error and called{" "}
          <C>notFound()</C>, so a tcgdex outage told everyone a real set
          didn&rsquo;t exist, and a day&rsquo;s revalidate could keep it that
          way. The test guarding the 404 was this:
        </p>
        <pre className={pre}>
          {`it("still 404s a set that genuinely is not there", async () => {
  setGet.mockRejectedValue(new Error("upstream 404"));`}
        </pre>
        <p>
          The SDK resolves <C>null</C> for an unknown id and only throws when
          tcgdex fails, so that test mocked an outage and called it a missing
          set. It passed because the bug was there. It mocks <C>null</C> now,
          and a second test says an outage is an error, not a 404.
        </p>

        <h3 className={beat}>
          Eleven copies of &ldquo;who&rsquo;s signed in&rdquo;, and one fed
          the rest a wrong answer
        </h3>
        <p>
          Eleven components ran their own query on the shared <C>me</C> key.
          The hub on <C>/discover</C> seeded it from the server:
        </p>
        <pre className={pre}>
          {`type MeData = { name: string | null; email: string | null };
// ...
const meQuery = useQuery({
  queryKey: queryKeys.me(),
  // ...
  initialData: initialMe,
  staleTime: 5 * 60_000,
});`}
        </pre>
        <p>
          No <C>sub</C> in it, and every gated page checks <C>sub</C>. Open
          one from the hub and the cache said signed out for five minutes.
          There&rsquo;s one <C>useMe</C> hook now, a failed check throws
          instead of caching &ldquo;signed out&rdquo;, and the hubs keep
          their server value to themselves. With one hook it was easy to
          find the panels that asked for my walls, my leagues and my picks on
          every signed-out visit, for answers that could only be 401.
        </p>

        <h3 className={beat}>
          Two rules for which season it is, and in November they disagree
        </h3>
        <pre className={pre}>
          {`// Before September → the season that started last fall
return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();

const CURRENT_YEAR = new Date().getFullYear();`}
        </pre>
        <p>
          The first is the playoffs routes (and <C>getMonth()</C> is
          zero-based, so 9 is October, not September). The second is the
          fantasy pages, which spent every October to December opening on
          last season. Both use <C>currentNbaSeason()</C> now.
        </p>

        <h3 className={beat}>A green e2e run that never touched the calendar</h3>
        <pre className={pre}>
          {`} else {
  console.warn(
    \`[E2E] Could not create test calendar: \${res.status()} \${await res.text()}\`,
  );
}`}
        </pre>
        <p>
          If setup couldn&rsquo;t make the test calendar, the calendar specs
          found no id and skipped themselves. I had fixed the guards inside
          those tests already. This one sat a level up, in setup, so it
          survived. It throws now.
        </p>
        <p>
          The rest were smaller: the root layout still set{" "}
          <C>openGraph.url</C> (the canonical bug again, in a different
          field), a count-up that froze on its first number and swapped
          elements for reduced motion (the remount bug again, in a smaller
          place), and a <C>Textarea</C> wrapper that drew a label pointing at
          an id nothing had.
        </p>
      </Update>

      <Update
        id="update-2026-11-20-api-half"
        date="November 20, 2026"
        title="The API had its own list, and the worst of it was quiet"
      >
        <p>
          The audit covered portfolio_api too. Its bugs went out as eight
          stacked PRs on the API, each starting from a failing test like the
          ones here. Most of them shared a shape with this side: something
          failed, and the code was written so that nobody would hear about it.
        </p>

        <h3 className={beat}>
          Calendar sync had been off since July, and nothing said so
        </h3>
        <pre className={pre}>
          {`const service = new CalendarService();

if (this.google && calendar.syncMode === 'two_way') {`}
        </pre>
        <p>
          When the calendar module moved to TypeScript, the controller built
          its service without the Google helpers, so <C>this.google</C> was
          always null. Connecting a calendar to Google returned a 500, and
          every event push was skipped by a guard that read like
          &ldquo;this calendar isn&rsquo;t two-way&rdquo;. The helpers are a
          required constructor argument now, so the service can&rsquo;t be
          built without them and the guard only means what it says.
        </p>

        <h3 className={beat}>
          Twenty-six database tests had never run in CI
        </h3>
        <pre className={pre}>
          {`describe.skipIf(!DATABASE_URL)('vitals version SQL against a real database', () => {

  test:
    steps:
      - run: pnpm install --frozen-lockfile
      - run: pnpm run test`}
        </pre>
        <p>
          The SQL smoke tests skip without a database, and the test job never
          had one, so every CI run reported them as skipped and the check
          stayed green. They had only ever run on a laptop that happened to
          have a <C>DATABASE_URL</C>. The job gets its own throwaway Postgres
          now, and tests that write rows also need a separate flag, because a
          laptop&rsquo;s <C>DATABASE_URL</C> often points at production.
        </p>

        <h3 className={beat}>
          The comment said two bets couldn&rsquo;t spend the same cents.
          Nothing stopped them.
        </h3>
        <pre className={pre}>
          {` * The available-balance floor is checked here, against the live
 * derived balance, so two concurrent bets can't both spend the same cents.
 */
export async function placeBet(input: PlaceBetInput): Promise<PlaceBetResult> {
  return db.transaction(async (tx) => {
    const entries = await tx.select(...).from(zeroproofLedgerEntries)`}
        </pre>
        <p>
          A transaction at read committed doesn&rsquo;t serialise two
          requests reading the same ledger. Both see the same balance, both
          pass the check, both insert. The wallet row is locked with{" "}
          <C>FOR UPDATE</C> first now. Settling and refunding had the
          matching problem the other way round: neither checked that the bet
          was still open, so a retried or overlapping settle run paid out
          twice. Both only update open bets now. What I haven&rsquo;t done
          yet is look at the production ledger for a payout that already
          landed twice, and until I do I can&rsquo;t say the bug never cost
          anyone anything.
        </p>

        <h3 className={beat}>
          Anyone could finish someone else&rsquo;s Google sign-in
        </h3>
        <pre className={pre}>
          {`export function buildState(userId: string, origin: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, origin })).toString('base64url');`}
        </pre>
        <p>
          The OAuth state named the user and never expired, and the callback
          stored the Google tokens under whoever the state named. So I could
          start a connect, send someone the link, and their Google calendar
          would land on my account. The state expires now, and the callback
          sends the person back to this site to confirm the connection as
          themselves before anything is saved, which is the confirm step in
          #704. That one had to deploy before the API side or connecting
          would have stopped working altogether.
        </p>

        <h3 className={beat}>A cast hid a field that was never there</h3>
        <pre className={pre}>
          {`const userId = (req as any).auth.sub as string;`}
        </pre>
        <p>
          The JWT middleware puts claims on <C>req.auth.payload</C>, so the
          medical journal&rsquo;s <C>userId</C> had always been undefined,
          and the <C>any</C> made sure the compiler couldn&rsquo;t say so.
          Every controller read the caller through the same cast, 73 times.
          They go through one typed helper now, and a wrong claim path is a
          type error.
        </p>
        <p>
          The rest were smaller: malformed JSON, a non-uuid id and a duplicate
          key all answered 500 instead of 4xx; two anonymous write endpoints
          had no rate limit; clearing the F1 cache only needed an account;
          and the calendar&rsquo;s own database connection skipped
          certificate checks that the shared one does.
        </p>

        <h3 className={beat}>
          I put a real database in CI and thought that closed the gap. It
          covered the files that asked for one.
        </h3>
        <p>
          The day the stack merged, creating a calendar on production said it
          had failed when it hadn&rsquo;t. The write answered without a{" "}
          <C>role</C>, the browser&rsquo;s schema rejected that, and the toast
          showed the raw validation error. Fixing that (portfolio_api#288 and
          #715 here), I found the card update next to it:
        </p>
        <pre className={pre}>
          {`UPDATE event_cards ec SET quantity = $1, notes = $2 ...

Error: Expected 5 bindings, saw 0`}
        </pre>
        <p>
          Knex binds <C>?</C>, not <C>$1</C>, so every edit to a card on a
          calendar event had been a 500. Neither bug was the kind the
          database job catches. Nothing checked the API&rsquo;s write
          responses against the schema the browser validates them with, and
          the calendar repository tests mock knex, which will take SQL that
          knex itself refuses. The database job only runs tests that ask for
          a database, and these didn&rsquo;t.
          The card fix (portfolio_api#289) compiles the statement with the
          real knex in its test, which is enough to catch this without a
          database.
        </p>
      </Update>

      <Update
        id="update-2026-11-22-one-way-in"
        date="November 22, 2026"
        title="The redesign started with the failures nobody could read"
      >
        <p>
          The redesign half of the audit went out as seven stacked PRs, #724
          to #730, each about one domain. Most of them were the same complaint
          from the bug list, one level further up: the code knew what had gone
          wrong and threw that away before anyone saw it.
        </p>

        <h3 className={beat}>
          Every failure said &ldquo;Failed to&rdquo;, and the server had
          already said why
        </h3>
        <pre className={pre}>
          {`if (!res.ok) throw new Error("Failed to create event");`}
        </pre>
        <p>
          The calendar client had ten of these, the calendar hooks another
          nine, and the budget, practice, gallery and ZeroProof clients each
          had their own version. The API answers a failed write with{" "}
          <C>{`{ error: "..." }`}</C>, so the reason was sitting in the body
          and every toast showed the fixed string instead. There is one{" "}
          <C>responseError</C> now that reads the server&rsquo;s reason and
          keeps the status, plus a <C>requestJson</C> for the clients that
          were each wrapping <C>fetch</C> the same way. A test scans the
          browser code for anyone parsing an error body by hand again.
        </p>
        <p>
          I nearly took the status off the pack bar&rsquo;s message while
          moving it over. Its test wanted <C>reason (503)</C>, and it was
          right: a 503 and a 409 send the same words and need different
          things from me when someone reports them.
        </p>

        <h3 className={beat}>
          The rate-limit tests checked a function the proxy never called
        </h3>
        <pre className={pre}>
          {`for (const rule of RATE_LIMITS) {
  if (!rule.match(pathname, request.method)) continue;`}
        </pre>
        <p>
          The rules had their own tests, run against <C>matchRateLimit</C>.
          The proxy ran its own copy of that loop, so those tests could pass
          while the proxy matched something else. The proxy calls{" "}
          <C>matchRateLimit</C> now, and the new test floods{" "}
          <C>proxy()</C> itself. ZeroProof telemetry also had a second
          limiter inside its route, counting batches the proxy had already
          counted. It&rsquo;s a rule in the table now.
        </p>

        <h3 className={beat}>
          &ldquo;Try again&rdquo; cleared the error and showed the same
          failure
        </h3>
        <pre className={pre}>
          {`this.reset = ()=>{ this.setState({ error: null }); },
this.retry = ()=>{ startTransition(()=>{ this.context?.refresh(); this.reset(); }); };`}
        </pre>
        <p>
          That&rsquo;s Next 16.3&rsquo;s error boundary. All thirty of my
          route boundaries passed <C>reset</C> to the shared error screen,
          which re-renders the payload that just failed. Most of my pages fail
          because an upstream API was down, which is exactly what the
          screen&rsquo;s copy says, and the button couldn&rsquo;t do anything
          about it short of a reload. They pass <C>retry</C> now. There was
          also no root boundary, so a write-up that crashed got the
          framework&rsquo;s bare screen. It has one, plus a{" "}
          <C>global-error.tsx</C> for the root layout.
        </p>

        <h3 className={beat}>
          Two copies of the same proxy had already drifted apart
        </h3>
        <p>
          The test that failed first, with the backend mocked to answer a save
          with 204:
        </p>
        <pre className={pre}>
          {`[practice PUT] backend unavailable: TypeError: Response constructor: Invalid response status code 204`}
        </pre>
        <p>
          Budget and practice each had a hand-copied catch-all proxy. The
          budget copy had learned that a 204 can&rsquo;t carry a body. The
          practice copy hadn&rsquo;t, so the first 204 would have come back as
          a 502. It also dropped the query string. Neither had happened yet:
          the practice API always answers with JSON and the page never sends a
          query. And neither copy capped the body it forwarded. Two copies is
          normally where I wait for a third before sharing anything, but these
          had already disagreed, and the next change would have landed in one
          and not the other. They share <C>signedInCatchAll</C> now. Budget
          keeps the same 64 KB cap as the other write routes, and practice
          takes up to 100 KB like the backend does, because importing every
          problem reviewed in both modes comes to about 69 KB.
        </p>

        <h3 className={beat}>
          robots.txt and the admin check each kept their own copy of a list
        </h3>
        <pre className={pre}>
          {`disallow: ["/api/", "/dev/", "/settings", "/calendar", "/auth/"],

allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,`}
        </pre>
        <p>
          robots.txt kept its own list of private pages, which had fallen
          behind the proxy&rsquo;s list. It reads the proxy&rsquo;s list now.
          The admin check was spelled out in ten places, and is one{" "}
          <C>isSiteAdmin</C> now. And a dead-code pass took out a streaming
          hook, a stats helper and some props that no caller used.
        </p>
      </Update>

      <Update
        id="update-2026-11-22-second-stack"
        date="November 22, 2026"
        title="The number that couldn't go stale, and the thirty files I fixed and then deleted"
      >
        <p>
          The second stack ran from #732 to #746, still one domain per PR. The
          small ones went quickly. The NFL pages default to the kickoff
          season, and one ESPN league form serves both pages that had a copy.
          Reduced motion reads from one hook now, every palette command is
          either a link or an action, and a copy button says so when the
          clipboard refuses. The ones worth writing down are where I found
          the code had been quietly lying, and one where I was the one who
          was wrong.
        </p>

        <h3 className={beat}>
          The landing said 3,499 tests, and the comment said that couldn&rsquo;t
          go stale
        </h3>
        <pre className={pre}>
          {`// AUTO-GENERATED by scripts/count-tests.mjs — do not edit by hand.
// Regenerated on every build via the \`prebuild\` script.
export const UNIT_TEST_COUNT = 3432;
export const E2E_TEST_COUNT = 67;
export const TEST_COUNT = 3499;`}
        </pre>
        <p>
          The repo has over 6,400. The counter was wired up as a{" "}
          <C>prebuild</C> script, and pnpm doesn&rsquo;t run pre and post
          hooks unless you turn them on, so <C>pnpm build</C> went straight
          to <C>next build</C> and every deploy shipped whatever number was
          last committed. The stats strip&rsquo;s own doc comment promised it
          couldn&rsquo;t go stale, and I believed it, because the script was
          right there and the hook name looked right. The counter runs inside{" "}
          <C>build</C> now, and a test fails if it ever moves back into a
          hook.
        </p>

        <h3 className={beat}>
          I fixed thirty error boundaries, then deleted twenty-eight of them
        </h3>
        <pre className={pre}>
          {`expect(layoutBetween(dir, enclosingBoundary(dir))).toBe(true);
// 28 failed. lab/particles and zeroproof passed.`}
        </pre>
        <p>
          The first stack switched all thirty route boundaries from{" "}
          <C>reset</C> to <C>retry</C> and added a root one. That was the
          moment the thirty stopped mattering. A boundary renders inside every
          layout above it, so a nested copy only changes what anyone sees when
          a layout sits between it and the next boundary out. Twenty-eight of
          them had none and were byte-identical to the root. They were left
          over from a test that required one per feature, written back when
          there was no root to fall through to. I spent a PR making them
          consistent before asking whether they needed to exist. The guard
          now asks that question instead.
        </p>

        <h3 className={beat}>
          A write that timed out was treated like the API being down
        </h3>
        <pre className={pre}>
          {`export class OperatorWriteTimeoutError extends Error {
  constructor(readonly path: string) {
    super(\`operator write \${path} got no answer in \${UPSTREAM_TIMEOUT_MS} ms\`);
    this.name = "OperatorWriteTimeoutError";
  }
}`}
        </pre>
        <p>
          The operator writes had no deadline, and when one failed the BFF fell
          back to the seed. For a read that&rsquo;s fine. A write that got no
          answer may well have applied upstream, so replaying it against the
          seed reported a success that wasn&rsquo;t one. Writes time out on
          their own error now, and the route tells the dashboard to reload
          rather than try again. The same PRs keep the server&rsquo;s reason
          on a refused write, and report it once. Each tab had its own error
          toast on top of the app-wide one, so a single failure showed up
          twice.
        </p>

        <h3 className={beat}>
          The NBA pages guessed the response shape, and a wrong guess looked
          like an empty league
        </h3>
        <pre className={pre}>
          {`const list: Team[] = json.data?.data ?? json.data ?? [];`}
        </pre>
        <p>
          The API wraps teams one level deeper than a roster, and both pages
          covered that with a chain of fallbacks. Any other shape, including
          an error body, became an empty team picker with nothing to say what
          went wrong. One pair of queries parses exactly what the API sends,
          and anything else is an error the page can show.
        </p>

        <h3 className={beat}>
          The proxy set its security header by hand on seven exits
        </h3>
        <pre className={pre}>
          {`res.headers.set("Content-Security-Policy", CSP);   // x7
if (isSessionTimeout(false, marker)) {               // always false`}
        </pre>
        <p>
          Nothing was missing yet. But an eighth exit would have needed
          someone to remember, and nothing would have noticed if they forgot.
          Every pass-through goes through <C>withCsp</C> or{" "}
          <C>rollSession</C> now, and a test pins what every exit carries
          before the refactor touched anything. The parameter that was always{" "}
          <C>false</C> is gone.
        </p>

        <h3 className={beat}>Two tests that passed whatever the code did</h3>
        <pre className={pre}>
          {`expect(
  !needsEntry || shipped.has(version),
  \`\${version} is a minor/major release but has no UPDATE_ENTRIES entry — add one to entries.data.ts\`,
).toBe(true); // true on every patch`}
        </pre>
        <p>
          The feed guard only checked anything on an X.Y.0 version, so for
          every patch in between it was a pass. It checks the release the
          current line started from now. The keyboard guard counted how many
          demos used the shared hook instead of asking whether each stepped
          demo did. I made sure both can fail by breaking the code they
          watch, which is the step I skipped the first time around.
        </p>
        <p>
          Partway through, I also took the landing&rsquo;s project shelf out
          of the sideways scroll and gave each project its own row. That
          story is on the{" "}
          <Link href="/thoughts/v5-redesign" className={linkClass}>
            v5 redesign write-up
          </Link>
          , where the shelf was first written up.
        </p>
      </Update>

      <Update
        id="update-2026-11-22-third-stack"
        date="November 22, 2026"
        title="Finishing the leftovers, and the two PRs the full suite caught me breaking"
      >
        <p>
          The third stack picked up what the first two left: ZeroProof write
          bodies checked before they leave the site (#756), the rest of the
          proxy cleanup (#757), registries that had drifted from what they
          describe (#758), and four small sharing passes, covering the external
          link check, the theme key and a few timers, the 3D models&rsquo;
          motion hook, and the ESPN readers (#759 to #762). I re-read each audit
          item against the current code before starting it, and some of them
          turned out smaller than the audit said, or wrong.
        </p>

        <h3 className={beat}>
          A shared bracket called itself private whenever the backend was down
        </h3>
        <pre className={pre}>
          {`if (!res.ok) {
  return NextResponse.json({ picks: null }, { status: 404 });
}
// ...
} catch {
  return NextResponse.json({ picks: null }, { status: 404 });
}

// and on the page, for any error at all:
This bracket isn’t publicly available yet.`}
        </pre>
        <p>
          The public picks route turned every upstream failure into a 404, and
          the view showed one fixed sentence for any error, so an outage read
          as someone keeping their bracket to themselves. Only a real 404
          means missing now. Anything else is a 502 with{" "}
          <C>Couldn&rsquo;t load these picks right now</C>, and the view shows
          whatever reason it was given. It&rsquo;s the same bug as the
          empty-state ones from the first pass, just on a page I hadn&rsquo;t
          looked at.
        </p>

        <h3 className={beat}>
          I ran each PR&rsquo;s own tests, and the full suite found two PRs I
          had broken further down
        </h3>
        <pre className={pre}>
          {`FAIL src/app/api/authedProxyRoutes.test.ts > POST /api/zeroproof/wallets
  > sends an empty object, not a crash, when the body isn't JSON
FAIL src/app/api/routePathSegments.test.ts
  > 'POST zeroproof/leagues/:id/espn-leagu…' rejects \`..\` with a 400
FAIL src/app/design-system/catalog.test.ts
  > never claims 'not adopted here' for a component the app already imports
AssertionError: expected [ 'timeline' ] to deeply equal []`}
        </pre>
        <p>
          While building each PR I ran the tests for the folders it touched.
          That felt thorough and wasn&rsquo;t. The body checks in #756 made two
          older tests wrong: one still expected a non-JSON body to reach the
          API as <C>{"{}"}</C>, and the other sent a body the new schema
          rejected before the path check it was meant to test ever ran. The
          experience timeline in #755 used the design system&rsquo;s Timeline,
          and the catalog still said nothing on the site imported it. None of
          those tests sit near the code that broke them, which is the whole
          point of having them. I fixed each on the branch that broke it and
          carried the fix up the stack. Now every PR gets a full run before
          its body is written.
        </p>

        <h3 className={beat}>
          Four write-ups had timelines that stopped partway down the page
        </h3>
        <pre className={pre}>
          {`× 'deployment' lists every update it has, and only those
× 'tcg' lists every update it has, and only those
× 'vitals' lists every update it has, and only those
× 'work-portfolio' lists every update it has, and only those`}
        </pre>
        <p>
          The audit named one: the TCG timeline listed one of its four
          updates. A fix for that page alone would have left the other three,
          so the test reads every write-up with a timeline and compares it to
          the update anchors in that folder, both ways. Vitals was missing
          three of six. The work portfolio was also out of order.
        </p>

        <h3 className={beat}>
          The hub&rsquo;s updates card is still typed out, and that&rsquo;s the
          fix
        </h3>
        <p>
          The card showed three entries from version 5. The obvious fix is to
          read the newest entries from the feed, but the feed is a 75 KB file
          and the card lives in a client module that most of the hub imports,
          so the whole changelog would ship with it. The three rows stay
          written by hand, and a test fails when a new entry lands and the
          card falls behind. Budget had the same kind of gap: its colour token
          existed and nothing mapped the card to it.
        </p>

        <h3 className={beat}>
          Some of the audit was wrong, and I left those alone
        </h3>
        <p>
          It flagged three hand-written <C>Request failed</C> errors in
          ZeroProof. All three feed an error box with fixed copy, so the
          message never reaches the screen, and changing them would change
          nothing. The leaderboard and vitals catches looked redundant around a
          fetch that never throws, but they still catch a non-JSON body. The
          two ESPN roster schemas looked like copies, but one requires a field
          the other treats as optional. Merging them would quietly change what
          one of the readers accepts.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "An audit that only listed problems, with the bugs in their own table, so fixing them couldn't quietly turn into the redesign.",
          "All thirteen bugs fixed as stacked pull requests, each starting from a test that failed against the old code.",
          "Guards that keep the cross-cutting ones fixed: a route scan for encodeURIComponent path ids, a hue and contrast check on every feature colour, a mount count under reduced motion, and canonical URLs checked on rendered pages.",
          "A second pass over the fixes, which found seven more of the same shapes one level up: fallbacks that hid which data was showing, failures shown as empty states, eleven session queries, two season rules, a setup step that skipped instead of failing, an inherited og:url and a count-up that froze.",
          "The API half: calendar sync wired back up, the database tests running in CI, bets that can't overdraw or pay twice, a Google connect bound to the person finishing it, typed reads of the signed-in user, 4xx for caller mistakes, and card updates that bind.",
          "The first redesign stack: one way to read a failed response in the browser, one rate-limit table the proxy actually uses, a Try again that refetches, root error boundaries, one signed-in catch-all proxy with a body cap, robots.txt and the admin check reading the lists they used to copy, and a dead-code pass.",
          "The second stack: a test count that regenerates on every build, three error boundaries where thirty-one said the same thing, write timeouts that never replay against the seed, NBA queries that parse what the API sends, a proxy whose exits share two helpers, and guards that can fail.",
          "The third stack: ZeroProof write bodies checked before they leave the site, a shared bracket that says when the backend is down, one optional-token lookup, timelines checked against their updates, a hub card that keeps up with the feed, and shared helpers for links, the theme key, timers, motion and ESPN reads.",
        ]}
        couldImprove={[
          "The calendar events GET logs the backend's reason and answers with a generic one, while the PUT routes forward it. I haven't decided which of the two is right for a read.",
          "Screenshots of the visible fixes (the card colours, the bracket's failed-save alert) still need capturing.",
          "The calendar repository tests still mock knex. Only the card update compiles its SQL for real, so the next raw statement there can make the same mistake.",
          "I haven't checked the production ledger for a bet that was paid twice before settling checked the bet was still open.",
        ]}
        upcoming={[
          "The rest of the redesign: the hub archive's colour and preview tables brought up to date from the feature manifest, ZeroProofContent split by tab around one query module, and the operator resources each defined once instead of across six folders.",
        ]}
      />
    </ThoughtLayout>
  );
}
