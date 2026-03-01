# paul-explore

A personal playground and portfolio — somewhere between a sandbox and a showcase. Built to explore ideas, try patterns I find interesting, and have something real to point at when talking to people about how I work.

**[Live demo →](http://localhost:3000)** _(spin it up locally — instructions below)_

---

## What's inside

### 🔐 Auth & Security

Auth0 integration wired into a custom Next.js middleware proxy. Protected routes redirect unauthenticated users to login. CSP headers are set in middleware with `script-src 'self' 'unsafe-inline'` — the `'unsafe-inline'` is required because Next.js App Router inlines RSC payload scripts (`self.__next_f.push(...)`) directly into HTML with no nonce, and using `'strict-dynamic'` with nonces blocks them silently. The alternative (making the root layout async to read and propagate a nonce) opts every page out of static generation and hurts TTFB/LCP. The real XSS protection is React's automatic JSX escaping — no `dangerouslySetInnerHTML` anywhere in the codebase means user-generated data never reaches the DOM as raw HTML. The `/api/` paths are explicitly public so API routes don't trigger auth redirect.

After login, you land on the feature hub at `/protected` — a showcase grid of all six features with dark mini-preview mockups inside each card and staggered entrance animations. Cards animate in on page load with a 75ms cascade; the dev-notes section below the grid is scroll-triggered. `page.tsx` is a plain sync component with no auth calls so Next.js statically pre-renders it at build time — Vercel serves the HTML from CDN edge instead of a cold serverless function, cutting TTFB from ~2.1s to ~50ms. `FeatureHub.tsx` fetches user info (name, email) on mount via `GET /api/me`, which reads the Auth0 session cookie server-side and returns the two fields; skeleton bones show in the header while the request is in-flight. Dev-notes cards show the full preview text (wraps to multiple lines) and cards in the same grid row stay equal height via `h-full` on the link and CSS grid's default `align-items: stretch`.

### 🎨 Design System

Started from scratch with a token-driven palette in `src/styles/tokens.css`. Tailwind v4's `@theme` block bridges those tokens into utility classes so both systems share a single source of truth. Dark mode using custom `ThemeProvider` and `useSyncExternalStore` — defaults to OS preference, persists manual overrides to localStorage, no flash on load. Reusable UI primitives: `Button` (5 variants including danger, 4 sizes, loading state), `Input`, `Textarea`, `IconButton`, `Modal`, `Chip`.

### 🏀 NBA Stats

Live player stats pulled through a Next.js API proxy (`/api/nba/...`) that keeps the CSP `connect-src 'self'` intact. Stats load in batches with skeleton rows so the table feels alive while data comes in. Each player row handles its own error state independently — if a fetch fails (NBA API rate limits are real), the row shows an error state. Teams/players/stats routes serve with `public, s-maxage=300` and the historical league data route with `s-maxage=86400` — reduces repeat hits to the NBA and ESPN APIs while keeping data fresh enough.

### 🃏 Pokémon TCG Browser

Card browser powered by the `@tcgdex/sdk` TypeScript SDK, proxied through Next.js API routes to satisfy a strict `connect-src 'self'` CSP. Browse and search all cards with debounced filtering, a type filter pill bar, and infinite scroll backed by an `IntersectionObserver`. Page state (search query, type filter, scroll position) lives in the URL — shareable and back-navigable. The set index groups cards by series; each set has its own detail page with a full card grid. Individual card pages show attack costs, retreat cost, weakness, and resistance using actual Pokémon TCG energy icons parsed from effect text. A separate page covers the TCG Pocket expansion families.

Key implementation details: the browse page fetches page 1 server-side via an async server component + `Suspense` — real cards on first paint, no client-side skeleton flash. Server components own the static header/metadata for set and card pages (SDK called at render time); client components own the scroll and pagination. Infinite scroll uses `useInfiniteQuery` — `data.pages.flatMap(p => p.cards)` is the flat card list, `fetchNextPage()` appends the next page, and `hasNextPage` / `isFetchingNextPage` drive the sentinel and skeleton tiles. When a filter changes the query key changes and TanStack cancels the in-flight request automatically via its own abort signal. An `IntersectionObserver` sentinel with an always-fresh event handler ref (`onScrollRef`) triggers `fetchNextPage()` — the observer reconnects on `cards.length` change so it fires even if the sentinel is already in the viewport after a fetch.

Card detail, set detail, sets list, and pocket pages all export `revalidate = 86400` (ISR) — each rebuilds in the background at most once a day so visitors always hit a cached static response. The set detail page also has `generateStaticParams` that pre-renders the 10 most recent sets at build time so the most-visited pages are warm on deploy; `generateStaticParams` returns `[]` if the SDK list endpoint is down, and both `generateMetadata` and the page component use `.catch(() => null)` on the individual set fetch so a network timeout during static generation records a 404 for that set rather than crashing the build worker.

The API routes set explicit `Cache-Control` headers: `public, s-maxage=3600, stale-while-revalidate=86400` on all TCG endpoints so a CDN can hold results for an hour and revalidate in the background — visitors never wait on a revalidation. Error responses are left without a cache header so a transient failure can't get stuck in the CDN.

### 🔍 GraphQL Pokédex

A Pokémon browser built on the PokeAPI Hasura endpoint — search by name or filter by type, shows sprite, type badges, and base stat bars for every Pokémon. Uses plain `fetch` instead of Apollo or urql: GraphQL is just HTTP, and a 10-line wrapper covers everything needed here without the 60kb bundle cost of a full client library.

The browser calls PokeAPI through a `/api/graphql` proxy route (CSP `connect-src 'self'` + keeps the upstream URL out of the client bundle). Server-side renders page 1 via `fetchPokemonDirect` with `next: { revalidate: 3600 }` so repeated renders within an hour hit Next.js's data cache instead of re-hitting PokeAPI. Infinite scroll uses the same `IntersectionObserver` ref pattern as the TCG browser.

A collapsible "Show query" panel in the UI displays the live GraphQL query and variables — updates in real time as you type or switch type filters. Useful as a debugging aid and as a demo of how query variables work.

### 📅 Calendar

A full-stack personal calendar. Four views — day, week, month, year — all navigable with prev/next and a "Today" jump. Click any cell or time slot to open a create-event modal; click an existing event chip to edit or delete it. Events persist in PostgreSQL (Railway) and are scoped per user via Auth0.

You can also attach Pokémon cards to any event — useful for tournament prep or tracking what you're planning to bring to a trade meetup. The card search reuses the existing TCGdex browse endpoint with a debounced input. Card changes are staged locally while the modal is open and flushed to the backend in a single batch when you save, so it doesn't make API calls as you're still picking.

There's a write-up page at `/calendar/about` (same iMessage format as the other thoughts pages) covering the architecture decisions — why date-fns, why a custom grid over FullCalendar, the BFF auth pattern, timezone handling, what a junction table buys you over a JSON column, and what's still on the list.

There's also a dedicated events section outside the grid. `/calendar/events` is a searchable, filterable list of all your events — title search runs client-side against whatever the backend returned, card name and date range filters hit the backend and re-fetch. `/calendar/events/[id]` is the detail view: full event info plus the attached card grid, SSR'd with the same `CalendarWithData` pattern -- an async server component (`EventDetailWithData`) fetches the event and its cards in parallel directly from the backend at request time, wrapped in a Suspense boundary with `EventDetailSkeleton` as the fallback and a `loading.tsx` for the route segment. Both pages share a layout with a sticky nav so neither one has to re-implement it.

The frontend uses a BFF pattern: the browser calls Next.js API routes (`/api/calendar/events`) which attach an Auth0 access token server-side before forwarding to the Express backend — the token never reaches the browser. A `useCalendarEvents` hook fetches the correct date window for each view and re-fetches automatically on navigation.

First load performance: a `CalendarWithData` async server component fetches the current month's events directly from the backend at request time (bypassing the `/api/` proxy to avoid a loopback call). It's wrapped in a `Suspense` boundary backed by a route-segment `loading.tsx` -- a 42-cell pulse skeleton that streams in the HTML shell. When the server fetch resolves, `CalendarContent` receives `initialEvents` and `useCalendarEvents` seeds from that data without firing a redundant client-side fetch. DayView, WeekView, YearView, and EventModal are lazy-loaded with `next/dynamic` so only CalendarGrid -- the LCP element -- ships in the initial bundle. Each lazy view has a dimension-matching skeleton as its `loading` fallback (`DaySkeleton`, `WeekSkeleton`, `YearSkeleton` in `CalendarSkeletons.tsx`) so switching views for the first time doesn't cause a layout shift — the skeleton holds the exact same height as the real view while the chunk downloads. A `/dev/skeletons` hub page (dev-only, 404s in production) shows all skeletons side by side with their real counterparts for visual comparison. Month cells use a fixed `h-[128px] sm:h-[132px]` with `overflow-hidden` instead of `min-h` so every cell is the same height regardless of event count -- the maximum content (3 chips + gaps + "+N more") fits comfortably at both breakpoints and nothing shifts when events load in.

Built without a calendar library — `date-fns` handles all date math (grid construction, view navigation, slot matching). This was a deliberate choice: FullCalendar's full React support requires a paid license, and the custom build keeps the bundle small and gives full control over the interaction model.

All four view components are wrapped in `React.memo` and `CalendarContent` uses `useCallback` on the callbacks passed to them — without stable prop references, memo is effectively useless. `layoutDayEvents` (the overlap layout algorithm) is wrapped in `useMemo` in both `DayView` and `WeekView` so the O(n²) computation only reruns when events actually change, not on every render triggered by unrelated state like the modal.

Event rendering matches Google Calendar's conventions: multi-day timed events (ones that cross midnight) float up to the all-day row as spanning bars; single-day timed events are absolute-positioned blocks in the time grid that span their actual duration; multi-day events in the month view appear on every day they cover, with a flat continuation-bar style on days after the start.

### 📊 Web Vitals Dashboard

Real-user Core Web Vitals collected from every page load and displayed on a protected dashboard at `/protected/vitals`. Five metric cards show the global P75 for LCP, FCP, INP, CLS, and TTFB with color-coded Good/Needs work/Poor ratings. A by-page table breaks the same numbers down per route. A version trend section (unovis sparklines) shows P75 across the last 5 app versions so you can see whether a deploy actually moved the numbers. The chart renders a matching skeleton grid on the server and during hydration so the section height is always reserved -- unovis needs the DOM, and without this the chart popping in after hydration was a significant CLS source.

The collection pipeline: `WebVitalsReporter` (root layout client component) registers all five `web-vitals` observers once on mount and beacons each metric to `/api/vitals` when it fires. Each beacon includes `app_version`, which is read directly from `package.json` at build time — no manual env var needed. The Next.js API route validates the shape and forwards to the Express backend, which writes one row per event into the `web_vitals` Postgres table.

The dashboard nav has a version selector. Selecting "From v0.3.1" filters all aggregates to rows from that version onwards using a semver-aware Postgres comparison (`string_to_array(app_version, '.')::int[]`) so `0.10.0 > 0.9.0` works correctly. The selected version is a URL param so filtered views are shareable. Defaults to the latest version on first load.

Formatting: timing metrics below 1000ms display as rounded milliseconds (`340ms`), at or above 1000ms as one-decimal seconds (`2.4s`). CLS stays as a 3-decimal dimensionless score (`0.042`). Pages under 5 samples are excluded from the by-page table.

TTFB on the landing page was fixed by moving the logged-in redirect from the page component to `proxy.ts` middleware. The page was calling `auth0.getSession()` only to bounce authenticated users to `/protected` -- that single call forced Next.js to treat the page as dynamic and re-render it server-side on every request. With the redirect in middleware (which runs anyway), `page.tsx` becomes a plain sync function and Next.js statically pre-renders it at build time.

### 🏆 Fantasy League History

ESPN fantasy league data by season. Teams sort by final standings, expand to show their full roster with positions. Season selector spans back to the league's first year. Glassmorphism card design because I wanted to try it and the gradient background made it work.

---

## Tech stack

| Layer       | Choice                              |
| ----------- | ----------------------------------- |
| Framework   | Next.js 16 (App Router)             |
| Language    | TypeScript                          |
| Styling     | Tailwind CSS v4 + custom CSS tokens |
| Auth        | Auth0 (`@auth0/nextjs-auth0`)       |
| Runtime     | React 19                            |
| Data fetching | TanStack Query v5               |
| Charts      | unovis (`@unovis/react`)            |
| Monitoring  | Vercel Speed Insights               |
| Linting     | ESLint (Next.js config)             |
| Bundle      | `@next/bundle-analyzer` (`npm run analyze`) |

---

## Getting started

You'll need Node.js 18+ and an Auth0 account (free tier works fine).

```bash
# Clone and install
git clone https://github.com/paulsumido/paul-explore.git
cd paul-explore
npm install
```

Create a `.env.local` file:

```env
AUTH0_SECRET=<a long random string — run: openssl rand -hex 32>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://<your-auth0-domain>
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/
├── app/
│   ├── api/calendar/     # BFF proxy routes for calendar (GET/POST/PUT/DELETE)
│   ├── api/nba/          # NBA API proxy routes
│   ├── api/tcg/          # TCGdex SDK proxy routes
│   ├── api/vitals/       # BFF proxy for web vitals ingestion (POST) and dashboard reads (GET)
│   ├── calendar/         # Calendar page + CalendarContent
│   │   └── events/       # Events list (/calendar/events) + detail (/calendar/events/[id])
│   ├── fantasy/nba/      # Fantasy league history + player stats pages
│   ├── landing/          # Landing page with preview
│   ├── protected/        # Auth-gated hub page
│   ├── tcg/              # Pokémon TCG browser (browse, sets, card detail, pocket)
│   └── thoughts/         # Write-ups on design decisions (styling, search, TCG)
├── components/
│   ├── calendar/         # Calendar views, event modal, CardSearch, AttachedCardsList, EventCardTile
│   └── ui/               # Shared primitives (Button, IconButton, Input, Textarea, Modal)
├── hooks/                # useCalendarEvents, useDebounce
├── lib/                  # Shared utilities (calendar helpers, TCG helpers, auth0 client)
├── styles/               # Design tokens
└── types/                # TypeScript types (CalendarEvent, EventCard, DraftCard, etc.)
```

---

## Things I learned / found interesting

- Tailwind v4's `@theme` block is actually a clean way to bridge CSS custom properties into utility classes — one token file, two systems
- `useSyncExternalStore` is underused for things like theme preference — avoids the hydration mismatch that `useState` + `useEffect` creates
- Next.js middleware for auth is straightforward, but CSP nonces and static generation are fundamentally at odds — Next.js inlines RSC payload scripts with no nonce attribute, so `'strict-dynamic'` blocks them; the fix (async root layout reading the nonce via `headers()`) works but forces every page into dynamic rendering; for sites with no `dangerouslySetInnerHTML`, `'self' 'unsafe-inline'` preserves static generation and is the standard approach for Next.js apps
- Per-row error states in a data table feel much better UX-wise than a single top-level error banner that wipes the whole table
- `IntersectionObserver` only fires on intersection _state changes_ — if the sentinel is already visible after the first load it never re-triggers; fixing it with `cards.length` in deps (reconnect after each fetch) works but a stable observer + event handler ref is cleaner
- The event handler ref pattern (`ref.current = () => { ... }` assigned in the render body, no `useEffect`) is the right tool for external APIs that hold callback references — one ref instead of mirroring every piece of state individually
- `AbortController` is worth the boilerplate any time a fetch is triggered by user selection — rapid changes otherwise produce race conditions that are hard to reproduce and debug
- The BFF (Backend for Frontend) pattern keeps auth tokens entirely server-side: the browser sends session cookies to Next.js, the Next.js API route calls `auth0.getAccessToken()` and forwards the JWT to the Express backend — the access token never appears in the browser's network tab
- `datetime-local` inputs produce naive strings with no timezone offset (e.g. `"2026-02-24T00:00"`); without explicit conversion, Postgres interprets them as UTC, which shifts events to the wrong day in non-UTC timezones — wrapping with `formatISO(parseISO(s))` adds the local offset before the value leaves the browser
- `react-hooks/set-state-in-effect` flags any function in the effect body that calls setState — even async ones — if the call is synchronous before the first `await`; the compliant pattern is to call setState only inside `.then()` / `.catch()` callbacks so the effect body itself never triggers a render
- for "optimistic-ish" form state (like card attachments that need to batch with the parent save), staging changes locally and flushing them all at once on submit is simpler than trying to sync individual operations as they happen — and it means the user never sees a half-saved state if they cancel
- streaming SSR with `Suspense` + async server components removes the "skeleton flash on arrival" problem without shipping any extra JavaScript — the skeleton streams immediately, the real data replaces it once the server fetch resolves
- `revalidate = 86400` (ISR) is the right default for content that rarely changes but does eventually change — static performance with eventual consistency, no manual cache invalidation; `generateStaticParams` + ISR together means the most-visited pages are pre-built and the long tail renders on demand
- the `hasServerData` ref one-time-skip pattern is a clean way to hand server-fetched data to a client component without it re-fetching on mount — initialize state from the prop, skip the first effect run via a ref that flips to `false`, and after that everything works exactly like a fully client-side component
- `stale-while-revalidate` is what turns `s-maxage` from a hard wall into a background refresh — the CDN serves the stale cached response immediately (no wait) and kicks off a revalidation request in parallel; the next visitor gets the fresh version
- `private` in `Cache-Control` is important for query-specific or user-derived responses — without it a shared CDN could serve one user's result to another; only error responses should have no `Cache-Control` at all, so a transient failure can't get stuck in the CDN
- `React.memo` without `useCallback` on the parent's callbacks is a trap — memo compares props by reference, and an inline arrow function creates a new reference every render, so the memo never actually skips; the pattern only works when both sides do their part
- `useMemo` on derived arrays (like the event overlap layout) creates stable references that downstream memos can depend on; nesting the memos with clean dep arrays avoids the situation where everything recomputes together anyway
- `next/dynamic` in a server component creates two separate Suspense boundaries — one server-side (RSC stream) and one client-side (chunk download) — causing a double-skeleton flash; the correct pattern is a route-segment `loading.tsx` (shown once, during the RSC fetch) with a plain static import; in the App Router, client components are automatically code-split per route so `next/dynamic` adds nothing for route-local components and only introduces the double-render problem; `ThoughtsSkeleton` reuses the same CSS module classes as the real content so bubble shapes are pixel-identical and there is no layout shift on reveal
- Vercel Speed Insights is one import away from real-user Core Web Vitals data — `<SpeedInsights />` placed after the app tree means the beacon script loads asynchronously and never competes with first paint; field data (actual user sessions) takes a day or two to aggregate but lab scores show up immediately
- `navigator.sendBeacon` is the right delivery mechanism for analytics — a regular fetch can get cancelled when the browser tears down the page on navigation, sendBeacon queues the request at the OS level and guarantees delivery; the `Blob` wrapper is required to send JSON since sendBeacon defaults to text/plain otherwise
- the pathname ref pattern (`useRef` updated on pathname change, observers read from it at fire time) solves the SPA navigation accuracy problem cleanly — registering observers once per mount avoids duplicate registrations while the ref ensures each metric is tagged with the page the user was on when it fired, not the initial page
- `@next/bundle-analyzer` requires `--webpack` because Next.js 16 uses Turbopack by default — the analyzer is incompatible with Turbopack and throws if you omit the flag
- the most useful thing the bundle analyzer does is surface server-only libraries appearing in the client bundle: `jose`, `oauth4webapi`, and `openid-client` have no business in a browser; seeing them in the treemap is a signal that something is wrong, not just large
- `Auth0Provider` was wrapping the entire app and pulling the full Auth0 client SDK into every page load despite `useUser` being called zero times in the codebase — a quick grep confirmed it, the fix was three lines removed from the root layout; auth protection was always in the middleware and individual server components, not React context
- Next.js App Router's `icon.tsx` and `opengraph-image.tsx` file conventions generate favicons and OG images at build time using `ImageResponse` (Satori under the hood) without needing a separate CDN or pre-generated image files; the icon file produces `<link rel="icon">` automatically, and the OG image is served at `/opengraph-image` and referenced in metadata
- `openGraph.images` in page metadata overrides the file-based `opengraph-image.tsx` for that route — useful when you want a shared generator function but need the image URL to also appear in explicit metadata objects; the root layout carries the fallback so pages without their own metadata still get the right `og:image`
- extracting `TITLE` and `DESCRIPTION` as module-level consts in page files keeps the metadata DRY when the same strings need to appear in `title`, `openGraph.title`, `openGraph.description`, `twitter.title`, and `twitter.description` — five places that would otherwise all need updating together
- `auth0.middleware()` makes a network round-trip on every request; `auth0.getSession()` just reads the encrypted session cookie locally — calling middleware only for `/auth/*` routes and getSession everywhere else removes that TTFB hit from every protected page load
- the `initialEvents` seed pattern in `useCalendarEvents` is a clean handoff from server to client: set state from the prop, pre-mark the range as loaded, and the hook behaves exactly like normal from that point — no special casing needed in the effect or mutation handlers
- when a server component needs to fetch data, call the upstream directly rather than going through your own API routes — a loopback HTTP call to the same server wastes time and adds latency that shows up in TTFB
- `transition-all` is a quiet INP killer: the browser has to check every CSS property for changes on every animation frame, even if only opacity and transform are actually moving; replacing it with `transition-[opacity,transform]` or `transition-[border-color,box-shadow]` narrows the work to exactly what changes; on a page with 15+ simultaneously animating cards the difference is measurable
- entrance animation and hover transition conflict silently in CSS: if both set `transition-property` on the same element, the last rule wins and the other is dropped entirely with no warning; the fix is to separate them — outer wrapper div owns the entrance animation, inner element owns the hover transition, and neither interferes with the other
- `startTransition` is the right tool for state updates that trigger large re-renders: wrapping `setLoaded(true)` (which kicks off staggered animations across a grid of cards) or `router.push()` in a transition marks the work as non-urgent; React processes any pending input events first, which directly shortens INP
- calling `auth0.getSession()` (or any cookie/header read) in a page server component makes Next.js treat that route as dynamic even if the only reason for the call is a redirect; moving redirect-only session checks to middleware keeps the page component free of dynamic APIs so Next.js can statically pre-render it at build time -- the redirect still fires, it just happens in the layer that already runs per-request
- a page with no auth or per-request data that still has an async server component above a Suspense boundary will be dynamic by default; adding `export const revalidate = N` at the page level tells Next.js to cache the rendered RSC output and serve it from the CDN for N seconds -- no code change needed in the components themselves
- `next/dynamic` without a `loading` prop throws to the nearest Suspense boundary while the chunk downloads; for a modal that's only mounted on user interaction, the nearest boundary is often the root Suspense, which causes a full-page flash; explicit `loading: () => null` keeps the fallback local and silent
- the event detail page was the last remaining client-side-only data fetch in the calendar; converting it to an async server component with Suspense cut FCP from "blank -> skeleton -> content" (two round trips) to "skeleton -> content" (one server render delivers both the skeleton and the data)
- `transition-all` on hover effects that only change `border-color` and `box-shadow` makes the browser check every CSS property for changes on each frame; card hover effects across the TCG and calendar pages all changed to `transition-[border-color,box-shadow]` -- same visual result, measurably less per-frame work
- focus indicators (`:focus-visible` outlines) should not be transitioned; the browser's instant focus ring is more accessible than a fade, and removing the `transition-all` from those buttons is both a performance win and a WCAG improvement
- CSS grid's `align-items: stretch` makes every item in a row fill the tallest item's height automatically -- but only the grid item (the outer div) gets stretched; an inner element like a link or button needs `h-full` to fill that height and make the card background/border extend to match; `min-w-0` on the grid item is the prerequisite, since without it an item with non-wrapping text resists shrinking below its content width and overflows the column
- an unhandled exception inside `generateMetadata` or a page server component during static generation kills the build worker entirely -- not just that one page; `.catch(() => null)` on any external fetch that could time out lets the page fall through to `notFound()` and record a 404 for that route without affecting the rest of the build
- `min-h` on calendar day cells was the CLS source: each cell grew to fit its event count, so a cell with 3 chips was ~40px taller than an empty one; the layout shifted every time events loaded in or you navigated months; replacing it with a fixed `h-` plus `overflow-hidden` (calculated from the max content height at each breakpoint) makes every cell the same size regardless of events -- nothing moves
- skeleton bones need to match real element dimensions precisely, not just "approximately"; a title bone that's 14px when the real text renders at 16px, or a description with 2 lines when the real wraps to 3, will cause a layout shift when content loads in and the skeleton collapses or expands to meet it; the right approach is to measure the real element's computed line-height, padding, and gap values and set bone heights to match exactly, then confirm visually with a side-by-side dev tool like a `/dev/skeletons` preview route
- `aspectRatio` on skeleton cards that represent content-driven layouts (not media like images or videos) produces the wrong height at most viewport widths; a set card with `padding + logo + footer` adds up to a fixed ~88px regardless of width, so the skeleton should use `h-[88px]` not `aspectRatio: "3/2"` which scales with column width and ends up nearly double the real height at common breakpoints
- TanStack Query's `QueryClient` needs to live in `useState` (not as a module-level singleton) in a Next.js App Router app: a module-level client would be shared across all server renders and requests, leaking data between users; the `useState` pattern gives each server render its own instance while the browser naturally gets a stable singleton since state only initializes once on the client
- centralizing query keys in a typed factory file (`queryKeys.ts`) pays for itself immediately: without it, `invalidateQueries` calls are just string arrays that drift out of sync with their `useQuery` counterparts over time; with factories, TypeScript catches mismatches at compile time and renaming a key is a one-line change
- if a page needs user info but the info itself isn't needed for the first paint, don't call `getSession()` in the page component -- that makes Next.js treat the route as dynamic and bypasses static generation entirely; the better pattern is to make the page a plain sync component (so Next.js can pre-render it statically) and have a client component fetch the user info from a lightweight BFF route on mount; the static HTML arrives from CDN edge instantly and the user details fill in a moment later -- FCP and LCP are unaffected since the page skeleton is already painted
- when migrating a component from manual `useEffect + fetch + AbortController + setState` to TanStack Query, the query key is the main reactivity primitive: any value that would previously trigger `fetchLeague(newSeason)` in an effect just needs to live inside the `queryKey` array; when the key changes (e.g. `season` changes), TanStack Query triggers the fetch automatically, cancels any in-flight request via its own `signal`, and merges the cache; this replaces the `useRef + AbortController + useCallback + useEffect` stack entirely; the retry button also simplifies from re-calling the old callback to just calling `query.refetch()`
- `useQueries` is the right tool when you need to fire N independent queries in parallel where N is dynamic (comes from data, not known at component definition time); it returns a stable array of query results in the same order as the input, so `statsQueries[i]` always corresponds to `players[i]`; this replaces a `Promise.allSettled` batch loop and gives you granular per-item loading and error state for free; the `onSuccess` callback removed in v5 is replaced with a `useEffect` watching the relevant query's `.data` field

---

## Changelog

See [`src/changelog/changelog.md`](src/changelog/changelog.md) for a running log of changes/additions.
