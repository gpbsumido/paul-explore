import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { Update, WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

const link =
  "font-medium text-primary-600 hover:underline dark:text-primary-400";

const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

const h3 = "mt-5 mb-2 text-[15px] font-semibold text-foreground";

/** A section with a claim for a heading, the shape every write-up here uses. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-bold text-foreground">{title}</h2>
      <div className="space-y-3 text-muted">{children}</div>
    </section>
  );
}

/**
 * Dev-notes write-up for moving the work portfolio into its own repo and
 * mounting it here at runtime over Module Federation. Summary-only, so it
 * renders as a server component with no layout JS.
 */
export default function MicroFrontendsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Micro-frontends"
      title="Splitting the work portfolio into its own app"
      intro={
        <>
          The{" "}
          <Link href="/work-portfolio" className={link}>
            work portfolio
          </Link>{" "}
          used to be a folder in this repo. Now it lives in{" "}
          <a
            href="https://github.com/gpbsumido/work-portfolio-mfe"
            className={link}
          >
            its own repository
          </a>{" "}
          with its own build, tests and deploy, and this site loads it at
          runtime. I picked it because it is the part of the site that most
          behaves like another team&apos;s product: one public route, no auth,
          content that was already rendered in the browser, and only four
          places where it reached into the rest of the app. Those four places
          turned out to be the whole job.
        </>
      }
    >
      <Section title="The boundary is a package, not a convention">
        <p>
          Everything that crosses between the two apps lives in{" "}
          <code className={code}>@paul-portfolio/work-portfolio-contract</code>
          , and both repos type-check against it. The remote exposes exactly
          one thing:
        </p>
        <pre className={pre}>
          {`export type RemoteModule = {
  contractVersion: number;
  version: string;
  mount(el: HTMLElement, ctx: HostContext): MountHandle;
};`}
        </pre>
        <p>
          That is deliberately not &quot;export a React component&quot;. This
          site hands the remote an element and a context object, and never
          renders the remote&apos;s tree itself. The remote could move off
          React, or an Angular remote could sit next to it, and nothing on
          this side would change. <code className={code}>contractVersion</code>{" "}
          is the handshake: a remote built against a different major gets a
          fallback card instead of a mount, so a breaking change has to ship
          in steps rather than all at once.
        </p>
      </Section>

      <Section title="Next's React is a canary, and that nearly decided the architecture">
        <p>
          Two copies of React on one page is the classic way this goes wrong,
          so the host lends its own as a shared singleton. Before writing any
          of the real thing, I built a throwaway hello-world remote to check
          that would work with Next 16, and the first thing it showed was the
          version string the remote would be negotiating with:
        </p>
        <pre className={pre}>{`19.3.0-canary-cbb046ab-20260731`}</pre>
        <p>
          Next vendors a canary build of React, and a plain{" "}
          <code className={code}>^19</code> range rejects prereleases. The
          remote accepts <code className={code}>^19.0.0-0</code> instead. With
          that, the spike rendered on the host&apos;s React in both{" "}
          <code className={code}>next dev</code> and a production build, and
          the only requests to the remote&apos;s origin were the manifest, its
          entry and the exposed chunk. No React of its own. If that spike had
          failed, the fallback was Next&apos;s multi-zones, which would have
          been a different design entirely.
        </p>
        <p>
          The host side uses only{" "}
          <code className={code}>@module-federation/runtime</code>. Turbopack
          has no Module Federation plugin for the App Router, and it turns out
          the runtime doesn&apos;t need one: it fetches the manifest, loads the
          entry and the chunk, and hands back the module.
        </p>
      </Section>

      <Section title="The host owns the URL and the data. The remote only asks.">
        <p>
          Deep links like <code className={code}>?feature=chart-library</code>{" "}
          used to be read and written by the portfolio itself. Two apps
          writing to one address bar is how you get a back button that does
          nothing, so the remote now gets the starting slug in and reports
          every change out through{" "}
          <code className={code}>onFeatureChange</code>, and only this side
          touches <code className={code}>history</code>. A test in the remote
          fails if it ever calls <code className={code}>replaceState</code>.
        </p>
        <p>
          The same goes for data. The referral demo creates real links against
          my API, but the remote never learns the API&apos;s address. It calls{" "}
          <code className={code}>services.referrals</code>, and the host wires
          that to the client it already had. The contract spells out one
          detail that matters: an API that says no rejects with a readable{" "}
          <code className={code}>Error</code>, and an API that can&apos;t be
          reached rejects with the <code className={code}>TypeError</code>{" "}
          fetch throws. That is how the demo tells &quot;that slug is
          taken&quot; apart from &quot;offline, here is a local preview&quot;.
        </p>
      </Section>

      <Section title="The CSS bug only a real mount could find">
        <p>
          I had a guard for the obvious leak: the build fails if the
          remote&apos;s stylesheet touches <code className={code}>html</code>,{" "}
          <code className={code}>body</code>,{" "}
          <code className={code}>:root</code> or a bare element. It passed.
          Then I mounted the remote in this site for real, and the release
          chip in the page header disappeared.
        </p>
        <h3 className={h3}>Both sides use Tailwind, so both sides ship .hidden.</h3>
        <p>
          The chip is <code className={code}>hidden sm:inline-flex</code>. The
          remote&apos;s stylesheet arrives after this site&apos;s, into the
          same <code className={code}>utilities</code> cascade layer, with its
          own <code className={code}>.hidden</code> at the same specificity.
          Later wins. A class-scoped rule is still global if someone else uses
          the same class name, and in two Tailwind apps everybody does.
        </p>
        <p>
          The fix is a small PostCSS step after Tailwind that confines every
          selector to the remote&apos;s own subtree:
        </p>
        <pre className={pre}>
          {`.hidden{display:none}
  becomes
.hidden:where(.work-portfolio-mfe, .work-portfolio-mfe *){display:none}`}
        </pre>
        <p>
          <code className={code}>:where()</code> adds no specificity, so inside
          the remote the cascade behaves exactly as before, and outside it
          those rules match nothing. The one wrinkle is portals: a modal
          renders into <code className={code}>body</code>, outside the mount
          root, so the remote&apos;s modal wrapper carries the scope class
          too. The build now fails if any rule it ships to the host is
          unscoped.
        </p>
      </Section>

      <Section title="Moving the tests found a test that had never tested anything">
        <p>
          The portfolio&apos;s accessibility test was meant to scan a page
          with a demo open. It set <code className={code}>?feature=</code> in
          the URL and rendered, but the old component applied deep links a
          tick later and the demo itself loaded lazily after that, so axe
          finished scanning before any demo existed. Once the slug became a
          prop and the test waited for the demo, axe found something that had
          been there all along:
        </p>
        <pre className={pre}>
          {`Elements must only use permitted ARIA attributes (aria-prohibited-attr)
  aria-label attribute cannot be used on a div with no valid role attribute.
<div class="min-h-40 flex-1" aria-label="Signups per minute chart">`}
        </pre>
        <p>
          A <code className={code}>role=&quot;img&quot;</code> fixed it. The
          lesson is the uncomfortable one: a green test tells you it ran, not
          what it looked at.
        </p>
      </Section>

      <Section title="Failure stays on the remote's side of the page">
        <p>
          The remote ships on its own schedule, so this side treats everything
          about it as something that can go wrong. The load can fail, it can
          hang, or a new release can speak a contract major this build
          doesn&apos;t know. <code className={code}>RemoteMount</code> turns
          each of those into a fallback card with Retry, after at most eight
          seconds, and the header and everything around it keep working. An
          end-to-end test aborts every request to the remote&apos;s origin and
          checks exactly that, including that nothing was thrown on the page.
        </p>
      </Section>

      <Section title="A strangler, with a flag that fails closed">
        <p>
          Nothing switched over when this merged. A{" "}
          <code className={code}>work-portfolio-remote</code> flag decides per
          visitor, sticky to their bucket, and it starts at zero. It works
          like the flag that gates the TCG Pocket page with one deliberate
          difference: that one fails open, because a config gap should never
          hide a feature that works. This one fails closed, because for a
          migration a missing flag should mean the page everyone already has.
          Rolling back is dialling it down, with no deploy on either side.
        </p>
        <p>
          The cost is that <code className={code}>/work-portfolio</code>{" "}
          renders per request while the flag is deciding. Once the remote is
          at 100% and the in-repo copy is deleted, it goes back to being a
          static shell.
        </p>
      </Section>

      <Section title="The history came with it">
        <p>
          The new repo starts with every commit that ever touched the
          portfolio folder, carried over with{" "}
          <code className={code}>git filter-repo</code>, so blame still goes
          back to the first demo. The trap was in the commit messages: a bare{" "}
          <code className={code}>#123</code> linkifies to whatever PR 123 is
          in the repo it&apos;s read in, which in a new repo would eventually
          be something unrelated. The import rewrote all of them:
        </p>
        <pre className={pre}>
          {`regex:(^|[^\\w/])#(\\d+)==>\\1gpbsumido/paul-explore#\\2`}
        </pre>
      </Section>

      <Update
        id="update-2026-09-30-remote-only"
        date="September 30, 2026"
        title="The flag went to 100%, and the copy it was protecting is gone"
      >
        <p>
          The strangler did its job. <code className={code}>work-portfolio-remote</code>{" "}
          went to 100% in production, the remote served every visitor, and
          this site stopped carrying a second build of the portfolio.
        </p>

        <h3 className={h3}>I checked it from a browser I didn&apos;t own.</h3>
        <p>
          A green deploy says the code is on a server, not that a visitor gets
          it. So a headless browser loaded production cold and reported what it
          saw:
        </p>
        <pre className={pre}>
          {`{
 "chip": "remote v1.0.0",
 "mounted": 1,
 "heading": "Chart Library",
 "urlAfterNext": "https://paulsumido.com/work-portfolio?feature=standard-analytics",
 "fallback": 0,
 "remoteRequests": 17,
 "reactLoadedFrom": ["paulExplore"],
 "errors": []
}`}
        </pre>
        <p>
          One React, from this site. The deep link opened the right demo, the
          host still owned the URL after a click, and nothing threw.
        </p>

        <h3 className={h3}>Deleting it took the wallet stack with it.</h3>
        <p>
          The in-repo demos were the only thing here using wagmi, viem,
          RainbowKit or dnd-kit, so the dead-code check failed the moment they
          went, and those four packages left the lockfile along with a patch
          that only existed for RainbowKit&apos;s QR dependency. The CSP still
          allows WalletConnect, though: the remote&apos;s NFT demo runs inside
          this page, so this page&apos;s policy is the one it has to pass.
        </p>
        <pre className={pre}>
          {`/work-portfolio first-load JS, gzipped
  7.11.3 (gate + in-repo copy):  273.1KB
  remote only:                   258.7KB`}
        </pre>

        <h3 className={h3}>There is no fallback build any more, on purpose.</h3>
        <p>
          The page is a static shell again, and the remote defaults to its
          production deployment, so local dev and CI mount the real thing. The
          catch is the one I signed up for: rolling back is now a Vercel instant
          rollback of the remote, not a flag dialled to zero, and CI&apos;s
          portfolio tests depend on the remote being up.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "The portfolio lives in gpbsumido/work-portfolio-mfe with its history, builds with Rsbuild, and exposes a single framework-agnostic mount() over Module Federation 2.0.",
          "A published contract package: mount types, host services, the catalog schema and a version handshake the host checks before mounting.",
          "The host lends its React as a singleton, owns the URL, and lends the referral client as a service; the remote never learns the API address.",
          "Remote CSS confined to its own subtree, with a build check that fails on any rule shipped to the host that isn't scoped.",
          "RemoteMount's fallback for a failed, slow or incompatible remote, and a header chip naming the release on screen.",
          "A stand-in host in the remote's CI that mounts the built remote over the runtime, so a remote that can't mount fails there instead of here.",
          "The flag reached 100% and the in-repo copy is gone: the page is a static shell that always mounts the remote, the write-up's counts come from the remote's catalog.json, and the wallet stack left this repo with it.",
        ]}
        couldImprove={[
          "The remote renders only in the browser, so the tickers and intro card lost server rendering. The skeleton holds the layout, but it is a real trade.",
          "The remote's CI mounts it in a stand-in host, not this one. A remote PR doesn't yet run this site's end-to-end tests against its preview.",
          "The design system is bundled into the remote rather than shared through federation, so it downloads twice on this page.",
        ]}
        upcoming={[
          "A second remote in Angular, which would prove the mount contract with a genuinely different framework on the other side.",
        ]}
      />
    </ThoughtLayout>
  );
}
