"use client";

import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";

/** Inline code chip, matching the rest of the write-ups. */
const C = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
    {children}
  </code>
);

/** A small colored label for a trade-off line. */
function Tag({ kind }: { kind: "keep" | "cut" | "gain" }) {
  const map = {
    keep: "text-amber-700 dark:text-amber-400",
    cut: "text-rose-700 dark:text-rose-400",
    gain: "text-emerald-700 dark:text-emerald-400",
  };
  const label = { keep: "Guardrail", cut: "Problem", gain: "Gain" };
  return <span className={`font-semibold ${map[kind]}`}>{label[kind]}:</span>;
}

/** A numbered step in the plan with a one-line "why now". */
function Step({
  id,
  title,
  status,
  children,
}: {
  id: string;
  title: string;
  status: "shipped" | "next" | "later" | "no";
  children: React.ReactNode;
}) {
  const badge = {
    shipped: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    next: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    later: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    no: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };
  const badgeLabel = {
    shipped: "Shipped",
    next: "Next",
    later: "Later",
    no: "Won't do",
  };
  return (
    <section className="scroll-mt-20" id={id}>
      <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-foreground">
        <span className="font-mono text-[13px] text-muted">{id}</span>
        {title}
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${badge[status]}`}
        >
          {badgeLabel[status]}
        </span>
      </h3>
      <div className="space-y-2 text-muted">{children}</div>
    </section>
  );
}

/** The refactor roadmap that follows the whole-project review. */
export default function RefactorPassContent() {
  return (
    <ThoughtLayout
      breadcrumb="Refactor Pass"
      title="A maintainability refactor pass"
      intro={
        <>
          The{" "}
          <Link
            href="/thoughts/project-review"
            className="text-foreground underline decoration-muted underline-offset-2"
          >
            whole-project review
          </Link>{" "}
          told me where the code was weak. This is the plan for fixing it
          &mdash; what I&rsquo;m deduping against abstractions that already
          exist, what I&rsquo;m deliberately leaving alone so I don&rsquo;t
          overfit, and the order I&rsquo;m shipping it in. The goal is a
          codebase that&rsquo;s easier for the next engineer and cheaper for an
          AI to work in, without a rewrite.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">The verdict first</h2>
        <p className="text-muted">
          The bones are good. The <C>lib/</C> domain layer, the <C>hooks/</C>{" "}
          data layer, the shared <C>ui/</C> primitives, the BFF/auth boundary,
          the pure command-palette and world and flags cores, and the context
          docs are all things I&rsquo;m happy to point at. So this isn&rsquo;t a
          rewrite &mdash; the problems are localised{" "}
          <span className="font-semibold text-foreground">
            duplication and inconsistency
          </span>
          . Good abstractions already exist (<C>site.ts</C>, <C>threads.tsx</C>,{" "}
          <C>backendFetch.ts</C>, <C>usePersistentState</C>); they just
          aren&rsquo;t applied everywhere, and a few files grew into
          content-as-code blobs.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The guardrails I gave myself</h2>
        <ul className="space-y-2 text-muted">
          <li>
            <Tag kind="keep" /> Dedup <span className="italic">against</span> an
            abstraction that already exists, or extract into the layer that
            already owns the concept. No new &ldquo;mechanisms.&rdquo;
          </li>
          <li>
            <Tag kind="keep" /> A helper has to serve its call sites{" "}
            <span className="italic">as they already differ</span> &mdash; not
            force them to converge. Where two things are only{" "}
            <span className="italic">conceptually</span> alike, they stay
            separate.
          </li>
          <li>
            <Tag kind="keep" /> New logic lands in <C>src/lib</C> or{" "}
            <C>src/hooks</C> so the coverage gate enforces it and the failing
            test is cheap. Every change is a small PR into <C>develop</C>, test
            first, suite green.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">The plan, in order</h2>
        <div className="space-y-7">
          <Step
            id="1"
            title="One builder for every write-up's social metadata"
            status="shipped"
          >
            <p>
              All 50 <C>thoughts/*</C> and 14 <C>learn/*</C> pages hand-wrote
              the same ~25-line <C>Metadata</C> block &mdash; openGraph and
              twitter copy-pasted per page. There&rsquo;s now a{" "}
              <C>
                buildArticleMetadata(&#123; title, description, path, ogType
                &#125;)
              </C>{" "}
              helper next to the existing <C>SITE_URL</C>/<C>OG_IMAGE</C> in{" "}
              <C>lib/site.ts</C>, and the pages call it.
            </p>
            <p>
              <Tag kind="gain" /> Net <C>&minus;737</C> lines across 65 files,
              and an OG-convention change is now one edit instead of 65.
            </p>
            <p>
              <Tag kind="keep" /> It deliberately doesn&rsquo;t pull the
              description from the hub&rsquo;s <C>THOUGHTS</C> registry &mdash;
              that stores the shorter card <C>preview</C>, not the SEO
              description, and coupling them would have silently changed the
              meta text. The <C>world</C> write-up keeps its hand-written block
              because its social copy intentionally differs; <C>routing</C>,
              which had no og tags at all, gained them. I used{" "}
              <C>satisfies Metadata</C> instead of a return annotation so the
              concrete shape stays readable in the test &mdash; no type
              assertion.
            </p>
          </Step>

          <Step
            id="2"
            title="A leaf module for the backend URL"
            status="shipped"
          >
            <p>
              The fallback{" "}
              <C>
                process.env.NEXT_PUBLIC_API_URL ??
                &quot;http://localhost:3001&quot;
              </C>{" "}
              is re-declared in 19 files even though <C>backendFetch.ts</C>{" "}
              already exports <C>API_URL</C>. The fix isn&rsquo;t just to import
              it everywhere: <C>backendFetch.ts</C> also imports <C>auth0</C>{" "}
              and <C>next/server</C>, so pulling <C>API_URL</C> into client
              modules (<C>flags-client</C>, <C>referrals</C>, the vitals and
              calendar pages) would drag server-only code into client bundles.
            </p>
            <p>
              <Tag kind="gain" /> Extract the constant to a dependency-free{" "}
              <C>lib/apiUrl.ts</C>; <C>backendFetch</C> re-exports it so nothing
              breaks. Fixes a latent bundling smell, not just the copy-paste.
            </p>
          </Step>

          <Step
            id="3"
            title="A ChatThread shell, and move the chat CSS to where it belongs"
            status="shipped"
          >
            <p>
              The iMessage &ldquo;phone&rdquo; shell &mdash; the same three-div{" "}
              <C>flex justify-center</C> &rarr; <C>.phone</C> &rarr;{" "}
              <C>.chat</C> wrapper &mdash; is duplicated in 36 write-ups. Worse,
              its stylesheet lives inside <span className="italic">one</span>{" "}
              feature&rsquo;s folder (<C>thoughts/styling/styling.module.css</C>
              ) but is imported by 40 unrelated pages.
            </p>
            <p>
              <Tag kind="gain" /> Add a <C>ChatThread</C> component to{" "}
              <C>lib/threads.tsx</C> (which already owns <C>Sent</C>/
              <C>Received</C>/<C>Timestamp</C>), migrate the 36 pages, then move
              the CSS to a neutral home &mdash; a one-line import change once
              nothing else references it, instead of a 40-file rename.
            </p>
            <p>
              <Tag kind="keep" /> The ordering was the whole trick: extract the
              component first so pages stop referencing the module directly,{" "}
              <span className="italic">then</span> move the file. The{" "}
              <Link
                href="/thoughts/styling"
                className="text-foreground underline decoration-muted underline-offset-2"
              >
                styling write-up
              </Link>{" "}
              &mdash; whose folder used to hold that stylesheet &mdash; has the
              full story.
            </p>
          </Step>

          <Step
            id="4"
            title="A factory for the operator data hooks"
            status="shipped"
          >
            <p>
              Five hooks (<C>useOperatorSales</C>/<C>Stores</C>/<C>Inventory</C>
              /<C>Activity</C>/<C>Planogram</C>) repeat the same
              fetch&rarr;check&rarr;<C>schema.parse</C>&rarr;poll shape. A
              generic <C>useOperatorResource</C> collapses them; each existing
              hook becomes an ~8-line adapter that keeps its current return
              shape, so no call site changes.
            </p>
            <p>
              <Tag kind="keep" /> The polling tiers are intentional, so they
              stay as explicit per-hook config, and the response field is a{" "}
              <C>select</C> function rather than a magic string &mdash; an
              odd-shaped endpoint shouldn&rsquo;t break the abstraction. The
              tradeoff: a slightly longer call site per hook, bought in exchange
              for the tiers staying visible. The{" "}
              <Link
                href="/thoughts/operator-dashboard"
                className="text-foreground underline decoration-muted underline-offset-2"
              >
                operator dashboard write-up
              </Link>{" "}
              carries the update in full &mdash; that&rsquo;s also where the
              5,120-line split landed.
            </p>
          </Step>

          <Step
            id="5"
            title="Converge the API-route error handling"
            status="shipped"
          >
            <p>
              Three styles coexisted: the clean <C>withOperatorErrors</C>{" "}
              wrapper, the calendar routes&rsquo; <C>withBackend</C> +{" "}
              <C>upstreamErrorResponse</C>, and ~35 bare hand-rolled{" "}
              <C>try/catch</C> blocks across NBA, TCG, google and vitals.
            </p>
            <p>
              <Tag kind="gain" /> The two families that genuinely shared a shape
              collapsed onto one helper each: the NBA routes onto a{" "}
              <C>proxyUpstream</C> (public GET → JSON, beside{" "}
              <C>fetchUpstream</C>
              ), and the TCG list routes onto a <C>serveTcg</C> (in a
              server-only module so the client bundle stays clean &mdash; the{" "}
              <Link
                href="/thoughts/tcg"
                className="text-foreground underline decoration-muted underline-offset-2"
              >
                TCG write-up
              </Link>{" "}
              has that update). Each swap is behind characterisation tests
              written against the old routes that still pass.
            </p>
            <p>
              <Tag kind="keep" /> No uber-wrapper, and I stopped there on
              purpose. The vitals and google routes are authenticated with
              bespoke shaping (a beacon POST, parallel fetches, field
              defaulting) &mdash; the &ldquo;genuinely unique, keep the{" "}
              <C>try/catch</C>&rdquo; case. And the <C>localStorage</C>-vs-
              <C>usePersistentState</C> item turned out to be a documented
              no-op: the hook is already used everywhere it fits, and the rest
              deliberately use custom serialisation or read-after-mount for
              hydration, so forcing them through it would reset saved
              preferences or break hydration.
            </p>
          </Step>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">
          What I&rsquo;m deliberately not doing
        </h2>
        <div className="space-y-7">
          <Step
            id="N1"
            title="Merging the learn and thoughts article scaffolds"
            status="no"
          >
            <p>
              <C>ThoughtLayout</C> (summary/chat toggle, &ldquo;Dev notes&rdquo;
              eyebrow) and the <C>learn</C> pages&rsquo; <C>PageHeader</C> +
              section-nav pattern are only conceptually similar &mdash;
              different navigation model, voice, and theming. Fusing them into
              one component with a dozen mode flags is the textbook overfit this
              whole review exists to avoid. Step 1 already unified the part
              that&rsquo;s genuinely identical: the metadata.
            </p>
          </Step>
          <Step
            id="N2"
            title="Splitting the giant content files"
            status="shipped"
          >
            <p>
              <C>OperatorDashboardContent.tsx</C> was 5,120 lines &mdash; the
              biggest file in the repo. I split the worst offender into a
              32-line orchestrator plus five section components (the chat, the
              timeline/overview, the build write-up, and the dated updates in
              two halves), cut only at <C>&lt;section&gt;</C> boundaries so the
              prose is byte-identical. Its exhaustive test suite &mdash; 72
              assertions on exact text, section order, and every anchor &mdash;
              passes unchanged, which is the proof nothing moved.
            </p>
            <p>
              <Tag kind="keep" /> The remaining 1,000&ndash;2,000-line write-ups
              are the same job and can follow one file per PR, but they&rsquo;re
              deliberately not batched into this sweep &mdash; it&rsquo;s
              review-churn with no behaviour change, best scheduled on its own.
            </p>
          </Step>
          <Step id="N3" title="Touching the v1–v4 landing history" status="no">
            <p>
              The four landing versions look like duplication but are the point
              &mdash; a redesign history behind a <C>?version=</C> registry.
              That&rsquo;s a feature, not debt.
            </p>
          </Step>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          How I&rsquo;m keeping it honest
        </h2>
        <p className="text-muted">
          Every step is test-first and small enough to review in one sitting.
          The logic-bearing steps (the metadata builder, the <C>apiUrl</C>{" "}
          module, the <C>ChatThread</C> shell, the operator factory) land in{" "}
          <C>lib</C>/<C>hooks</C>, which the coverage gate already watches; the
          mechanical migrations and the route work lean on behaviour tests,
          since those files sit outside the gate. <C>ts-prune</C> and{" "}
          <C>depcheck</C> both block CI, so a stray export or dependency from an
          extraction can&rsquo;t sneak through. The measure of success is
          boring: fewer lines, the same rendered output, and a shorter path to
          the code the next change needs.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">How it actually shipped</h2>
        <ul className="space-y-2 text-muted">
          <li>
            <span className="font-semibold text-foreground">
              Stacked PRs, not parallel ones.
            </span>{" "}
            Each step bumps the version and the changelog, so independent
            branches off the same base would collide on both files every time.
            Stacking each PR on the previous serialises the bumps and keeps
            every diff minimal &mdash; the cost is that they merge in order
            rather than any order, which is the right trade for a clean history.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Characterisation tests before behaviour-preserving swaps.
            </span>{" "}
            For the route work and the file split there was no new behaviour to
            drive out with a red test, so I pinned the <em>existing</em>{" "}
            behaviour first &mdash; the NBA and TCG route contracts, the
            operator page&rsquo;s 72 content-and-order assertions &mdash; ran
            them green against the old code, then refactored and watched them
            stay green. A test that passed before and after is the proof nothing
            moved.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              <C>satisfies</C>, not a cast.
            </span>{" "}
            The metadata builder returns a value typed with{" "}
            <C>satisfies Metadata</C> instead of an annotation, so the concrete
            shape stays readable in the test without ever reaching for a type
            assertion &mdash; the house rule is no assertions without a reason,
            and there wasn&rsquo;t one.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              A green suite that wasn&rsquo;t.
            </span>{" "}
            Four tests were failing the whole time on <C>@paul-portfolio/*</C>{" "}
            version drift &mdash; not my changes, just a local{" "}
            <C>node_modules</C> that never got reinstalled. A{" "}
            <C>pnpm install</C> cleared it; worth writing down because &ldquo;it
            was already red&rdquo; is easy to say and easy to be wrong about.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Related write-ups</h2>
        <p className="text-muted">
          Where a single feature was touched, its own dev-notes page carries the
          update, and links back here:
        </p>
        <ul className="mt-2 space-y-1.5 text-muted">
          <li>
            <Link
              href="/thoughts/project-review"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Project Review
            </Link>{" "}
            &mdash; the diagnosis this plan answers.
          </li>
          <li>
            <Link
              href="/thoughts/operator-dashboard"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Operator Dashboard
            </Link>{" "}
            &mdash; the five read hooks factored through one resource hook, and
            the 5,120-line write-up split into sections.
          </li>
          <li>
            <Link
              href="/thoughts/tcg"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              TCG Browser
            </Link>{" "}
            &mdash; the list routes converged on <C>serveTcg</C>, the detail
            routes deliberately left alone.
          </li>
          <li>
            <Link
              href="/thoughts/styling"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Styling Decisions
            </Link>{" "}
            &mdash; the shared chat stylesheet moved out of that feature&rsquo;s
            folder to a neutral home.
          </li>
        </ul>
      </section>
    </ThoughtLayout>
  );
}
