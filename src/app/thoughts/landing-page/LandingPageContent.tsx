import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "../styling/styling.module.css";
import { Sent, Received, Timestamp } from "@/lib/threads";

export default function LandingPageContent() {
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
          <span className={styles.contactName}>Landing Page</span>
          <span className={styles.contactSub}>iMessage</span>
        </div>
        <div className={styles.themeBtn}>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Chat ---- */}
      <div className={styles.chat}>
        <Timestamp>Today 2:30 PM</Timestamp>

        {/* ---- The brief ---- */}
        <Received pos="first">
          the old landing page was just a heading and a login button
        </Received>
        <Received pos="last">what was the goal with the redesign</Received>

        <Sent pos="first">
          the page needed to serve two purposes — introduce the project to
          anyone who lands on it, and act as a portfolio piece that demonstrates
          real front-end skills
        </Sent>
        <Sent pos="middle">
          i wanted something scroll-driven, section-by-section, similar to how
          Apple does their product pages. each section reveals as you scroll and
          showcases a different part of the project
        </Sent>
        <Sent pos="last">
          the constraint: <strong>zero new dependencies</strong>. no framer
          motion, no GSAP, no animation library.
        </Sent>

        <Timestamp>2:33 PM</Timestamp>

        {/* ---- Architecture ---- */}
        <Received pos="first">how did you structure it</Received>
        <Received pos="last">the whole thing is one big component?</Received>

        <Sent pos="first">
          no — that was a deliberate choice. <code>page.tsx</code> stays as a{" "}
          <strong>server component</strong>. it checks the auth session and
          redirects logged-in users to <code>/protected</code>
        </Sent>
        <Sent pos="middle">
          if the user isn{"'"}t logged in, it renders a{" "}
          <code>&lt;LandingContent /&gt;</code> client component. that{"'"}s the
          boundary — server handles auth, client handles interactivity
        </Sent>
        <Sent pos="last">
          then <code>LandingContent</code> itself is just a thin orchestrator.
          each of the 6 sections is its own component under{" "}
          <code>src/app/landing/</code>
        </Sent>

        <div className={styles.codeBubble}>
          {`// page.tsx (server)
export default async function Home() {
  const session = await auth0.getSession();
  if (session) redirect("/protected");
  return <LandingContent />;
}

// LandingContent.tsx (client)
export default function LandingContent() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <AuthSection />
      <DesignSection />
      <NbaSection />
      <FooterSection />
    </>
  );
}`}
        </div>

        <Received>why split every section into its own file</Received>

        <Sent pos="first">
          readability. a single 500-line component with six sections is hard to
          scan. each file is ~80 lines and self-contained — owns its own scroll
          observer, its own markup, its own data
        </Sent>
        <Sent pos="last">
          shared utilities like <code>useInView</code>, <code>reveal()</code>,
          and the <code>Section</code> wrapper live in their own modules under
          the same <code>landing/</code> folder
        </Sent>

        <Timestamp>2:37 PM</Timestamp>

        {/* ---- Scroll animations ---- */}
        <Received pos="first">talk me through the scroll animations</Received>
        <Received pos="last">how do elements fade in as you scroll</Received>

        <Sent pos="first">
          i wrote a <code>useInView</code> hook that wraps{" "}
          <code>IntersectionObserver</code>. you attach the returned ref to a
          section, and it gives you a boolean that flips to <code>true</code>{" "}
          once 15% of the element is visible
        </Sent>
        <Sent pos="middle">
          it{"'"}s <strong>one-shot</strong> — once triggered, the observer
          disconnects. the animation only fires once, so you don{"'"}t get
          elements flickering in and out as you scroll back up
        </Sent>
        <Sent pos="last">
          then a <code>reveal()</code> helper toggles Tailwind classes between{" "}
          <code>opacity-0 translate-y-8</code> and{" "}
          <code>opacity-100 translate-y-0</code> with a 700ms CSS transition.
          staggered children just add <code>delay-100</code>,{" "}
          <code>delay-200</code>, etc.
        </Sent>

        <div className={styles.codeBubble}>
          {`// useInView.ts — one-shot scroll observer
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(entry.target);
        }
      },
      { threshold },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}`}
        </div>

        <Received>
          why IntersectionObserver instead of a scroll event listener
        </Received>

        <Sent pos="first">
          performance. scroll listeners fire on every frame during scroll — you
          {"'"}d need to throttle or debounce and manually calculate element
          positions with <code>getBoundingClientRect()</code>
        </Sent>
        <Sent pos="last">
          IntersectionObserver is asynchronous and runs off the main thread. the
          browser handles the geometry checks natively. it{"'"}s the right tool
          for {'"'}is this element visible{'"'}
        </Sent>

        <Timestamp>2:41 PM</Timestamp>

        {/* ---- Hero animation choice ---- */}
        <Received>
          the hero section animates on mount, not on scroll — why is that
          different
        </Received>

        <Sent pos="first">
          the hero is the first thing users see. it needs to animate immediately
          on page load, not when you scroll to it — you{"'"}re already looking
          at it
        </Sent>
        <Sent pos="middle">
          initially i used <code>useState</code> + <code>useEffect</code> to
          flip a <code>mounted</code> flag. but React{"'"}s linter flagged
          calling <code>setState</code> synchronously inside an effect — it
          causes a cascading re-render
        </Sent>
        <Sent pos="last">
          the fix: pure CSS <code>@keyframes</code>. the elements start at{" "}
          <code>opacity: 0; translate-y: 8</code> and the animation runs{" "}
          <code>forwards</code> to the final state. staggered delays are set
          with <code>[animation-delay:100ms]</code> etc. no JS needed
        </Sent>

        <div className={styles.codeBubble}>
          {`/* CSS-only hero entrance */
@keyframes hero-fade-in {
  to { opacity: 1; transform: translateY(0); }
}

/* applied via Tailwind arbitrary value */
className="opacity-0 translate-y-8
  animate-[hero-fade-in_0.7s_ease-out_forwards]
  [animation-delay:100ms]"`}
        </div>

        <Timestamp>2:44 PM</Timestamp>

        {/* ---- Design tokens ---- */}
        <Received pos="first">
          how does the theming work across all the sections
        </Received>
        <Received pos="last">some sections are dark, some are light</Received>

        <Sent pos="first">
          every color in the page uses the project{"'"}s design token system.
          semantic classes like <code>bg-background</code>,{" "}
          <code>text-foreground</code>, <code>bg-surface</code> resolve to CSS
          custom properties that swap based on <code>data-theme</code>
        </Sent>
        <Sent pos="middle">
          for sections that need to be the opposite of the current theme — like
          the {'"'}What I Built{'"'} section — i used explicit palette tokens:{" "}
          <code>bg-neutral-950 dark:bg-neutral-100</code>. this guarantees it
          {"'"}s dark in light mode and light in dark mode
        </Sent>
        <Sent pos="last">
          other sections use gradient backgrounds with primary/secondary palette
          tokens. the NBA section uses{" "}
          <code>from-secondary-600 to-primary-700</code> with dark mode
          overrides. each section feels distinct but the palette stays cohesive
        </Sent>

        <Timestamp>2:47 PM</Timestamp>

        {/* ---- Hover effects ---- */}
        <Received>
          the feature cards have a hover effect — how does that work without JS
        </Received>

        <Sent pos="first">
          Tailwind{"'"}s <code>group</code> pattern. the card is the group
          container, and an inner div acts as the hover background layer
        </Sent>
        <Sent pos="last">
          on hover, the gradient layer transitions from <code>opacity-0</code>{" "}
          to <code>opacity-100</code> with <code>group-hover:opacity-100</code>.
          the content sits above it with <code>relative z-10</code>. no event
          handlers, no state — pure CSS
        </Sent>

        {/* ---- Button glow ---- */}
        <Received>and the glowing login button</Received>

        <Sent pos="first">
          a <code>@keyframes glow-pulse</code> that animates{" "}
          <code>box-shadow</code> between 8px and 24px spread using the primary
          color token
        </Sent>
        <Sent pos="last">
          the tricky part: the button also has the hero entrance animation. CSS
          lets you stack multiple animations on one element with commas — the
          fade-in runs once with <code>forwards</code>, then the glow loops{" "}
          <code>infinite</code> starting after a 1.2s delay so it doesn{"'"}t
          pulse before the button is visible
        </Sent>

        <Timestamp>2:50 PM</Timestamp>

        {/* ---- Mobile ---- */}
        <Received pos="first">what about mobile</Received>
        <Received pos="last">the auth section had overflow issues</Received>

        <Sent pos="first">
          the main layout is full-width sections with content capped at{" "}
          <code>max-w-[1000px]</code> and <code>px-6</code> padding. cards use{" "}
          <code>md:grid-cols-3</code> so they stack to single column on mobile
        </Sent>
        <Sent pos="middle">
          the auth section had a code snippet that overflowed on narrow screens.
          two fixes: changed <code>overflow-hidden</code> to{" "}
          <code>overflow-x-auto</code> so the code block scrolls horizontally,
          and added <code>min-w-0</code> on the grid child to prevent it from
          blowing out of its column
        </Sent>
        <Sent pos="last">
          also reduced font size to <code>text-xs</code> on mobile with{" "}
          <code>sm:text-sm</code> breakpoint. small details but they{"'"}re the
          difference between {'"'}looks polished{'"'} and {'"'}looks broken on
          my phone{'"'}
        </Sent>

        <Timestamp>2:53 PM</Timestamp>

        {/* ---- Trade-offs ---- */}
        <Received>any trade-offs with this approach</Received>

        <Sent pos="first">
          the <code>&lt;style&gt;</code> tag for keyframes is inline in the
          component. ideally those would live in the global CSS, but for two
          small keyframes scoped to the landing page it{"'"}s fine — keeps them
          co-located with the component that uses them
        </Sent>
        <Sent pos="middle">
          the scroll animations are one-shot, so if you scroll past a section
          quickly you might miss the entrance. that{"'"}s intentional — replay
          animations on every scroll feel janky. once is enough
        </Sent>
        <Sent pos="last">
          and the page is 100% client-rendered (below the auth check). for a
          marketing-style landing page you{"'"}d normally want SSR for SEO. but
          this is a portfolio project, not a product page — the scroll
          interactivity matters more than crawler indexability here
        </Sent>

        <Timestamp>2:56 PM</Timestamp>

        {/* ---- Improvements ---- */}
        <Received>anything you{"'"}d improve</Received>

        <Sent pos="first">
          could add <code>prefers-reduced-motion</code> support — disable
          animations for users who{"'"}ve opted out in their OS settings
        </Sent>
        <Sent pos="middle">
          could lazy-load the heavier sections with <code>Suspense</code> +{" "}
          <code>dynamic()</code> so the initial JS bundle is smaller
        </Sent>
        <Sent pos="last">
          could also add parallax to the decorative blurred circles in the hero
          for depth. but every effect you add is complexity to maintain — ship
          the simplest version that looks good and iterate from feedback
        </Sent>

        <Received>clean work</Received>

        <Sent>
          that{"'"}s the approach — zero dependencies, semantic tokens,
          IntersectionObserver for scroll, CSS keyframes for mount. let the
          platform do the work
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
