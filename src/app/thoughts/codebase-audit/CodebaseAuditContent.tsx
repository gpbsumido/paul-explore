import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

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

      <WhatsNext
        nowShipped={[
          "An audit that only listed problems, with the bugs in their own table, so fixing them couldn't quietly turn into the redesign.",
          "All thirteen bugs fixed as stacked pull requests, each starting from a test that failed against the old code.",
          "Guards that keep the cross-cutting ones fixed: a route scan for encodeURIComponent path ids, a hue and contrast check on every feature colour, a mount count under reduced motion, and canonical URLs checked on rendered pages.",
        ]}
        couldImprove={[
          "The bugs share a cause the fixes don't remove: every client fetch decides on its own what a failure means. Each of these was patched where it was found, so the next feature can make the same mistake.",
          "Screenshots of the visible fixes (the card colours, the bracket's failed-save alert) still need capturing.",
        ]}
        upcoming={[
          "The redesign half of the audit, starting with one way to talk to portfolio_api: a single proxy helper on the server and a single request helper in the browser, so a non-ok response is handled once instead of in every queryFn.",
        ]}
      />
    </ThoughtLayout>
  );
}
