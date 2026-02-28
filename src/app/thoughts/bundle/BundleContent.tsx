"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

export default function BundleContent() {
  return (
    <div className={styles.phone}>
      {/* ---- Top bar ---- */}
      <div className={styles.topBar}>
        <Link href="/protected" className={styles.backLink}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;Back
        </Link>
        <div className={styles.contactInfo}>
          <span className={styles.contactName}>Bundle Analysis</span>
          <span className={styles.contactSub}>iMessage</span>
        </div>
        <div className={styles.themeBtn}>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Chat ---- */}
      <div className={styles.chat}>
        <Timestamp>Today 10:00 AM</Timestamp>

        <Received pos="first">what&apos;s the bundle analyzer thing</Received>
        <Received pos="last">when would you even need it</Received>

        <Sent pos="first">
          it&apos;s a tool that shows you exactly what&apos;s in your JavaScript
          bundle as a treemap — each rectangle is a module, sized by how many
          bytes it contributes. you run it once after a build and it opens an
          HTML report in your browser
        </Sent>
        <Sent pos="last">
          you need it when you suspect the bundle is larger than it should be
          but you don&apos;t know why. &quot;large bundle&quot; is vague —
          the analyzer tells you which specific package is the culprit and
          roughly how much it&apos;s adding
        </Sent>

        <Received>how do you set it up</Received>

        <Sent pos="first">
          install <code>@next/bundle-analyzer</code>, then wrap the Next config
          with it:
        </Sent>

        <div className={styles.codeBubble}>
          {`// next.config.ts
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);`}
        </div>

        <Sent pos="first">
          then add a script alias in package.json:
        </Sent>

        <div className={styles.codeBubble}>
          {`"analyze": "ANALYZE=true next build --webpack"`}
        </div>

        <Sent pos="last">
          the <code>--webpack</code> flag is required. Next.js 16 uses
          Turbopack by default for builds, and the analyzer does not work
          with Turbopack — it throws an error if you omit it
        </Sent>

        <Timestamp>10:07 AM</Timestamp>

        <Received>what did you find when you ran it</Received>

        <Sent pos="first">
          three things came up. the first was a huge chunk labeled{" "}
          <code>proxy.js</code> in the edge bundle. the second was
          Auth0-related packages taking up a lot of the client bundle — jose,
          oauth4webapi, openid-client, swr. the third was{" "}
          <code>date-fns</code> showing as 24 modules
        </Sent>
        <Sent pos="last">
          only one of those was actually a problem
        </Sent>

        <Received>which one</Received>

        <Sent pos="first">
          the Auth0 chunk. the other two were expected
        </Sent>
        <Sent pos="middle">
          <code>proxy.js</code> is the Next.js middleware —{" "}
          <code>src/proxy.ts</code> runs in the edge runtime and handles Auth0
          session checks, CSP header generation, and login redirects for every
          request. it&apos;s supposed to be large. you can&apos;t meaningfully
          shrink it because it IS the auth/security layer
        </Sent>
        <Sent pos="last">
          <code>date-fns</code> at 24 modules is correct tree-shaking. every
          import in this codebase is a named function import, so the bundler
          only includes the functions actually used — <code>format</code>,{" "}
          <code>addDays</code>, <code>startOfWeek</code>, etc. 24 is just how
          many of those functions the calendar needs. that&apos;s fine
        </Sent>

        <Timestamp>10:14 AM</Timestamp>

        <Received pos="first">why was Auth0 a problem</Received>
        <Received pos="last">it&apos;s needed for auth right</Received>

        <Sent pos="first">
          the server-side Auth0 package is needed. but the client-side one was
          getting pulled in for the wrong reason
        </Sent>
        <Sent pos="middle">
          the root layout was wrapping the entire app in{" "}
          <code>Auth0Provider</code>. that&apos;s a React context provider that
          puts the logged-in user object into context so any client component
          can call <code>useUser()</code> to read the name and email without
          props
        </Sent>
        <Sent pos="last">
          the problem: <code>useUser</code> was never called anywhere in the
          codebase. not once. the provider was wrapping the whole app and
          pulling in the full Auth0 client SDK for a feature that
          didn&apos;t exist in the UI
        </Sent>

        <div className={styles.codeBubble}>
          {`// what was in layout.tsx
const session = await auth0.getSession();

<Auth0Provider user={session?.user}>
  {children}
</Auth0Provider>

// what useUser() call count was: 0`}
        </div>

        <Received>what packages does Auth0Provider pull in</Received>

        <Sent pos="first">
          <code>jose</code> — JWT parsing and verification. several hundred KB.
          this is the main offender
        </Sent>
        <Sent pos="middle">
          <code>oauth4webapi</code> and <code>openid-client</code> — OAuth 2.0
          and OIDC protocol implementations. these are server-side libraries
          that have no place in a browser bundle
        </Sent>
        <Sent pos="last">
          <code>swr</code> — data fetching library. Auth0Provider uses it
          internally to keep the user session in sync on the client. again,
          never used
        </Sent>

        <Timestamp>10:22 AM</Timestamp>

        <Received>what was the fix</Received>

        <Sent pos="first">
          three lines removed from <code>layout.tsx</code>:
        </Sent>

        <div className={styles.codeBubble}>
          {`// removed
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { auth0 } from "@/lib/auth0";
const session = await auth0.getSession();

// removed from JSX
<Auth0Provider user={session?.user}>
  {children}
</Auth0Provider>

// layout became synchronous — no more async function`}
        </div>

        <Sent pos="last">
          that&apos;s it. all those packages stopped shipping to the browser
          because nothing imported them anymore
        </Sent>

        <Received pos="first">does that break auth</Received>
        <Received pos="last">how does the app still know who&apos;s logged in</Received>

        <Sent pos="first">
          auth was never in the React tree to begin with. the actual protection
          is in the middleware
        </Sent>
        <Sent pos="middle">
          every request hits <code>src/proxy.ts</code> before it reaches any
          page. if the route is not in the public list and there&apos;s no
          session cookie, the middleware redirects to login. the browser never
          sees the protected page at all. that&apos;s server-side, nothing to
          do with React context
        </Sent>
        <Sent pos="last">
          for pages that need the user&apos;s name or email — like the protected
          hub — the server component calls <code>auth0.getSession()</code>{" "}
          directly and passes the data down as props. for API routes, each
          handler calls <code>auth0.getAccessToken()</code> and returns 401 if
          it fails. neither of those needs a client-side provider
        </Sent>

        <div className={styles.codeBubble}>
          {`// middleware gates the page before React runs
if (!isPublic) {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");
}

// server component reads user directly
const session = await auth0.getSession();
const { name, email } = session?.user ?? {};

// API route checks token server-side
const { token } = await auth0.getAccessToken();
// throws if not authenticated -> 401`}
        </div>

        <Timestamp>10:31 AM</Timestamp>

        <Received>so what do you actually lose by removing it</Received>

        <Sent pos="first">
          the ability to call <code>useUser()</code> in a client component to
          get the logged-in user without props. that&apos;s the entire purpose
          of <code>Auth0Provider</code>
        </Sent>
        <Sent pos="middle">
          if you want to show the user&apos;s name in a deeply nested client
          component, you&apos;d need to either pass it down as a prop or put it
          in your own context — a thin wrapper that you control, that only
          carries the fields you actually need
        </Sent>
        <Sent pos="last">
          for this project that tradeoff is obvious. nothing was using{" "}
          <code>useUser()</code>. the cost was real — jose and friends in every
          user&apos;s browser bundle — and the benefit was zero. if{" "}
          <code>useUser()</code> gets added later, you&apos;d add back a minimal
          context with only the user object, not the full Auth0 client SDK
        </Sent>

        <Received>what does this actually look like in the analyzer after</Received>

        <Sent pos="first">
          the client bundle treemap loses the Auth0 cluster entirely. jose,
          oauth4webapi, openid-client, and swr disappear from the client
          report. they&apos;re still present in the node.js server bundle
          because the BFF routes still use them server-side
        </Sent>
        <Sent pos="last">
          the edge bundle is unchanged. <code>proxy.js</code> is still large
          because the middleware still needs <code>auth0.middleware()</code> and{" "}
          <code>auth0.getSession()</code> — that runs at the edge, not in the
          browser
        </Sent>

        <Received>what&apos;s the takeaway</Received>

        <Sent pos="first">
          the bundle analyzer is most useful for finding things that{" "}
          <em>shouldn&apos;t</em> be in a bundle rather than things that are too
          large. a 200kb package is fine if you actually need it. a 50kb
          package is a problem if nothing calls it
        </Sent>
        <Sent pos="middle">
          the pattern to look for is server-only libraries (crypto, JWT
          parsers, database drivers) appearing in the client or edge bundle.
          that usually means something that should only run on the server is
          being imported in a client component or shared module that the client
          also imports
        </Sent>
        <Sent pos="last">
          in this case it was a React provider importing a client SDK that had
          no client-side consumer. a quick grep for <code>useUser</code>{" "}
          confirmed it — zero results, ship the fix
        </Sent>

        {/* Typing indicator */}
        <div className={styles.typingDots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
