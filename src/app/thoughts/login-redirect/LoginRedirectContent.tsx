import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import styles from "@/app/thoughts/_shared/chat.module.css";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

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
        <ChatThread>
          <Timestamp>Today 9:12 AM</Timestamp>

          <Received pos="first">
            log in from the calendar and it sends you to the landing page
          </Received>
          <Received pos="last">every route does it</Received>

          <Sent pos="first">
            because every log in link is a bare /auth/login. no returnTo, so the
            SDK defaults the post-login redirect to /
          </Sent>
          <Sent pos="last">
            there are like ten of those links. i don&apos;t want to edit all of
            them
          </Sent>

          <Timestamp>9:15 AM</Timestamp>

          <Received>where do they all pass through</Received>

          <Sent pos="first">
            the proxy already intercepts /auth/*. so i fill the returnTo in
            there, from the same-origin Referer, before handing off to Auth0
          </Sent>
          <Sent pos="last">
            one fix at the choke point. every current link gets it, and so does
            any link i add later
          </Sent>

          <Timestamp>9:19 AM</Timestamp>

          <Received>and the deny thing</Received>

          <Sent pos="first">
            if you hit Deny on the consent screen the callback comes back with
            error=access_denied, and the SDK&apos;s default onCallback just
            returns a 500 with the message
          </Sent>
          <Sent pos="middle">
            so i wrote my own onCallback. catch that one case, redirect back to
            the page you came from with ?authError=permissions
          </Sent>
          <Sent pos="last">
            a little toast reads that flag and says you can&apos;t log in
            without granting permissions. every other error keeps the 500 so
            real misconfig still shows
          </Sent>

          <Timestamp>9:24 AM</Timestamp>

          <Received pos="first">
            one more. after i deny, i click log in again and it goes straight
            back to the permission screen
          </Received>
          <Received pos="last">never asks who&apos;s logging in</Received>

          <Sent pos="first">
            right, because the Auth0 session is still alive. you authenticated,
            you just declined consent, so the next login sees the session and
            skips to consent
          </Sent>
          <Sent pos="last">
            so on deny i set a one-shot cookie, and the proxy adds prompt=login
            to the next /auth/login and clears the cookie. one fresh prompt,
            then back to normal
          </Sent>

          <div className={styles.typingDots}>
            <span />
            <span />
            <span />
          </div>
        </ChatThread>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">The two bugs</h2>
        <p className="text-muted">
          The site has login links everywhere — the header menu, the landing
          hero and footer, the v2/v3/v4 hubs, the flags console. Every one of
          them points at a bare <code className={code}>/auth/login</code>. That
          works, but <code className={code}>@auth0/nextjs-auth0</code> defaults
          the post-login redirect to <code className={code}>/</code> when no{" "}
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
          dropped because that&rsquo;s the SDK default anyway. The logic lives
          in a pure <code className={code}>loginReturnToFromReferer</code>{" "}
          helper so it can be unit tested without dragging{" "}
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
          A small client component, <code className={code}>AuthErrorToast</code>
          , is mounted once in the root layout. It reads{" "}
          <code className={code}>?authError=permissions</code> from the URL and
          shows a dismissible toast:{" "}
          <em>You can&rsquo;t log in without granting permissions.</em>{" "}
          It&rsquo;s a <code className={code}>role=&quot;alert&quot;</code> with
          an assertive live region so a screen reader announces it, it
          auto-dismisses after a few seconds, and it respects{" "}
          <code className={code}>prefers-reduced-motion</code>.
        </p>
        <p className="mt-3 text-muted">
          Dismissing is local state, not a URL rewrite — the same call I made
          with the résumé&rsquo;s interview notice. Rewriting the URL to strip
          the flag would break the back button, and leaving it there costs
          nothing but a lingering query param. I didn&rsquo;t reuse the operator
          toast provider either; it&rsquo;s mounted per-page, so wiring it in
          app-wide would double-render its notifications on the operator
          screens. A self-contained toast keeps the two apart.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Asking who&rsquo;s logging in
        </h2>
        <p className="text-muted">
          One more thing surfaced after the toast shipped. Declining consent
          doesn&rsquo;t end the Auth0 session — you authenticated fine, you just
          said no to the permissions. So the session cookie on the Auth0 domain
          is still live, and the next time you click log in, Auth0 sees it and
          jumps straight back to the consent screen. It never asks who&rsquo;s
          logging in, which is exactly what you want to reconsider after a deny.
        </p>
        <p className="mt-3 text-muted">
          The SDK&rsquo;s login handler forwards every query param it&rsquo;s
          given straight onto the authorization request, so{" "}
          <code className={code}>prompt=login</code> forces Auth0 to
          re-authenticate. I didn&rsquo;t want that on every login though —
          normal sign-ins should stay smooth. So on a denied consent the{" "}
          <code className={code}>onCallback</code> also sets a short-lived
          one-shot cookie, and the proxy adds{" "}
          <code className={code}>prompt=login</code> to the very next{" "}
          <code className={code}>/auth/login</code> and clears the cookie in the
          same response. One fresh prompt right after a deny, then straight back
          to normal. I reached for this instead of a full Auth0 logout because
          logout&rsquo;s return URL has to be whitelisted in the tenant, and
          this needs no config at all.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Sessions that time out</h2>
        <p className="text-muted">
          The last piece was session length. I wanted a rolling six-hour idle
          window: being on the site and doing things keeps you signed in, but
          sit idle for six hours and you&rsquo;re logged out and have to sign in
          again — and re-grant permissions. The SDK&rsquo;s rolling sessions
          make the first half easy: with{" "}
          <code className={code}>inactivityDuration</code> at six hours and a
          longer <code className={code}>absoluteDuration</code> ceiling, every
          request pushes the expiry to six hours out, so activity resets the
          clock.
        </p>
        <p className="mt-3 text-muted">
          The hard part is noticing the timeout. Once the session cookie expires
          it&rsquo;s just gone — there&rsquo;s nothing left to tell a timed-out
          user apart from one who was never logged in. So I set a second,
          longer-lived marker cookie on every authenticated response. It
          outlives the session, and when the proxy sees a missing session but a
          lingering marker, that&rsquo;s a timeout: it bounces the user to the
          landing page with a <code className={code}>?authError=timeout</code>{" "}
          flag so the toast can render, clears the marker so it only says it
          once, and arms the next login with{" "}
          <code className={code}>prompt=login</code> so Auth0 asks who is
          signing in. Same one-shot cookie mechanism as the denied-consent
          case.
        </p>
        <p className="mt-3 text-muted">
          It armed <code className={code}>prompt=consent</code> at first, which
          did nothing. Per OIDC Core, <code className={code}>consent</code>{" "}
          re-asks for scope approval and explicitly does not re-authenticate,
          and for a first-party client Auth0 skips that screen anyway. So the
          timeout bounced you to the landing page, showed the toast, sent you
          to Auth0 — which still had its own tenant SSO cookie, on a lifetime
          set in the dashboard and entirely independent of this app&rsquo;s six
          hours — and signed you straight back in as whoever you already were.
          The toast was telling the truth and the redirect was quietly undoing
          it.
        </p>
        <p className="mt-3 text-muted">
          Two sessions, not one, is the thing worth remembering. Expiring the
          local cookie tells Auth0 nothing. If you want a timeout to mean
          anything, the next login has to say so out loud.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">
          The third bug at the same choke point
        </h2>
        <p className="text-muted">
          Logging out told you your session had timed out. The marker cookie
          that makes the timeout toast possible outlives the session cookie on
          purpose — once the session is gone there is otherwise no way to tell
          someone who timed out from someone who was never signed in. But
          nothing cleared it on the way out, so choosing to leave left exactly
          the same evidence expiring does, and the next page load read it that
          way.
        </p>
        <p className="mt-3 text-muted">
          It is cleared on{" "}
          <code className={code}>/auth/logout</code> now, in the same{" "}
          <code className={code}>/auth/*</code> branch the other two fixes live
          in. Matched exactly rather than by prefix, so a route that merely
          starts with it is not swept up. Three bugs at this choke point now,
          which is either a good argument for centralising auth or a warning
          about how much one branch is carrying.
        </p>
      </section>
      <WhatsNext
        nowShipped={[
          "The fix made at the choke point rather than at each call site, which is why two separate bugs closed with one change.",
          "A deliberate logout no longer claims the session timed out — the marker that outlives the session cookie is cleared on the way out, so leaving and expiring stop looking identical.",
          "A callback that fails softly, because an auth redirect that throws leaves someone stranded with no way to describe what happened.",
        ]}
        couldImprove={[
          "The return path is not covered by an end-to-end test, so the regression it fixes would be caught by noticing.",
          "Deep links into authenticated routes still land on the destination rather than the thing that was being attempted, which is a subtler version of the same problem.",
          "Three separate bugs have now been found in this one branch, and none of them were caught by a test — each was noticed by using the site.",
        ]}
        upcoming={[
          "An end-to-end test that signs in, signs out, and asserts the toast does not appear — the one class of bug here that keeps recurring is the one nothing watches.",
        ]}
      />
    </ThoughtLayout>
  );
}
