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
          browse + search with debounced filtering, sets index grouped by
          series, per-set card grids, full card detail pages, and a TCG Pocket
          page that groups sets by expansion family
        </Sent>
        <Sent pos="last">
          all powered by the <code>@tcgdex/sdk</code> TypeScript SDK wrapping
          the TCGdex REST API
        </Sent>

        <Received>why not just call the API from the browser</Received>

        <Sent pos="first">
          the app has a strict Content Security Policy —{" "}
          <code>connect-src &apos;self&apos;</code>
        </Sent>
        <Sent pos="middle">
          so the browser can only fetch from the same origin. hitting{" "}
          <code>api.tcgdex.net</code> directly gets blocked
        </Sent>
        <Sent pos="last">
          every SDK call lives in a Next.js API route. the browser talks to{" "}
          <code>/api/tcg/cards</code>, the route calls the SDK, returns plain
          JSON
        </Sent>

        <div className={styles.codeBubble}>
          {`// browser can't do this
fetch("https://api.tcgdex.net/v2/en/cards")

// browser does this instead
fetch("/api/tcg/cards?q=charizard")`}
        </div>

        <Timestamp>9:19 AM</Timestamp>

        <Received pos="first">
          what about server components — couldn&apos;t the server just call the
          SDK directly
        </Received>

        <Sent pos="first">yes, and some pages do exactly that</Sent>
        <Sent pos="middle">
          the set detail page is a server component — it calls the SDK at render
          time for metadata, logo, release year, legality. fast, no
          interactivity needed
        </Sent>
        <Sent pos="last">
          but the card grid needs pagination, so that&apos;s a client component
          calling the API route. clear split: server owns the header, client
          owns the scroll
        </Sent>

        <div className={styles.codeBubble}>
          {`// server component
export default async function SetDetailPage({ params }) {
  const set = await tcgdex.set.get(setId); // SDK call
  return (
    <>
      <SetHeader set={set} />
      <Suspense>
        <SetCardsGrid setId={setId} /> {/* client */}
      </Suspense>
    </>
  );
}`}
        </div>

        <Received>why the Suspense wrapper</Received>

        <Sent pos="first">
          <code>SetCardsGrid</code> uses <code>useSearchParams</code> to read
          the page number from the URL
        </Sent>
        <Sent pos="last">
          Next.js App Router requires a <code>Suspense</code> boundary around
          any client component that calls <code>useSearchParams</code> during
          server rendering — otherwise you get a build error
        </Sent>

        <Timestamp>9:24 AM</Timestamp>

        <Received>tell me about the pagination</Received>

        <Sent pos="first">
          the page number is <code>loadedPages</code> state — not a ref
        </Sent>
        <Sent pos="last">
          it syncs to the URL as you scroll — <code>?page=3</code> — so sharing
          or back-navigating restores exactly where you were
        </Sent>

        <Received pos="first">infinite scroll — how does that work</Received>
        <Received pos="last">
          i always see IntersectionObserver break in weird ways
        </Received>

        <Sent pos="first">
          there&apos;s a sentinel div at the bottom of the list. an
          IntersectionObserver watches it — when it enters the viewport, load
          the next page
        </Sent>
        <Sent pos="middle">
          the tricky part: observers only fire on intersection state{" "}
          <em>changes</em>. on a wide screen, the sentinel might already be
          visible after the first load — the state never changes, so it never
          fires again
        </Sent>
        <Sent pos="last">
          fix: add <code>cards.length</code> to the observer effect&apos;s
          dependency array. that reconnects the observer after every fetch,
          which calls <code>observe()</code> fresh and immediately reports
          current intersection state
        </Sent>

        <Received>
          but the observer callback goes stale — how does it read current state
        </Received>

        <Sent pos="first">
          event handler ref pattern. assign directly in the render body — no{" "}
          <code>useEffect</code> wrapper. refs are mutable and don&apos;t need
          to go through React&apos;s effect queue to stay current
        </Sent>
        <Sent pos="last">
          the observer reconnects on <code>cards.length</code> change —
          that&apos;s intentional, not <code>[]</code>. reconnecting forces{" "}
          <code>observe()</code> to immediately report current intersection
          state, which fixes the case where the sentinel is already in the
          viewport after load. the ref handles stale closures; the dep handles
          the wide-screen edge case. both are needed
        </Sent>

        <div className={styles.codeBubble}>
          {`// assigned directly in render — always fresh
const onScrollRef = useRef(() => {});
onScrollRef.current = () => {
  if (!hasMore || loading || cards.length === 0) return;
  const nextPage = loadedPages + 1;
  setLoadedPages(nextPage);
  fetchCards(search, type, nextPage, true);
};

// reconnects after each fetch — forces observe() to immediately report
// current intersection state if the sentinel is already in the viewport
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) onScrollRef.current();
  }, { rootMargin: "200px" });
  observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [cards.length]); // ← not [] — the reconnect is the fix`}
        </div>

        <Timestamp>9:31 AM</Timestamp>

        <Received>you mentioned URL-driven state</Received>
        <Received pos="last">how does that work with filters</Received>

        <Sent pos="first">
          search, type filter, and page number all live in the URL as query
          params
        </Sent>
        <Sent pos="middle">
          on mount, the component reads the URL to initialize state. as the user
          types or scrolls, the URL updates with{" "}
          <code>
            router.replace(..., {"{"} scroll: false {"}"}
          </code>
          ) — no scroll jump
        </Sent>
        <Sent pos="last">
          back/forward navigation changes the URL, which syncs back into state.
          and if you share <code>?q=pikachu&type=Psychic&page=4</code>, the
          recipient sees exactly that
        </Sent>

        <div className={styles.codeBubble}>
          {`// write to URL whenever filters or page change
useEffect(() => {
  const params = new URLSearchParams();
  if (debouncedSearch) params.set("q", debouncedSearch);
  if (type) params.set("type", type);
  if (loadedPages > 1) params.set("page", loadedPages.toString());
  router.replace(\`/tcg/pokemon?\${params}\`, { scroll: false });
}, [debouncedSearch, type, loadedPages, router]);`}
        </div>

        <Timestamp>9:37 AM</Timestamp>

        <Received>what about loading states</Received>

        <Sent pos="first">two layers</Sent>
        <Sent pos="middle">
          for server components that <code>await</code> data —{" "}
          <code>loading.tsx</code> files next to the page. Next.js wraps them in
          a Suspense boundary automatically and streams the skeleton HTML to the
          browser while the server fetch runs
        </Sent>
        <Sent pos="last">
          for the client-side infinite scroll append, skeleton card tiles are
          injected into the grid while loading — same grid layout, same aspect
          ratio, animate-pulse
        </Sent>

        <div className={styles.codeBubble}>
          {`// append skeletons at the end of the real cards
<div className="grid grid-cols-3 ...">
  {cards.map(card => <CardTile key={card.id} card={card} />)}
  {loading && Array.from({ length: 20 }).map((_, i) => (
    <SkeletonCard key={\`sk-\${i}\`} />
  ))}
</div>`}
        </div>

        <Received pos="first">why bother with loading.tsx</Received>
        <Received pos="last">
          doesn&apos;t it only matter for client components
        </Received>

        <Sent pos="first">
          actually the opposite — it&apos;s most useful for server components
        </Sent>
        <Sent pos="middle">
          when a server component <code>await</code>s data, the page is blocked
          until the fetch completes. without <code>loading.tsx</code>, the
          browser stares at a blank page
        </Sent>
        <Sent pos="last">
          with it, Next.js streams the skeleton HTML immediately via React
          streaming SSR, then streams the real content once the fetch is done.
          the browser never waits on a blank screen
        </Sent>

        <Timestamp>9:44 AM</Timestamp>

        <Received>are you using a design system</Received>

        <Sent pos="first">
          yes — the app has shared <code>Button</code>, <code>Input</code>, and{" "}
          <code>Modal</code> primitives
        </Sent>
        <Sent pos="middle">
          the TCG pages use them throughout. retry buttons use{" "}
          <code>{'<Button variant="outline" size="sm">'}</code>. the search bar
          uses <code>Input</code> with <code>hideLabel</code> and{" "}
          <code>size=&quot;sm&quot;</code> — visible label is hidden via{" "}
          <code>sr-only</code> for accessibility but still there for screen
          readers
        </Sent>
        <Sent pos="last">
          the type filter pills use a new <code>size=&quot;xs&quot;</code>{" "}
          variant added to the Button primitive — no fixed height, padding-only
          sizing for compact pill shapes
        </Sent>

        <Timestamp>9:49 AM</Timestamp>

        <Received pos="first">the card detail page looks good</Received>
        <Received pos="last">
          what&apos;s going on with the energy icons
        </Received>

        <Sent pos="first">
          attack costs, retreat cost, weakness, and resistance all show the
          actual Pokémon TCG energy symbols instead of text
        </Sent>
        <Sent pos="middle">
          the icons are PNGs sourced from Bulbapedia, stored in{" "}
          <code>public/energy/</code> and served locally — no external CDN
          dependency
        </Sent>
        <Sent pos="last">
          effect text also gets parsed — <code>{"{P}"}</code> in &quot;Discard 2{" "}
          {"{P}"} Energy&quot; is replaced with the Psychic icon inline, using a
          regex split on the <code>{"{X}"}</code> token pattern
        </Sent>

        <div className={styles.codeBubble}>
          {`function parseEnergyText(text: string): React.ReactNode[] {
  return text.split(/(\\{[A-Z]\\})/).map((part, i) => {
    const match = part.match(/^\\{([A-Z])\\}$/);
    if (match && ENERGY_CODE[match[1]]) {
      return <EnergyIcon key={i} type={ENERGY_CODE[match[1]]} />;
    }
    return part;
  });
}`}
        </div>

        <Received>was there anything surprising about the API itself</Received>

        <Sent pos="first">
          a few things. TCGdex is 1-indexed for pagination but{" "}
          <code>paginate(0, 20)</code> and <code>paginate(1, 20)</code> both
          return the same first page silently
        </Sent>
        <Sent pos="middle">
          so the original code started at 0. first load-more jumped to 1 —
          duplicate results, deduplication dropped them all, looked like nothing
          happened
        </Sent>
        <Sent pos="last">
          also: SDK model instances carry a circular <code>sdk</code> property.{" "}
          <code>JSON.stringify</code> blows up on it. had to write a{" "}
          <code>toPlain()</code> helper that strips those keys in a replacer
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

        <Timestamp>9:56 AM</Timestamp>

        <Received pos="first">SDK vs raw REST vs GraphQL</Received>
        <Received pos="last">how do you feel about the SDK choice</Received>

        <Sent pos="first">
          SDK is worth it for the type safety and query builder. direct REST
          means maintaining your own types and parsing
        </Sent>
        <Sent pos="middle">
          the <code>toPlain()</code> workaround is a one-time cost. card list
          responses already return a <code>CardResume</code> shape — not the
          full object — so the SDK handles the field scoping that GraphQL would
          give you otherwise
        </Sent>
        <Sent pos="last">
          GraphQL makes more sense when you have multiple clients with very
          different data needs, or when aggregating across multiple APIs. for a
          single card browser, the SDK wins on DX
        </Sent>

        <Timestamp>9:52 AM</Timestamp>

        <Received pos="first">any robustness issues</Received>
        <Received pos="last">typing fast or switching filters quickly</Received>

        <Sent pos="first">
          yes — rapid filter changes can cause a race. old fetch resolves after
          the new one starts and overwrites the results
        </Sent>
        <Sent pos="last">
          fixed with <code>AbortController</code>. each fetch aborts the
          previous one before starting. <code>AbortError</code> is caught and
          silently ignored — no error state, no loading flicker
        </Sent>

        <div className={styles.codeBubble}>
          {`const abortRef = useRef<AbortController | null>(null);

const fetchCards = async (...) => {
  abortRef.current?.abort();
  const controller = new AbortController();
  abortRef.current = controller;

  const res = await fetch(url, { signal: controller.signal });
  ...
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    setError("Failed to load cards.");
  } finally {
    if (!controller.signal.aborted) setLoading(false);
  }
};`}
        </div>

        <Timestamp>10:10 AM</Timestamp>

        <Received pos="first">
          does the browse page still fetch page 1 client-side?
        </Received>
        <Received pos="last">
          does every fresh load show the skeleton grid?
        </Received>

        <Sent pos="first">
          no, that&apos;s fixed. the browse page fetches page 1 server-side now
          — same streaming pattern as the GraphQL Pokédex
        </Sent>
        <Sent pos="middle">
          <code>page.tsx</code> has a <code>BrowseWithData</code> async server
          component that calls the TCGdex SDK directly — one module-level{" "}
          <code>new TCGdex(&quot;en&quot;)</code> instance per server process,
          same as the API route. a <code>BrowseSkeleton</code> mirrors the
          filter bar and card grid and wraps it in a <code>Suspense</code>{" "}
          boundary, so that streams immediately while the fetch resolves
        </Sent>
        <Sent pos="last">
          <code>BrowseContent</code> gets <code>initialCards</code> as a prop.
          it initialises state from that and skips the page-1 fetch — but only
          when the URL has no active filters. land on <code>?q=charizard</code>{" "}
          and the server data is the wrong page, so it throws it away and
          fetches with the right params client-side
        </Sent>

        <Received>what about scroll restore — does ?page=N still work</Received>

        <Sent pos="first">
          yes. if there&apos;s server data and <code>?page=4</code> in the URL,
          it loads pages 2–4, not 1–4 — saves one round trip since page 1
          already came from the server
        </Sent>
        <Sent pos="last">
          if the server fetch failed or the URL has filters, it falls back to
          the original path: load pages 1–N sequentially. same behaviour as
          before, just a different entry condition
        </Sent>

        <Timestamp>10:17 AM</Timestamp>

        <Received pos="first">what would you still improve</Received>

        <Sent pos="first">
          cache headers on the API routes. the <code>/api/tcg/cards</code>{" "}
          endpoint hits TCGdex cold on every request — card and set data barely
          ever changes. adding{" "}
          <code>
            Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
          </code>{" "}
          means Vercel&apos;s CDN (or any edge cache) serves repeat fetches
          without touching the origin
        </Sent>
        <Sent pos="last">
          and the TCG Pocket page could get the same infinite scroll treatment.
          it currently loads everything in one shot since the set count is
          small, but it&apos;s inconsistent with the rest of the pages
        </Sent>

        <Timestamp>10:24 AM</Timestamp>

        <Received pos="first">
          did you ever clean up the AbortController and loadedPages state
        </Received>
        <Received pos="last">that restore loop looked fragile</Received>

        <Sent pos="first">
          yes, both files got converted to <code>useInfiniteQuery</code>
        </Sent>
        <Sent pos="middle">
          the query key changes when search or type changes — TanStack cancels
          the in-flight fetch automatically via its own abort signal. no more{" "}
          <code>abortRef</code>, no more <code>AbortError</code> catch
        </Sent>
        <Sent pos="last">
          <code>loadedPages</code> state is gone too.{" "}
          <code>data.pages.flatMap(p ={">"} p.cards)</code> is the cards array
          and <code>fetchNextPage()</code> appends the next page to it — no
          dedup loop, no append flag
        </Sent>

        <Received pos="first">
          what about the scroll restore loop — pages 2 through N on mount
        </Received>
        <Received pos="last">
          that was the part that was hardest to follow
        </Received>

        <Sent pos="first">
          dropped. <code>initialPageParam</code> reads <code>?page=N</code>{" "}
          from the URL on mount and <code>getNextPageParam</code> returns{" "}
          <code>lastPageParam + 1</code>, so pages continue from wherever the
          session ended
        </Sent>
        <Sent pos="last">
          the sentinel observer still calls <code>fetchNextPage()</code> guarded
          by <code>hasNextPage</code> — same pattern, half the wiring
        </Sent>

        <div className={styles.codeBubble}>
          {`const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: queryKeys.tcg.cards({ q: debouncedSearch, type }),
    queryFn: async ({ pageParam, signal }) => {
      const res = await fetch(\`/api/tcg/cards?page=\${pageParam}...\`, { signal });
      const cards = await res.json();
      return { cards, hasMore: cards.length >= PER_PAGE };
    },
    initialPageParam,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });

const cards = data?.pages.flatMap(p => p.cards) ?? [];

onScrollRef.current = () => {
  if (hasNextPage && !isFetchingNextPage) fetchNextPage();
};`}
        </div>

        <Received>what does all this show as a frontend dev</Received>

        <Sent pos="first">
          knowing when to split server vs client, not defaulting to all-client
        </Sent>
        <Sent pos="middle">
          understanding platform constraints — CSP, streaming SSR, Suspense
          boundaries, IntersectionObserver edge cases — and building the minimal
          fix for each
        </Sent>
        <Sent pos="last">
          and keeping state in the right place: URL for shareable view state,
          event handler refs for external callbacks, primitives for consistency
          across the system
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
