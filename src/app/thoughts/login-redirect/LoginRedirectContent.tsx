"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

export default function LoginRedirectContent() {
  return (
    <ThoughtLayout
      breadcrumb="Login Redirect"
      title="Landing back where I logged in from"
      intro={
        <>
          Two small things about the Auth0 flow had been quietly wrong. Logging
          in from anywhere dumped me on the home page instead of the route I
          started on, and declining the consent screen threw a bare 500 instead
          of letting me back into the app. Both turned out to be one-line
          defaults in the SDK that I&rsquo;d never overridden, and both were
          fixable at a single choke point rather than across every login link.
        </>
      }
      chat={
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 9:12 AM</Timestamp>

              <Received pos="first">
                log in from the calendar and it sends you to the landing page
              </Received>
              <Received pos="last">every route does it</Received>

              <Sent pos="first">
                because every log in link is a bare /auth/login. no returnTo, so
                the SDK defaults the post-login redirect to /
              </Sent>
              <Sent pos="last">
                there are like ten of those links. i don&apos;t want to edit all
                of them
              </Sent>

              <Timestamp>9:15 AM</Timestamp>

              <Received>where do they all pass through</Received>

              <Sent pos="first">
                the proxy already intercepts /auth/*. so i fill the returnTo in
                there, from the same-origin Referer, before handing off to Auth0
              </Sent>
              <Sent pos="last">
                one fix at the choke point. every current link gets it, and so
                does any link i add later
              </Sent>

              <Timestamp>9:19 AM</Timestamp>

              <Received>and the deny thing</Received>

              <Sent pos="first">
                if you hit Deny on the consent screen the callback comes back
                with error=access_denied, and the SDK&apos;s default onCallback
                just returns a 500 with the message
              </Sent>
              <Sent pos="middle">
                so i wrote my own onCallback. catch that one case, redirect back
                to the page you came from with ?authError=permissions
              </Sent>
              <Sent pos="last">
                a little toast reads that flag and says you can&apos;t log in
                without granting permissions. every other error keeps the 500 so
                real misconfig still shows
              </Sent>

              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">The two bugs</h2>
        <p className="text-muted">
          The site has login links everywhere — the header menu, the landing
          hero and footer, the v2/v3/v4 hubs, the flags console. Every one of
          them points at a bare{" "}
          <code className={code}>/auth/login</code>. That works, but{" "}
          <code className={code}>@auth0/nextjs-auth0</code> defaults the
          post-login redirect to <code className={code}>/</code> when no{" "}
          <code className={code}>returnTo</code> is given. So no matter where I
          signed in from, I&rsquo;d land on the home page and have to navigate
          back.
        </p>
        <p className="mt-3 text-muted">
          The second one was worse. Declining the Auth0 consent screen sends the
          callback back with <code className={code}>error=access_denied</code>,
          and the SDK&rsquo;s <code className={code}>defaultOnCallback</code>{" "}
          answers any callback error with{" "}
          <code className={code}>
            new NextResponse(error.message, &#123; status: 500 &#125;)
          </code>
          . A bare 500 page, no way back into the app.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Fix at the choke point</h2>
        <p className="text-muted">
          I could have added a <code className={code}>returnTo</code> to all ten
          links, but that&rsquo;s ten edits and it wouldn&rsquo;t cover the
          eleventh link I add next month. Every login request already funnels
          through the <code className={code}>/auth/*</code> branch of{" "}
          <code className={code}>src/proxy.ts</code>, which is where the SDK
          middleware gets called. So that&rsquo;s where I fill in the missing{" "}
          <code className={code}>returnTo</code>: when{" "}
          <code className={code}>/auth/login</code> arrives with none, I derive
          one from the request&rsquo;s <code className={code}>Referer</code> —
          the page you were on when you clicked — and redirect once with it set.
        </p>
        <p className="mt-3 text-muted">
          The Referer is only trusted when it&rsquo;s same-origin, so a spoofed
          header can&rsquo;t turn login into an open redirect. Auth referers are
          dropped so login never loops back into itself, and the bare root is
          dropped because that&rsquo;s the SDK default anyway. The logic lives in
          a pure <code className={code}>loginReturnToFromReferer</code> helper so
          it can be unit tested without dragging{" "}
          <code className={code}>next/server</code> and the whole Auth0 client
          into the test.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">A callback that fails softly</h2>
        <p className="text-muted">
          For the deny case I supplied my own{" "}
          <code className={code}>onCallback</code> on the{" "}
          <code className={code}>Auth0Client</code>. When Auth0 hands it an
          error, I check whether it&rsquo;s the user declining consent — an{" "}
          <code className={code}>AuthorizationError</code> whose cause carries
          the <code className={code}>access_denied</code> code — and if so
          redirect back to <code className={code}>ctx.returnTo</code> (the page
          they started on, the same value the login fix captured) with{" "}
          <code className={code}>?authError=permissions</code> appended.
        </p>
        <p className="mt-3 text-muted">
          I deliberately kept the change narrow. Only{" "}
          <code className={code}>access_denied</code> gets the friendly bounce;
          every other error still returns the original 500 so a real misconfig
          or network failure stays loud and debuggable instead of being papered
          over with a generic toast.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The toast</h2>
        <p className="text-muted">
          A small client component,{" "}
          <code className={code}>AuthErrorToast</code>, is mounted once in the
          root layout. It reads{" "}
          <code className={code}>?authError=permissions</code> from the URL and
          shows a dismissible toast:{" "}
          <em>You can&rsquo;t log in without granting permissions.</em> It&rsquo;s
          a <code className={code}>role=&quot;alert&quot;</code> with an assertive
          live region so a screen reader announces it, it auto-dismisses after a
          few seconds, and it respects{" "}
          <code className={code}>prefers-reduced-motion</code>.
        </p>
        <p className="mt-3 text-muted">
          Dismissing is local state, not a URL rewrite — the same call I made
          with the résumé&rsquo;s interview notice. Rewriting the URL to strip
          the flag would break the back button, and leaving it there costs
          nothing but a lingering query param. I didn&rsquo;t reuse the operator
          toast provider either; it&rsquo;s mounted per-page, so wiring it in
          app-wide would double-render its notifications on the operator screens.
          A self-contained toast keeps the two apart.
        </p>
      </section>
    </ThoughtLayout>
  );
}
