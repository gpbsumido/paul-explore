import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "../styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

export default function TcgContent() {
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
          <span className={styles.contactName}>TCG Pages</span>
          <span className={styles.contactSub}>iMessage</span>
        </div>
        <div className={styles.themeBtn}>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Chat ---- */}
      <div className={styles.chat}>
        <Timestamp>Today 9:15 AM</Timestamp>

        <Received pos="first">so what did you actually build here</Received>
        <Received pos="last">just a card browser?</Received>

        <Sent pos="first">more than that</Sent>
        <Sent pos="middle">
          there&apos;s a browse + search page with debounced filtering, a sets
          index, per-set card grids, full card detail pages, and a separate TCG
          Pocket page that groups sets by expansion family
        </Sent>
        <Sent pos="last">
          all powered by the{" "}
          <code>@tcgdex/sdk</code> TypeScript SDK wrapping the TCGdex REST API
        </Sent>

        <Received>why not just call the API from the browser</Received>

        <Sent pos="first">
          the app has a strict Content Security Policy —{" "}
          <code>connect-src &apos;self&apos;</code>
        </Sent>
        <Sent pos="middle">
          that means the browser can only make fetch calls to the same origin.
          hitting <code>api.tcgdex.net</code> directly from client-side code
          gets blocked
        </Sent>
        <Sent pos="last">
          so every SDK call lives in a Next.js API route. the browser talks to{" "}
          <code>/api/tcg/cards</code>, the route handler calls the SDK, returns
          plain JSON
        </Sent>

        <div className={styles.codeBubble}>
          {`// browser can't do this
fetch("https://api.tcgdex.net/v2/en/cards")

// browser does this instead
fetch("/api/tcg/cards?q=charizard")`}
        </div>

        <Received>is that a pain to set up</Received>

        <Sent pos="first">
          honestly pretty clean once you have the pattern. each route is
          15-20 lines
        </Sent>
        <Sent pos="last">
          the upside: you control what gets exposed, you can add caching or
          auth checks at that layer, and CSP stays strict for free
        </Sent>

        <Timestamp>9:19 AM</Timestamp>

        <Received pos="first">
          what about server components — you have Next.js
        </Received>
        <Received pos="last">
          couldn&apos;t the server just call the SDK directly
        </Received>

        <Sent pos="first">yes, and some pages do exactly that</Sent>
        <Sent pos="middle">
          the set detail page is a server component — it calls the SDK at
          render time to get set metadata, logo, release year, and legality.
          that part is fast and doesn&apos;t need interactivity
        </Sent>
        <Sent pos="last">
          but the card grid below it needs pagination, so that&apos;s a client
          component that calls the API route. the split looks like this:
        </Sent>

        <div className={styles.codeBubble}>
          {`// server component — rendered on the server
export default async function SetDetailPage({ params }) {
  const set = await tcgdex.set.get(setId); // direct SDK call
  return (
    <>
      <SetHeader set={set} />
      <SetCardsGrid setId={setId} /> {/* client */}
    </>
  );
}`}
        </div>

        <Received>why not make the whole page a client component</Received>

        <Sent pos="first">
          the set header — name, logo, card count, legality badges — never
          changes. fetching that on the server means it&apos;s in the initial
          HTML, no loading state, no layout shift
        </Sent>
        <Sent pos="last">
          if the whole page were client-side, you&apos;d see the header
          skeleton flash on every navigation. server component gives you that
          content instantly
        </Sent>

        <Timestamp>9:24 AM</Timestamp>

        <Received>tell me about the pagination</Received>

        <Sent pos="first">
          took a couple iterations. first version used <code>useState</code>{" "}
          for the page number
        </Sent>
        <Sent pos="middle">
          problem: when you reset on a new search, the state update and the
          fetch compete. stale closures mean the fetch might still reference
          the old page number
        </Sent>
        <Sent pos="last">
          switched to <code>useRef</code>. it&apos;s mutable and synchronous —
          no re-render, no closure staleness
        </Sent>

        <div className={styles.codeBubble}>
          {`const pageRef = useRef(1);

// reset on filter change
useEffect(() => {
  pageRef.current = 1;
  fetchCards(debouncedSearch, type, 1, false);
}, [debouncedSearch, type, fetchCards]);

// load more
function handleLoadMore() {
  pageRef.current += 1;
  fetchCards(debouncedSearch, type, pageRef.current, true);
}`}
        </div>

        <Received>was there anything surprising about the API itself</Received>

        <Sent pos="first">
          yeah — the TCGdex API is 1-indexed for pagination but{" "}
          <code>paginate(0, 20)</code> and <code>paginate(1, 20)</code> both
          return the same first page silently
        </Sent>
        <Sent pos="middle">
          so the original code started at page 0. first load-more click jumped
          to page 1 — identical results, which deduplication correctly dropped
          — so it looked like the button was broken
        </Sent>
        <Sent pos="last">
          fix was simple once i found it: start at 1. but it took noticing that
          &quot;no new cards&quot; was actually correct deduplication of a
          duplicate API response
        </Sent>

        <Received pos="first">you mentioned deduplication</Received>
        <Received pos="last">why does that exist</Received>

        <Sent pos="first">
          the TCGdex API occasionally returns duplicate entries in set
          responses
        </Sent>
        <Sent pos="middle">
          React needs unique keys — duplicate card IDs would cause a console
          warning and potentially broken rendering
        </Sent>
        <Sent pos="last">
          the fix is just a <code>Set</code> before rendering, and another
          check on append to prevent re-adding already-loaded cards
        </Sent>

        <div className={styles.codeBubble}>
          {`// dedup on append
setCards((prev) => {
  const seen = new Set(prev.map((c) => c.id));
  return [...prev, ...data.filter((c) => !seen.has(c.id))];
});`}
        </div>

        <Timestamp>9:31 AM</Timestamp>

        <Received>what about sorting</Received>

        <Sent pos="first">
          all card queries sort by <code>localId ASC</code> — that&apos;s the
          card number within a set
        </Sent>
        <Sent pos="middle">
          important: the sort is applied in the API query, not in JavaScript
          after the response
        </Sent>
        <Sent pos="last">
          sorting 20 cards at a time client-side would look right locally but
          break the moment you load more — each page is sorted independently
          so the combined list wouldn&apos;t be in order
        </Sent>

        <div className={styles.codeBubble}>
          {`// sort at the source, not after
const query = Query.create()
  .sort("localId", "ASC")
  .paginate(page, 20);`}
        </div>

        <Received>tell me about the Pocket page</Received>

        <Sent pos="first">
          TCG Pocket has an interesting set structure — sets have IDs like{" "}
          <code>A1</code>, <code>A1a</code>, <code>A2</code>,{" "}
          <code>A2a</code>, <code>A2b</code>
        </Sent>
        <Sent pos="middle">
          <code>A1a</code> is a mini-set expansion of <code>A1</code>. they
          belong together visually but the API just gives you a flat list
        </Sent>
        <Sent pos="last">
          so i group them client-side with a regex: <code>^([A-Z]\d+)</code>{" "}
          extracts the base key. <code>A1</code> and <code>A1a</code> both
          become <code>&quot;A1&quot;</code>, rendered as one section with the
          mini-sets below the primary
        </Sent>

        <div className={styles.codeBubble}>
          {`function expansionKey(id: string): string {
  if (id.startsWith("P-")) return id; // promos stay solo
  const m = id.match(/^([A-Z]\\d+)/);
  return m ? m[1] : id;
}`}
        </div>

        <Timestamp>9:38 AM</Timestamp>

        <Received pos="first">SDK vs raw REST vs GraphQL</Received>
        <Received pos="last">how do you feel about using the SDK</Received>

        <Sent pos="first">
          the SDK is great for DX — typed responses, query builder, no manual
          URL construction
        </Sent>
        <Sent pos="middle">
          the downside: SDK model instances carry a circular{" "}
          <code>sdk</code> property reference back to the{" "}
          <code>TCGdex</code> instance. <code>JSON.stringify</code> blows up on
          that
        </Sent>
        <Sent pos="last">
          had to write a <code>toPlain()</code> helper that strips those keys
          before returning the response
        </Sent>

        <div className={styles.codeBubble}>
          {`export function toPlain<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      key === "sdk" || key === "tcgdex" ? undefined : value
    )
  );
}`}
        </div>

        <Received>would you use direct REST instead next time</Received>

        <Sent pos="first">
          probably not — the type safety from the SDK is worth it
        </Sent>
        <Sent pos="middle">
          direct REST means maintaining your own type definitions and parsing
          logic. the SDK handles all that
        </Sent>
        <Sent pos="last">
          the <code>toPlain()</code> workaround is a one-time cost and it&apos;s
          4 lines. i&apos;d take that trade
        </Sent>

        <Received>what about GraphQL — TCGdex supports it</Received>

        <Sent pos="first">
          i stuck with the SDK which wraps the REST API. GraphQL would have
          given me field-level selection — useful if you want to avoid
          over-fetching on large card objects
        </Sent>
        <Sent pos="middle">
          but for a card browser the payloads aren&apos;t huge, and the SDK
          types are already scoped — card list responses return a{" "}
          <code>CardResume</code> shape, not the full card. that&apos;s
          essentially the same benefit
        </Sent>
        <Sent pos="last">
          GraphQL makes more sense if you have multiple clients with very
          different data needs, or if you&apos;re building something that
          aggregates across multiple APIs
        </Sent>

        <Timestamp>9:45 AM</Timestamp>

        <Received pos="first">anything you&apos;d do differently</Received>
        <Received pos="last">looking back at it</Received>

        <Sent pos="first">
          i&apos;d add server-side caching on the API routes. right now every
          request hits the TCGdex API cold. card and set data barely ever
          changes — a 5-minute cache header would cut latency a lot
        </Sent>
        <Sent pos="middle">
          i&apos;d also look at infinite scroll instead of &quot;Load more&quot;.
          the button works but an intersection observer on the last card would
          feel smoother
        </Sent>
        <Sent pos="last">
          and the type filter pills on the browse page reset the scroll
          position. a URL-driven approach — putting filters in query params —
          would make back/forward navigation work correctly and let you share
          filtered views
        </Sent>

        <Received>what does this show as a frontend dev</Received>

        <Sent pos="first">
          knowing when to split server vs client components, not just
          defaulting to all-client
        </Sent>
        <Sent pos="middle">
          understanding what constraints exist (CSP, circular refs, API
          quirks) and building the smallest fix that addresses them
        </Sent>
        <Sent pos="last">
          and reasoning about pagination and data flow — making sure sort
          happens at the right layer, deduplication is defensive, and the
          cursor doesn&apos;t cause stale closure bugs
        </Sent>

        <Received>nice. thanks for walking me through it</Received>

        <Sent>happy to</Sent>

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
