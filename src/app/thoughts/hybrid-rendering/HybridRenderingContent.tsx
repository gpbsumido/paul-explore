"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";

/** Inline code, matching the muted-mono treatment the other write-ups use. */
const C = ({ children }: { children: React.ReactNode }) => (
  <code className="font-mono text-foreground/70">{children}</code>
);

/** The hybrid SSR/prerender pass on the angular-paul desktop clone. */
export default function HybridRenderingContent() {
  return (
    <ThoughtLayout
      breadcrumb="Hybrid Rendering"
      title="Hybrid Rendering"
      intro={
        <>
          The angular-paul desktop clone had a working SSR server that rendered
          nothing. Every route was set to client-only, so a crawler hitting{" "}
          <C>/thoughts/signals</C> got an empty <C>&lt;app-root&gt;</C> and the
          one genuinely shareable thing in the app &mdash; the written content
          &mdash; was invisible. This is the pass that gave each route the
          render mode it actually needs: the Thoughts pages prerender to static
          HTML at build time, and the interactive shell stays client-rendered.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">The gap I was closing</h2>
        <p className="text-muted">
          The app already had an SSR server standing up &mdash; Angular&rsquo;s
          server build, the whole hydration pipeline, all of it. But every entry
          in the server route config was <C>RenderMode.Client</C>, which tells
          the server to ship the shell and defer everything to the browser. So
          the SSR server was doing real work to render&hellip; a blank app root.
          I only noticed how bad it was when I ran <C>curl</C> against a Thoughts
          URL and got back markup with no essay in it. Nothing to index, nothing
          in a link preview, nothing for anyone who reads before JavaScript runs.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Per-route render modes, not one global switch
        </h2>
        <p className="text-muted">
          The easy overcorrection is to flip the whole app to SSR and call it
          fixed. That&rsquo;s wrong here. The desktop shell &mdash; the windows,
          the dock, the menu bar, the drag state &mdash; is deeply interactive
          and inherently client-side; server-rendering it buys nothing and
          invites hydration mismatches. The Thoughts content is the opposite:
          static prose that never changes between requests and is the entire
          reason SEO matters. So the right unit of decision is the route, not
          the app.
        </p>
        <p className="mt-3 text-muted">
          I gave <C>/thoughts</C> and <C>/thoughts/:slug</C>{" "}
          <C>RenderMode.Prerender</C>, and left the catch-all <C>**</C> desktop
          route on <C>RenderMode.Client</C>. For the parameterised route I added
          a <C>getPrerenderParams()</C> that enumerates every slug straight from
          the <C>THOUGHTS</C> data, so the build emits one static HTML file per
          thought &mdash; and adding a thought later automatically adds its
          prerendered page, with nothing to remember.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The head is where SEO actually lives
        </h2>
        <p className="text-muted">
          Prerendering the body is only half of it. A crawler wants a real{" "}
          <C>&lt;title&gt;</C>, a description, Open Graph and Twitter card tags,
          a canonical link, and structured data &mdash; all present in the
          server HTML before any script runs. I pulled that into a{" "}
          <C>SeoService</C> that writes per-page title, description, keywords, OG
          and Twitter meta, the canonical <C>&lt;link&gt;</C>, and a JSON-LD{" "}
          <C>BlogPosting</C> block, all through Angular&rsquo;s <C>Title</C>,{" "}
          <C>Meta</C>, and <C>DOCUMENT</C> so it renders on the server rather
          than being patched in on the client. One service, called per page,
          instead of head tags scattered across templates.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Hydration bugs the shell had been hiding
        </h2>
        <p className="text-muted">
          The moment the shell actually server-renders, latent hydration
          problems surface. Two showed up. The clock ran a{" "}
          <C>setInterval</C> unconditionally, which doesn&rsquo;t belong on the
          server &mdash; I guarded it with <C>isPlatformBrowser</C> so the timer
          only starts in the browser. And the menu bar&rsquo;s markup diverged
          between the server pass and the first client render, so I put{" "}
          <C>ngSkipHydration</C> on it: an honest acknowledgement that it&rsquo;s
          a client-owned island, rather than fighting to make its server output
          match. Both are the kind of thing you only find once real SSR is
          switched on.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          What shipped, and how it&rsquo;s verified
        </h2>
        <p className="text-muted">
          I wrote this the TDD way &mdash; 8 new specs first, failing, covering
          the <C>SeoService</C> output, the prerender route config and its
          param enumeration, and the component wiring &mdash; then made them
          green. The full suite is at 266 passing and lint is clean. The
          measurable proof is in the build itself: <C>ng build</C> reports{" "}
          <em className="text-foreground/80">Prerendered 20 static routes</em>,
          and <C>dist/&hellip;/thoughts/signals/index.html</C> contains the
          essay body, a real <C>&lt;title&gt;</C>, the <C>og:</C> tags, the
          canonical URL, and the <C>application/ld+json</C> block &mdash; all
          before a line of JavaScript executes. I grepped the built HTML
          directly to confirm it, rather than trusting the build log. Version
          went 1.1.0 &rarr; 1.2.0 with a changelog entry, and the render-mode
          strategy itself is now one of the prerendered thought pages.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">One thing to watch</h2>
        <p className="text-muted">
          The build emits a soft budget warning &mdash; the initial bundle is
          416.97 kB against a 400 kB warn threshold, still under the 500 kB hard
          error. The long thought bodies are the weight, and the obvious
          follow-up is to move them into a lazily loaded data chunk so the
          eager bundle stops carrying prose it doesn&rsquo;t need on first paint.
          Not urgent, but it&rsquo;s the first place a real budget problem would
          show up.
        </p>
      </section>
    </ThoughtLayout>
  );
}
