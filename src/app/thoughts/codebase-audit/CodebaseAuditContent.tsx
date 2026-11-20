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

      <WhatsNext
        nowShipped={[
          "An audit that only listed problems, with the bugs in their own table, so fixing them couldn't quietly turn into the redesign.",
          "All thirteen bugs fixed as stacked pull requests, each starting from a test that failed against the old code.",
          "Guards that keep the cross-cutting ones fixed: a route scan for encodeURIComponent path ids, a hue and contrast check on every feature colour, a mount count under reduced motion, and canonical URLs checked on rendered pages.",
          "A second pass over the fixes, which found seven more of the same shapes one level up: fallbacks that hid which data was showing, failures shown as empty states, eleven session queries, two season rules, a setup step that skipped instead of failing, an inherited og:url and a count-up that froze.",
        ]}
        couldImprove={[
          "The bugs share a cause the fixes don't remove: every client fetch decides on its own what a failure means. useMe settles it for the session, but everything else is still patched where it was found, so the next feature can make the same mistake.",
          "Screenshots of the visible fixes (the card colours, the bracket's failed-save alert) still need capturing.",
        ]}
        upcoming={[
          "The redesign half of the audit, starting with one way to talk to portfolio_api: a single proxy helper on the server and a single request helper in the browser, so a non-ok response is handled once instead of in every queryFn.",
        ]}
      />
    </ThoughtLayout>
  );
}
