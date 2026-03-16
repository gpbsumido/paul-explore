"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function RoutingContent() {
  return (
    <div className="min-h-dvh bg-background">
      <nav
        className="sticky top-0 z-20 h-14 border-b border-border"
        style={{
          background: "color-mix(in srgb, var(--color-background) 80%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto flex h-full max-w-3xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden="true">
              <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Hub
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Route Restructure
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <header className="mb-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50">
            Dev notes
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Route Restructure
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Moving the authenticated hub from <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code> to{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/</code>, eliminating the redirect, and promoting sub-routes to top-level paths.
          </p>
        </header>

        <div className="space-y-10 text-[15px] leading-relaxed text-foreground">

          <section>
            <h2 className="mb-3 text-lg font-bold">Why this change</h2>
            <p className="text-muted">
              The original routing pattern had a problem: logged-in users who navigated to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/</code> were immediately redirected to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code> by the middleware. This meant the URL in the browser always reflected an implementation detail, not a meaningful destination. The hub at <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code> was just an awkward artifact of how auth-gating was wired up, not a real route users would want to bookmark or share.
            </p>
            <p className="mt-3 text-muted">
              The fix is straightforward: make <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/</code> context-aware. Unauthenticated visitors see the landing page. Logged-in users see the hub. Same URL, different content. Vitals and settings move to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/vitals</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/settings</code> — paths that actually describe what they are.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">The force-static trade-off</h2>
            <p className="text-muted">
              The previous setup worked because <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/page.tsx</code> had <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">export const dynamic = "force-static"</code>. The landing page was baked into the CDN at build time and the middleware handled the redirect for authenticated users. No auth call touched the page component itself.
            </p>
            <p className="mt-3 text-muted">
              Once the root page needs to branch on authentication, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">force-static</code> is gone. The page becomes a dynamic server component that calls <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.getSession()</code> on every request.
            </p>
            <p className="mt-3 text-muted">
              In practice this trade-off is negligible. <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.getSession()</code> does not make a network call — it decrypts the session cookie locally using the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">AUTH0_SECRET</code> key. The cost is a few microseconds of CPU work. The hub content is still fetched client-side via TanStack Query exactly as before. For a personal portfolio, clean URLs are worth more than static generation on the root route.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Security model</h2>
            <p className="text-muted">
              The middleware still enforces auth — it just protects different paths now. <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/vitals</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/settings</code> get the same treatment <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code> did: unauthenticated requests redirect to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/auth/login?returnTo={"{pathname}"}</code> before any page code runs. Authenticated requests go through <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.middleware()</code> for rolling session refresh. CSP headers are applied on every response, same as before.
            </p>
            <p className="mt-3 text-muted">
              The root <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/</code> route is not middleware-gated because it intentionally renders for both states. There is nothing sensitive in the landing page for unauthenticated users and the hub content only renders after the server confirms a valid session. An unauthenticated request can never reach the hub code path.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">What changed in the code</h2>
            <ul className="mt-2 space-y-2 text-muted">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                <span><code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">src/proxy.ts</code> — removed the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/</code> redirect block and the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code> protection block, added equivalent protection for <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/vitals</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/settings</code></span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                <span><code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">src/app/page.tsx</code> — converted from a static export to an async server component; now calls <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.getSession()</code> and renders either <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">LandingContent</code> or <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">FeatureHub</code></span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                <span>9 files moved: <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">FeatureHub.tsx</code>, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">vitals/*</code>, and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">settings/*</code> from the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">protected/</code> folder to their new top-level locations</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                <span>22 files updated: all back-to-hub links changed from <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">href="/protected"</code> to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">href="/"</code> across feature pages and thoughts pages</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                <span><code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">src/types/protected.ts</code> renamed to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">src/types/hub.ts</code></span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">One external dependency</h2>
            <p className="text-muted">
              The Express backend constructs the Google Calendar OAuth callback URL as <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">{"{origin}"}/protected/settings?gcal=connected</code>. After this migration the correct path is <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">{"{origin}"}/settings?gcal=connected</code>. Until the backend is updated, the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">?gcal=connected</code> success banner won't fire after connecting Google Calendar — but the middleware will catch the old URL gracefully. Deploy order: frontend first, then backend.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
