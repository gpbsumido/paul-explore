import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

/** Inline monospace token, matches the code styling used across thoughts pages. */
function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
      {children}
    </code>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
      {children}
    </pre>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function SiteRedesignContent() {
  return (
    <ThoughtLayout
      breadcrumb="Site redesign"
      title="One mockup, the whole site"
      intro={
        <>
          I drew a new home page as a single HTML mockup: a split hero with a
          TypeScript object in an editor panel, a short list of four apps in
          grayscale, a timeline, and a header that floats once you scroll. Then
          I wanted every other page to look like it came from the same place.
          That second half turned out to be smaller than I expected, because
          most of it had been done months ago without my noticing.
        </>
      }
    >
      <Section title="The colours were already right, so this was a chrome job">
        <p className="text-muted">
          I built the mockup from my design-system tokens, and when I diffed its
          custom properties against the package they were the same values the
          site already serves. Pages here have used <C>bg-background</C>,{" "}
          <C>text-muted</C> and <C>border-border</C> for a long time, roughly ten
          thousand of them. So recolouring seventy routes was never the job. The
          difference between the mockup and an interior page was four shared
          pieces: <C>PageHeader</C>, the backdrop behind <C>PageShell</C>,{" "}
          <C>PageIntro</C>, and the base heading rule. I changed those and left
          the pages alone.
        </p>
      </Section>

      <Section title="The mockup had two headers. The site gets one.">
        <p className="text-muted">
          In the mockup the floating pill is a second copy of the nav that
          fades in while the first fades out, with <C>inert</C> on whichever one
          is hidden. That&apos;s fine for a single page and wrong for a shared
          component: two navs in the tree, two sets of links for a screen reader
          to skip. Instead the one header element carries a{" "}
          <C>data-floating</C> attribute, and the inner row turns into the pill
          when it flips. The pill sits inside the same 56px box the bar always
          had, so the sticky sub-bars pinned at <C>top-14</C> on a dozen pages
          don&apos;t move by a pixel.
        </p>
        <Pre>
          {`group-data-[floating=true]/header:my-1.5
group-data-[floating=true]/header:min-h-11   // 6 + 44 + 6 = 56
group-data-[floating=true]/header:max-w-3xl
group-data-[floating=true]/header:bg-surface/80`}
        </Pre>
        <p className="mt-3 text-muted">
          The only client code is a passive scroll listener that sets state when
          the page crosses 24px, so a long scroll re-renders the header twice,
          not every frame. About fifty pages start their breadcrumb at{" "}
          <C>/</C>, and that crumb now renders the paul—explore wordmark. That
          one change put the brand on every one of them.
        </p>
      </Section>

      <Section title="A grid that loops because it's one cell too big">
        <p className="text-muted">
          The old backdrop was a dotted grid and two blurred aurora blobs. The
          new one is a 56px line grid with a 224px grid over it, fading into the
          page colour toward the edges. It&apos;s oversized by 112px on every
          side and translates by exactly one cell, so the loop has no seam. It
          only drifts under <C>prefers-reduced-motion: no-preference</C>, and a
          guard test reads the stylesheet to make sure the animation never
          shows up outside that block. Twenty-seven pages pass their own feature
          colour to the backdrop. Rather than touch all of them, I kept the two
          colour props and turned them into a faint, still tint in two corners.
        </p>
      </Section>

      <Section title="I copied the cyan straight from the design system, and the build said no">
        <p className="text-muted">
          The mockup&apos;s second accent was cyan, and I&apos;d asked for it:
          more blues next to the greens. The design system ships a cyan ramp, so
          I referenced it by token and assumed that made it on-palette. The
          palette sweep disagreed.
        </p>
        <Pre>
          {`FAIL  src/lib/paletteSweep.test.ts > live surfaces carry the palette
      > uses no stock Tailwind colour utilities
+   "src/app/v7/v7.module.css:10 --cyan: var(--paul-color-cyan-700);",
+   "src/app/v7/v7.module.css:18 --cyan: var(--paul-color-cyan-400);",
+   "src/components/AmbientBackground.tsx:28 colorB = \\"var(--paul-color-cyan-500)\\","`}
        </Pre>
        <p className="mt-3 text-muted">
          It looked like a false positive at first, since the value came from my
          own package. It wasn&apos;t. The package&apos;s cyan is Tailwind&apos;s
          cyan byte for byte. The sweep exists because the site spent a whole
          release getting off the stock palette, and a token that wraps a stock
          colour is still the stock colour. I kept the guard and moved the cool
          accent onto deeper and lighter steps of verdigris. The page has less
          blue than the mockup. Getting the blue back properly means giving the
          design system a cyan of its own, not making an exception here.
        </p>
      </Section>

      <Section title="The second guard caught a matchMedia I shouldn't have written">
        <p className="text-muted">
          The proof headline cycles its last word: details, tests,
          accessibility. I wrote it with a direct{" "}
          <C>window.matchMedia(&quot;(prefers-reduced-motion: reduce)&quot;)</C>{" "}
          check, which is exactly what this codebase decided to stop doing. The
          motion preference has one source, a hook built on{" "}
          <C>useSyncExternalStore</C> so the server and the hydrating client
          agree. The guard named the file and I moved it onto the hook. Screen
          readers get the first word once in a hidden span, and the cycling copy
          is hidden from them, so the heading doesn&apos;t re-announce itself
          every two seconds.
        </p>
      </Section>

      <Section title="Nothing on the page is typed in that the build could compute">
        <p className="text-muted">
          The editor panel says <C>testsWrittenFirst: 6_414</C>, and that number
          is the generated test count printed as a numeric literal. The stack
          marquee reads each package&apos;s version from <C>package.json</C>, so
          upgrading Next changes the page. The figures are array lengths and
          the timeline is the same résumé data the last landing used. The
          mockup had all of these typed in by hand, and every one of them would
          have gone stale.
        </p>
      </Section>

      <Section title="What I left alone on purpose">
        <p className="text-muted">
          The 3D world, the surprise page and the archived landings keep their
          own look. The first two are scenes rather than pages, and the archive
          exists to show what each generation looked like. Pages that hand-roll
          their own title instead of using <C>PageIntro</C> pick up the header,
          the grid and the heading face, but keep their old eyebrow. Moving them
          over is one page at a time, and it belongs in its own change.
        </p>
      </Section>

      <WhatsNext
        upcoming={[
          "Give the design system a cyan that isn't Tailwind's, then bring the mockup's blue accent back.",
          "Move the pages that still hand-roll their titles onto PageIntro.",
          "Watch INP on /vitals for a week to confirm the scroll listener and the grid drift cost nothing measurable.",
        ]}
      />
    </ThoughtLayout>
  );
}
