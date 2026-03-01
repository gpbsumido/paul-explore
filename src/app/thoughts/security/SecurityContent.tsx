import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

export default function SecurityContent() {
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
          <span className={styles.contactName}>CSP &amp; Security</span>
          <span className={styles.contactSub}>iMessage</span>
        </div>
        <div className={styles.themeBtn}>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Chat ---- */}
      <div className={styles.chat}>
        <Timestamp>Today 10:00 AM</Timestamp>

        <Received pos="first">
          why were the landing page sections blank in prod?
        </Received>
        <Received pos="last">they worked fine locally</Received>

        <Sent pos="first">
          CSP. the Content Security Policy in middleware was blocking all
          JavaScript from running
        </Sent>
        <Sent pos="middle">
          the policy had{" "}
          <code>script-src &apos;nonce-&#123;nonce&#125;&apos; &apos;strict-dynamic&apos;</code>{" "}
          — each request would generate a random nonce and any script without
          that nonce attribute would be blocked
        </Sent>
        <Sent pos="last">
          locally it was fine because the dev server always re-renders
          everything. in production the landing page became fully static after
          moving the auth redirect to middleware, and Vercel served the CSP from
          the CDN edge
        </Sent>

        <Timestamp>10:03 AM</Timestamp>

        <Received>what does static have to do with it</Received>

        <Sent pos="first">
          Next.js App Router inlines RSC payload scripts directly into the HTML —
          they look like <code>self.__next_f.push([...])</code>. these are what
          hydrate the React tree on the client
        </Sent>
        <Sent pos="middle">
          the problem is they have no nonce attribute. Next.js just inlines them
          as-is. and <code>&apos;strict-dynamic&apos;</code> explicitly ignores{" "}
          <code>&apos;self&apos;</code>, so even loading scripts from your own
          origin stops working unless they carry the nonce
        </Sent>
        <Sent pos="last">
          when the page was dynamic, server-rendered responses may have behaved
          differently. once it went static, Vercel&apos;s edge middleware applied
          the CSP header to every CDN-cached response — and everything broke
        </Sent>

        <Timestamp>10:07 AM</Timestamp>

        <Received>how did you figure that out</Received>

        <Sent pos="first">
          HeroSection still animated. that was the clue — its animation is pure
          CSS (@keyframes in a style tag), no JavaScript involved. everything
          else uses IntersectionObserver which requires JS
        </Sent>
        <Sent pos="last">
          so JS was clearly not running at all. from there it was just DevTools
          → Console → CSP violation errors pointing at the inline RSC scripts
        </Sent>

        <Timestamp>10:10 AM</Timestamp>

        <Received>what&apos;s the fix</Received>

        <Sent pos="first">
          <code>script-src &apos;self&apos; &apos;unsafe-inline&apos;</code>.
          allows scripts from the same origin and allows inline scripts. that
          covers both the RSC payloads and the Next.js chunks loaded from
          /_next/static/
        </Sent>
        <Sent pos="last">
          also had to add <code>https://vitals.vercel-insights.com</code> to{" "}
          <code>connect-src</code> — Speed Insights was silently failing to send
          its beacons because <code>connect-src &apos;self&apos;</code> blocked
          the request to that external domain
        </Sent>

        <Timestamp>10:14 AM</Timestamp>

        <Received pos="first">
          isn&apos;t &apos;unsafe-inline&apos; bad?
        </Received>
        <Received pos="last">
          feels like it defeats the whole point of a CSP
        </Received>

        <Sent pos="first">
          kind of, but it&apos;s more nuanced than the name suggests
        </Sent>
        <Sent pos="middle">
          what <code>&apos;unsafe-inline&apos;</code> actually protects against
          is reflected XSS — an attacker injecting a{" "}
          <code>&lt;script&gt;</code> tag into the HTML response. CSP blocks that
          script from running even if it makes it into the markup
        </Sent>
        <Sent pos="last">
          but the real XSS protection here is React&apos;s automatic JSX
          escaping. any value rendered in JSX gets HTML-escaped before it touches
          the DOM. the attack surface only opens up if you use{" "}
          <code>dangerouslySetInnerHTML</code> — and there&apos;s none of that
          anywhere in this codebase
        </Sent>

        <Timestamp>10:18 AM</Timestamp>

        <Received>what about the calendar? users put data in there</Received>

        <Sent pos="first">
          yeah I checked. calendar events go through the same JSX rendering
          pipeline — event titles, descriptions, card names, all rendered as
          text nodes via React. no raw HTML injection path
        </Sent>
        <Sent pos="middle">
          if I were ever rendering user content as HTML (like a rich text field),
          that would change things. you&apos;d want either a strict sanitizer
          like DOMPurify before passing to dangerouslySetInnerHTML, or a nonce —
          which brings us back to the tradeoff
        </Sent>
        <Sent pos="last">
          for now the threat model doesn&apos;t warrant it, and the performance
          cost is real
        </Sent>

        <Timestamp>10:22 AM</Timestamp>

        <Received>what&apos;s the performance cost of doing it properly</Received>

        <Sent pos="first">
          to do nonce-based CSP correctly in Next.js you have to make the root
          layout async and read the nonce from request headers inside it, so
          Next.js can stamp it onto the RSC inline scripts
        </Sent>
        <Sent pos="middle">
          but reading headers() in any server component opts that route out of
          static generation. it becomes dynamic — re-rendered on every request.
          the root layout wraps every page, so every page goes dynamic
        </Sent>
        <Sent pos="last">
          I actually tried this. ran a build, and every page flipped from ○
          Static to ƒ Dynamic. TTFB, LCP, FCP — all the vitals I&apos;ve been
          optimizing — take a direct hit. it&apos;s not worth it here
        </Sent>

        <Timestamp>10:26 AM</Timestamp>

        <Received>so &apos;unsafe-inline&apos; is actually fine</Received>

        <Sent pos="first">
          for this site, yes. it&apos;s the standard CSP approach for Next.js
          apps with static pages — it&apos;s what the Next.js docs recommend for
          exactly this reason
        </Sent>
        <Sent pos="middle">
          the remaining directives do meaningful work:{" "}
          <code>default-src &apos;self&apos;</code> blocks loading resources from
          unknown domains, <code>frame-ancestors &apos;none&apos;</code> blocks
          clickjacking, <code>object-src &apos;none&apos;</code> blocks Flash and
          plugins, <code>base-uri &apos;self&apos;</code> blocks base tag
          injection
        </Sent>
        <Sent pos="last">
          and connect-src is locked down so JS can only make requests to known
          endpoints — same origin, plus the specific external services that need
          it (Speed Insights, TCGdex, GitHub raw for Pokémon sprites)
        </Sent>
      </div>
    </div>
  );
}
