# paul-explore

A personal playground and portfolio — somewhere between a sandbox and a showcase. Built to explore ideas, try patterns I find interesting, and have something real to point at when talking to people about how I work.

**[Live demo →](http://localhost:3000)** _(spin it up locally — instructions below)_

---

## What's inside

### 🔐 Auth & Security

Auth0 integration wired into a custom Next.js middleware proxy. Protected routes redirect unauthenticated users to login. CSP headers are generated per-request with nonces so inline scripts stay locked down without breaking `next/script`. The `/api/` paths are explicitly set to be public so API routes don't trigger auth redirect.

After login, you land on the feature hub at `/protected` — a showcase grid of all six features with dark mini-preview mockups inside each card and staggered entrance animations. Cards animate in on page load with a 75ms cascade; the dev-notes section below the grid is scroll-triggered. The hub is a client component (`FeatureHub.tsx`) handed user info from a thin server component that just calls `auth0.getSession()`.

### 🎨 Design System

Started from scratch with a token-driven palette in `src/styles/tokens.css`. Tailwind v4's `@theme` block bridges those tokens into utility classes so both systems share a single source of truth. Dark mode using custom `ThemeProvider` and `useSyncExternalStore` — defaults to OS preference, persists manual overrides to localStorage, no flash on load. Reusable UI primitives: `Button` (5 variants including danger, 4 sizes, loading state), `Input`, `Textarea`, `IconButton`, `Modal`, `Chip`.

### 🏀 NBA Stats

Live player stats pulled through a Next.js API proxy (`/api/nba/...`) that keeps the CSP `connect-src 'self'` intact. Stats load in batches with skeleton rows so the table feels alive while data comes in. Each player row handles its own error state independently — if a fetch fails (NBA API rate limits are real), the row shows an error state. Teams/players/stats routes serve with `public, s-maxage=300` and the historical league data route with `s-maxage=86400` — reduces repeat hits to the NBA and ESPN APIs while keeping data fresh enough.

### 🃏 Pokémon TCG Browser

Card browser powered by the `@tcgdex/sdk` TypeScript SDK, proxied through Next.js API routes to satisfy a strict `connect-src 'self'` CSP. Browse and search all cards with debounced filtering, a type filter pill bar, and infinite scroll backed by an `IntersectionObserver`. Page state (search query, type filter, scroll position) lives in the URL — shareable and back-navigable. The set index groups cards by series; each set has its own detail page with a full card grid. Individual card pages show attack costs, retreat cost, weakness, and resistance using actual Pokémon TCG energy icons parsed from effect text. A separate page covers the TCG Pocket expansion families.

Key implementation details: the browse page fetches page 1 server-side via an async server component + `Suspense` — real cards on first paint, no client-side skeleton flash. Server components own the static header/metadata for set and card pages (SDK called at render time); client components own the scroll and pagination. The `IntersectionObserver` uses a stable `[]` dep with a single event handler ref updated every render — no stale closures, no individual state mirrors. `AbortController` on every fetch prevents stale responses from overwriting data on rapid filter changes.

Card detail, set detail, sets list, and pocket pages all export `revalidate = 86400` (ISR) — each rebuilds in the background at most once a day so visitors always hit a cached static response. The set detail page also has `generateStaticParams` that pre-renders the 10 most recent sets at build time so the most-visited pages are warm on deploy.

The API routes set explicit `Cache-Control` headers: `public, s-maxage=3600, stale-while-revalidate=86400` on all TCG endpoints so a CDN can hold results for an hour and revalidate in the background — visitors never wait on a revalidation. Error responses are left without a cache header so a transient failure can't get stuck in the CDN.

### 🔍 GraphQL Pokédex

A Pokémon browser built on the PokeAPI Hasura endpoint — search by name or filter by type, shows sprite, type badges, and base stat bars for every Pokémon. Uses plain `fetch` instead of Apollo or urql: GraphQL is just HTTP, and a 10-line wrapper covers everything needed here without the 60kb bundle cost of a full client library.

The browser calls PokeAPI through a `/api/graphql` proxy route (CSP `connect-src 'self'` + keeps the upstream URL out of the client bundle). Server-side renders page 1 via `fetchPokemonDirect` with `next: { revalidate: 3600 }` so repeated renders within an hour hit Next.js's data cache instead of re-hitting PokeAPI. Infinite scroll uses the same `IntersectionObserver` ref pattern as the TCG browser.

A collapsible "Show query" panel in the UI displays the live GraphQL query and variables — updates in real time as you type or switch type filters. Useful as a debugging aid and as a demo of how query variables work.

### 📅 Calendar

A full-stack personal calendar. Four views — day, week, month, year — all navigable with prev/next and a "Today" jump. Click any cell or time slot to open a create-event modal; click an existing event chip to edit or delete it. Events persist in PostgreSQL (Railway) and are scoped per user via Auth0.

You can also attach Pokémon cards to any event — useful for tournament prep or tracking what you're planning to bring to a trade meetup. The card search reuses the existing TCGdex browse endpoint with a debounced input. Card changes are staged locally while the modal is open and flushed to the backend in a single batch when you save, so it doesn't make API calls as you're still picking.

There's a write-up page at `/calendar/about` (same iMessage format as the other thoughts pages) covering the architecture decisions — why date-fns, why a custom grid over FullCalendar, the BFF auth pattern, timezone handling, what a junction table buys you over a JSON column, and what's still on the list.

There's also a dedicated events section outside the grid. `/calendar/events` is a searchable, filterable list of all your events — title search runs client-side against whatever the backend returned, card name and date range filters hit the backend and re-fetch. `/calendar/events/[id]` is the detail view: full event info plus the attached card grid. Both pages share a layout with a sticky nav so neither one has to re-implement it.

The frontend uses a BFF pattern: the browser calls Next.js API routes (`/api/calendar/events`) which attach an Auth0 access token server-side before forwarding to the Express backend — the token never reaches the browser. A `useCalendarEvents` hook fetches the correct date window for each view and re-fetches automatically on navigation.

Built without a calendar library — `date-fns` handles all date math (grid construction, view navigation, slot matching). This was a deliberate choice: FullCalendar's full React support requires a paid license, and the custom build keeps the bundle small and gives full control over the interaction model.

All four view components are wrapped in `React.memo` and `CalendarContent` uses `useCallback` on the callbacks passed to them — without stable prop references, memo is effectively useless. `layoutDayEvents` (the overlap layout algorithm) is wrapped in `useMemo` in both `DayView` and `WeekView` so the O(n²) computation only reruns when events actually change, not on every render triggered by unrelated state like the modal.

Event rendering matches Google Calendar's conventions: multi-day timed events (ones that cross midnight) float up to the all-day row as spanning bars; single-day timed events are absolute-positioned blocks in the time grid that span their actual duration; multi-day events in the month view appear on every day they cover, with a flat continuation-bar style on days after the start.

### 📊 Web Vitals Dashboard

Real-user Core Web Vitals collected from every page load and displayed on a protected dashboard at `/protected/vitals`. Five metric cards show the global P75 for LCP, FCP, INP, CLS, and TTFB with color-coded Good/Needs work/Poor ratings. A by-page table below breaks the same numbers down per route — cells are individually color-coded so you can spot which pages are dragging down a specific metric.

The collection pipeline: `WebVitalsReporter` (root layout client component) registers all five `web-vitals` observers once on mount and beacons each metric to `/api/vitals` when it fires. The Next.js API route validates the shape and forwards to the Express backend, which writes one row per metric event into the `web_vitals` Postgres table. The dashboard page fetches `/api/vitals/summary` and `/api/vitals/by-page` in parallel from the server component with `cache: "no-store"`, so numbers are always current. Pages under 5 samples are excluded from the by-page table to keep single-visit noise out.

Formatting: timing metrics below 1000ms display as rounded milliseconds (`340ms`), at or above 1000ms as one-decimal seconds (`2.4s`). CLS stays as a 3-decimal dimensionless score (`0.042`).

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
- Next.js middleware for auth is straightforward until CSP nonces get involved — the nonce has to flow from the middleware through to the layout server component via request headers
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

---

## Changelog

See [`src/changelog/changelog.md`](src/changelog/changelog.md) for a running log of changes/additions.
