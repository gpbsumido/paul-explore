# paul-explore

[![CI](https://github.com/gpbsumido/paul-explore/actions/workflows/ci.yml/badge.svg)](https://github.com/gpbsumido/paul-explore/actions/workflows/ci.yml)

A personal playground and portfolio — somewhere between a sandbox and a showcase. Built to explore ideas, try patterns I find interesting, and have something real to point at when talking to people about how I work.

**[Live demo → paulsumido.com](https://paulsumido.com)**

---

## Key technical decisions

- **BFF auth pattern** — the browser never sees an access token. Next.js API routes call `auth0.getAccessToken()` server-side and forward the JWT to the Express backend, so credentials stay out of the network tab entirely.
- **No Apollo / no GraphQL client library** — the Pokédex calls PokeAPI's Hasura endpoint with plain `fetch`. GraphQL is just HTTP; a 10-line wrapper covers everything needed here without the 60 kB bundle cost of a full client.
- **Custom calendar grid, not FullCalendar** — FullCalendar's React support requires a paid license. The custom build keeps the bundle small, gives full control over the interaction model, and was the forcing function for writing the overlap layout algorithm (`layoutDayEvents`) that places simultaneous events side by side.
- **Real-user monitoring pipeline** — `web-vitals` observers beacon LCP, FCP, INP, CLS, and TTFB to a Postgres table on every page load. The `/vitals` dashboard shows P75 by metric, by route, and by app version — so every deploy either moves the numbers or it doesn't.
- **Optimistic updates with mid-flight assertions** — calendar mutations apply to the TanStack Query cache before the server responds (`onMutate`), roll back on error (`onError`), and invalidate all related ranges on settle (`onSettled`). Tests use MSW `delay()` to assert the cache state while the request is still in-flight — not just the end state.

---

## What works without logging in

The following pages are fully public — no account needed:

- **Landing page** (`/`) — hero, feature grid
- **Particle Lab** (`/lab/particles`) — interactive R3F particle network
- **Motion Lab** (`/lab/motion`) — Framer Motion demos
- **Pokémon TCG Browser** (`/tcg`) — browse, search, set and card detail pages
- **GraphQL Pokédex** (`/pokedex`) — search and filter all Pokémon
- **NBA Playoffs Bracket** (`/fantasy/nba/playoffs`) — bracket picker, debounced saves, public leaderboard
- **Thoughts** (`/thoughts/*`) — write-ups on design decisions

These pages require a login:

- **Calendar** (`/calendar`) — personal calendar with Google Calendar sync
- **Web Vitals** (`/vitals`) — real-user Core Web Vitals dashboard
- **NBA Stats** (`/nba`) — live player stats
- **Settings** (`/settings`)

---

## What's inside

### 🔐 Auth & Security

Auth0 integration via `src/proxy.ts` with a broad matcher covering all routes except Next.js static assets. Auth routes (`/auth/*`) are delegated to `auth0.middleware()` for the full OIDC flow. `/vitals` and `/settings` enforce the session — the middleware calls `auth0.getSession(req)` first (a local cookie decrypt, no network call) and redirects to login if there's no session; `auth0.middleware` only runs for authenticated requests and handles rolling session updates. Unauthenticated requests are bounced before `auth0.middleware` is even called, so they pay the minimum possible cost. The tight scope is intentional: `auth0.middleware()` makes a network call to Auth0 when a token needs refreshing, so running it on every page would add that latency to every page load. The middleware previously ran broadly, and TTFB data showed the cost across the whole app, so it was removed. Now it's back scoped to only the routes that actually need it. CSP is `script-src 'self' 'unsafe-inline'` — the `'unsafe-inline'` is required because Next.js App Router inlines RSC payload scripts (`self.__next_f.push(...)`) directly into HTML with no nonce, and `'strict-dynamic'` with nonces blocks them silently. The original nonce-based CSP caused a production incident where all JavaScript broke after the landing page went static (the nonce in the CDN-cached HTML no longer matched the nonce in the per-request middleware header). The real XSS protection is React's automatic JSX escaping — no `dangerouslySetInnerHTML` anywhere in the codebase means user-generated data never reaches the DOM as raw HTML.

After login, you land on the feature hub at `/` — a showcase grid of all features with dark mini-preview mockups inside each card and staggered entrance animations. `page.tsx` is a dynamic async server component that calls `auth0.getSession()` (a local cookie decrypt, no network call) and renders either `FeatureHub` for authenticated users or `LandingContent` for everyone else. Cards animate in on page load with a 75ms cascade; the dev-notes section below the grid is scroll-triggered. `FeatureHub.tsx` fetches user info (name, email) on mount via `GET /api/me`, which reads the Auth0 session cookie server-side and returns the two fields; skeleton bones show in the header while the request is in-flight. The H1 heading is intentionally not wrapped in the `reveal()` entrance animation — wrapping it caused the element to be `opacity-0` in the SSR HTML, which the browser excludes from LCP consideration, pushing LCP past 2.5s; the heading is visible on first paint and the name falls back to "there" while the `/api/me` fetch resolves rather than showing a skeleton span (which was a minor CLS source when the real name swapped in). Dev-notes cards show the full preview text (wraps to multiple lines) and cards in the same grid row stay equal height via `h-full` on the link and CSS grid's default `align-items: stretch`.

### ✨ Landing Page Hero

The hero uses a ShaderGradient WebGL scene (`@shadergradient/react`) as a full-viewport background — a B&W waterplane gradient with camera angles driven by mouse position. The camera angles (`cAzimuthAngle`, `cPolarAngle`) are live props updated via RAF-throttled `onMouseMove` — the handler writes to refs and a `requestAnimationFrame` callback flushes them to React state once per frame, so there's no setState spam on every pixel of cursor movement. ShaderGradient's `smoothTime` prop eases the camera to the target. A `bg-black/50` scrim sits between the gradient and the text so legibility never breaks even when the gradient sweeps bright.

A black CSS div is the fallback while WebGL loads, so LCP fires immediately on the H1 rather than waiting for the canvas. The H1 animates word-by-word via Framer Motion's `staggerContainer` + `wordReveal` variants using `initial={false}` in SSR so the words are visible in the HTML and only replay the entrance on the client — LCP isn't blocked by opacity-0.

The Three.js particle network that used to live in the hero is now at `/lab/particles` as its own interactive page — loading it behind everything on the landing page cost ~40kb of canvas code on every visit even for users who scrolled past. As its own route it loads only when navigated to and becomes something you can actually interact with.

### 🧪 Lab (`/lab`)

A route group for interactive technical experiments. The sticky nav mirrors the hub with a "Lab" badge and a back link. Each lab page handles its own full-viewport layout.

**Particle Lab** (`/lab/particles`) — the R3F rewrite of the original hero scene. 160 particles in two tiers (22 star anchors + 138 small), orbital swirl from tangential velocity bias, pairwise connection lines via a pre-allocated `Float32Array` buffer, and mouse attraction via world-space unprojection onto a z=0 plane. The glass control panel floats over the canvas with sliders for speed and connection distance, a color theme picker (5 palettes), and a mouse attraction toggle. Controls update React state; the R3F render loop reads the latest values from refs each frame with no re-render cost.

The R3F split (`ParticleScene.tsx` vs `ParticlesCanvas.tsx`) keeps the physics logic separate from the `<Canvas>` setup. `useMemo` owns all THREE.js object lifetime; `useFrame` runs the physics tick; `useEffect` disposes geometry and materials on unmount or particle count change. `ParticlesCanvas` is loaded with `ssr: false` via `next/dynamic` because WebGL requires the browser.

**Motion Lab** (`/lab/motion`) — six interactive Framer Motion demos on a single page: a spring physics playground with stiffness/damping/mass sliders and a drag-to-snap-back puck; a stagger grid of 12 colored tiles with a configurable interval and a Replay button; a reorderable list using `Reorder.Group`/`Reorder.Item`; a scroll-driven parallax scene with three layers at different scroll rates plus scale and rotation; a gesture card that tracks idle/hover/tap/drag state with a live state panel; and a shared layout demo where clicking a card expands it to an overlay via `layoutId` + `AnimatePresence`.

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

The browser calls PokeAPI through a `/api/graphql` proxy route (CSP `connect-src 'self'` + keeps the upstream URL out of the client bundle). Server-side renders page 1 via `fetchPokemonDirect` with `next: { revalidate: 3600 }` so repeated renders within an hour hit Next.js's data cache instead of re-hitting PokeAPI. Infinite scroll uses `useInfiniteQuery` with offset-based pagination — `getNextPageParam` returns `allPages.length * PAGE_SIZE` when the current page is full; `fetchNextPage()` appends each batch; `isLoading` and `isFetchingNextPage` drive the initial skeleton and load-more state. The server-fetched page 1 is passed as `initialData: { pages: [seedPage], pageParams: [0] }` with `staleTime: 30_000` so the grid is populated on first paint with no client-side skeleton. The same `IntersectionObserver` + event-handler ref pattern as the TCG browser fires `fetchNextPage`.

A collapsible "Show query" panel in the UI displays the live GraphQL query and variables — updates in real time as you type or switch type filters. Useful as a debugging aid and as a demo of how query variables work.

### 📅 Calendar

A full-stack personal calendar. Four views — day, week, month, year — all navigable with prev/next and a "Today" jump. Click any cell or time slot to open a create-event modal; click an existing event chip to edit or delete it. Events persist in PostgreSQL (Railway) and are scoped per user via Auth0.

**Calendar sharing**: each calendar can be shared with other app users as editor (can create/edit/delete events) or viewer (read-only). The owner invites by email from the Sharing tab in the calendar edit modal. Members appear in the calendar selector in the header with a person icon. Owners can update roles or remove members; members can leave via a leave button. If the calendar is two-way synced with Google Calendar, sharing also grants/revokes Google Calendar ACL entries — invite is fire-and-forget (non-blocking), removal is awaited and surfaces a `googleAclRemoved` flag so the frontend can warn if Google access wasn't fully revoked.

Each calendar has its own **sync mode**: Local only (app only, no Google Calendar needed), Push (imports events from an existing Google Calendar, read-only from Google), or Two-way (creates a Google Calendar in your account, full bidirectional sync via push webhooks). Hover over a calendar name in the header to edit it — the edit modal has Details and Sharing tabs.

You can also attach Pokémon cards to any event — useful for tournament prep or tracking what you're planning to bring to a trade meetup. The card search reuses the existing TCGdex browse endpoint with a debounced input. Card changes are staged locally while the modal is open and flushed to the backend in a single batch when you save, so it doesn't make API calls as you're still picking.

There's a write-up page at `/thoughts/calendar` (same iMessage format as the other thoughts pages) covering the architecture decisions — why date-fns, why a custom grid over FullCalendar, the BFF auth pattern, timezone handling, what a junction table buys you over a JSON column, the calendar sharing model, and the Auth0 email claim fix.

There's also a dedicated events section outside the grid. `/calendar/events` is a searchable, filterable list of all your events — title search runs client-side against whatever the backend returned, card name and date range filters hit the backend and re-fetch. `/calendar/events/[id]` is the detail view: full event info plus the attached card grid, SSR'd with the same `CalendarWithData` pattern -- an async server component (`EventDetailWithData`) fetches the event and its cards in parallel directly from the backend at request time, wrapped in a Suspense boundary with `EventDetailSkeleton` as the fallback and a `loading.tsx` for the route segment. Both pages share a layout with a sticky nav so neither one has to re-implement it.

`/calendar/countdown` is a separate page for date countdowns. A countdown stores a title, optional description, target date (Postgres `DATE`, not `TIMESTAMP` -- no time component, no timezone math), and a color. Countdowns are managed with a `useCountdowns` hook using `useInfiniteQuery` with cursor-based pagination (`COUNTDOWN_PAGE_SIZE = 50`; composite `"YYYY-MM-DD__<uuid>"` cursor keeps page boundaries stable across inserts and deletes). The hook uses a single unscoped query key `["calendar", "countdowns"]` rather than a date-windowed key like events: countdowns need to surface across every visible month, so there is no date parameter to scope by. They are filtered client-side per day with `isSameDay(parseISO(c.targetDate), day)`. Countdown chips across all four views use the same visual style as `EventChip` — `border-l-[3px]` stripe in the countdown color, `${color}18` translucent fill, identical text/padding — with a small red dot on the far right as the only differentiator. In the month grid they share the `VISIBLE_CHIPS = 3` budget with events (events claim slots first). In the day and week all-day row, countdown chips appear alongside spanning event bars, auto-stacking into CSS grid rows on collision. In year view, countdown dots share the 3-dot-per-day limit in each `MiniMonth` cell. The `CalendarHeader` has a `+` button next to the "Countdowns" link (desktop only) that opens `CountdownModal` in create mode directly from any calendar view. In create mode, both `EventModal` and `CountdownModal` show an `[Event] [Countdown]` segmented toggle so you can switch between the two without closing. The `CountdownModal` shows a live "X days away / X days ago / Today!" preview as you type, derived from `differenceInCalendarDays(parseISO(targetDate), new Date())`.

The frontend uses a BFF pattern: the browser calls Next.js API routes (`/api/calendar/events`) which attach an Auth0 access token server-side before forwarding to the Express backend — the token never reaches the browser. A `useCalendarEvents` hook owns all reads and writes: `useQuery` fetches the correct date window with `staleTime: 0` (calendar events can change on any device at any time, so every mount re-validates) and seeds from `initialEvents` via `initialDataUpdatedAt: Date.now() - 29_000` — telling TanStack the data is almost stale so a background re-fetch is queued shortly after mount without blocking the UI. Create, update, and delete all use `useMutation` with the full optimistic update lifecycle: `onMutate` cancels in-flight fetches, snapshots the cache, and applies the change immediately so the grid responds before the server round-trip completes; `onError` restores the snapshot if the write fails; `onSettled` broadcasts a prefix-scoped invalidation (`["calendar", "events"]`) that syncs every cached date range — not just the visible month — so multi-day events near month boundaries don't leave stale data in adjacent views.

First load performance: a `CalendarWithData` async server component fetches the current month's events directly from the backend at request time (bypassing the `/api/` proxy to avoid a loopback call). It's wrapped in a `Suspense` boundary backed by a route-segment `loading.tsx` -- a 42-cell pulse skeleton that streams in the HTML shell. When the server fetch resolves, `CalendarContent` receives `initialEvents` and `useCalendarEvents` seeds from that data without firing a redundant client-side fetch. DayView, WeekView, YearView, and EventModal are lazy-loaded with `next/dynamic` so only CalendarGrid -- the LCP element -- ships in the initial bundle. Each lazy view has a dimension-matching skeleton as its `loading` fallback (`DaySkeleton`, `WeekSkeleton`, `YearSkeleton` in `CalendarSkeletons.tsx`) so switching views for the first time doesn't cause a layout shift — the skeleton holds the exact same height as the real view while the chunk downloads. A `/dev/skeletons` hub page (dev-only, 404s in production) shows all skeletons side by side with their real counterparts for visual comparison. Month cells use a fixed `h-[128px] sm:h-[132px]` with `overflow-hidden` instead of `min-h` so every cell is the same height regardless of event count -- the maximum content (3 chips + gaps + "+N more") fits comfortably at both breakpoints and nothing shifts when events load in.

Built without a calendar library — `date-fns` handles all date math (grid construction, view navigation, slot matching). This was a deliberate choice: FullCalendar's full React support requires a paid license, and the custom build keeps the bundle small and gives full control over the interaction model.

All four view components are wrapped in `React.memo` and `CalendarContent` uses `useCallback` on the callbacks passed to them — without stable prop references, memo is effectively useless. `layoutDayEvents` (the overlap layout algorithm) is wrapped in `useMemo` in both `DayView` and `WeekView` so the O(n²) computation only reruns when events actually change, not on every render triggered by unrelated state like the modal.

Event rendering matches Google Calendar's conventions: multi-day timed events (ones that cross midnight) float up to the all-day row as spanning bars; single-day timed events are absolute-positioned blocks in the time grid that span their actual duration; multi-day events in the month view appear on every day they cover, with a flat continuation-bar style on days after the start.

### 📊 Web Vitals Dashboard

Real-user Core Web Vitals collected from every page load and displayed on a protected dashboard at `/protected/vitals`. Five metric cards show the global P75 for LCP, FCP, INP, CLS, and TTFB with color-coded Good/Needs work/Poor ratings. A by-page table breaks the same numbers down per route. A version trend section (unovis sparklines) shows P75 across the last 5 app versions so you can see whether a deploy actually moved the numbers. The chart renders a matching skeleton grid on the server and during hydration so the section height is always reserved -- unovis needs the DOM, and without this the chart popping in after hydration causes CLS. The skeleton height accounts for the `VisAxis type="x"` tick labels, which render below the `VisXYContainer` boundary and add ~20px beyond the plot area height; both the skeleton and the real chart wrapper use a shared `CHART_CONTAINER_HEIGHT` const so they always match.

The collection pipeline: `WebVitalsReporter` (root layout client component) registers all five `web-vitals` observers once on mount and beacons each metric to `/api/vitals` when it fires. Each beacon includes `app_version`, which is read directly from `package.json` at build time — no manual env var needed. The Next.js API route validates the shape and forwards to the Express backend, which writes one row per event into the `web_vitals` Postgres table.

The dashboard nav has a version selector. Selecting "From v0.3.1" filters all aggregates to rows from that version onwards using a semver-aware Postgres comparison (`string_to_array(app_version, '.')::int[]`) so `0.10.0 > 0.9.0` works correctly. The selected version is a URL param so filtered views are shareable. On first load with no URL param, the page fetches all-time aggregates while defaulting the dropdown to the latest version — this lets all three backend fetches (versions, by-version trend, and summary/by-page) run in a single `Promise.all` rather than waiting for the versions response before starting the main data fetch. Picking a version from the dropdown then navigates to `?v=X` and re-fetches filtered data correctly.

Formatting: timing metrics below 1000ms display as rounded milliseconds (`340ms`), at or above 1000ms as one-decimal seconds (`2.4s`). CLS stays as a 3-decimal dimensionless score (`0.042`). Pages under 5 samples are excluded from the by-page table.

The root `/` is now a dynamic server component that calls `auth0.getSession()` directly and renders either the hub or the landing page. `auth0.getSession()` is a local cookie decrypt with no network call, so the dynamic render cost is negligible. Previously the landing page was statically pre-rendered and the middleware redirected authenticated users to `/protected`; after the route restructure, both states share the same URL and the page decides which to render server-side.

### 🏆 Fantasy League History

ESPN fantasy league data by season. Teams sort by final standings, expand to show their full roster with positions. Season selector spans back to the league's first year. Glassmorphism card design because I wanted to try it and the gradient background made it work.

### 🏀 NBA Playoffs Bracket Picker

An interactive bracket picker at `/fantasy/nba/playoffs`. Pick the winner and series length of every first-round matchup, and the selections propagate forward: later-round slots show the abbreviation of whoever you picked to advance rather than "TBD". A `PRECEDING` map encodes which earlier matchup feeds each TBD slot, and a `resolveTeam` function walks it to surface the live abbreviation. Buttons for unresolved TBD slots are disabled so you can't pick a winner before picking who they play.

User edits are tracked separately from server picks. A `useMemo` merges them — `{ ...(serverPicks ?? {}), ...userEdits }` — so the component always sees the latest combined view without any effect-based initialization. The first version used `useEffect` + `setState` to seed picks from the server response; ESLint's `react-hooks/set-state-in-effect` flagged it correctly, and the `useMemo` pattern is both cleaner and avoids the cascading render.

Picks save automatically via a debounced PUT. A `userHasPickedRef` starts false and flips on first interaction — the save effect bails early until that flag is set, so loading server data on mount never triggers a spurious write. A `SaveIndicator` component shows "Saving..." and "Saved" states.

The Finals card extends the series card with two extra inputs: combined score of the last game (used as a tiebreaker in the leaderboard scoring) and Finals MVP. Both use local component state rather than controlled inputs tied to the parent, so keystrokes accumulate correctly in tests where the mock `onPick` doesn't update the prop.

A public leaderboard sits below the bracket. It proxies to the portfolio API which scores all submitted picks against actual results and returns ranked entries with a per-round breakdown. The current user's row highlights in orange — `currentUserSub` comes from the `/api/me` query and is matched against `entry.sub`. The leaderboard response is cached at `s-maxage=300`.

The bracket is a three-column grid at `lg:` — East rounds, Finals, West rounds. Below that breakpoint, each conference is an independently scrollable row with `overflow-x-auto` and negative-margin bleed to extend edge-to-edge. The West column uses `lg:flex-row-reverse` to mirror its round order so WCF sits visually closest to the Finals column at wide viewports while still scrolling left-to-right on mobile.

There's a write-up at `/thoughts/playoffs` covering the derived-state pattern, TBD resolution, the debounced save guard, and the responsive layout decisions.

---

## Deployment

| Layer       | Platform               | URL                        |
| ----------- | ---------------------- | -------------------------- |
| Frontend    | Vercel + Cloudflare CDN | paulsumido.com            |
| Backend API | Railway                | api.paulsumido.com         |
| Auth        | Auth0                  | (managed)                  |
| Database    | PostgreSQL on Railway  | (internal)                 |

CI runs on GitHub Actions — lint, typecheck, and full test suite on every push to `main`/`develop` and on PRs. A failing check blocks the Vercel deploy.

---

## Tech stack

| Layer         | Choice                                      |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 16 (App Router)                     |
| Language      | TypeScript                                  |
| Styling       | Tailwind CSS v4 + custom CSS tokens         |
| Auth          | Auth0 (`@auth0/nextjs-auth0`)               |
| Runtime       | React 19                                    |
| Animation     | Framer Motion (`framer-motion`)             |
| 3D / WebGL    | Three.js + React Three Fiber (`@react-three/fiber`) |
| WebGL hero    | ShaderGradient (`@shadergradient/react`)    |
| Data fetching | TanStack Query v5                           |
| Charts        | unovis (`@unovis/react`)                    |
| Monitoring    | Vercel Speed Insights                       |
| Linting       | ESLint (Next.js config)                     |
| Bundle        | `@next/bundle-analyzer` (`npm run analyze`) |

---

## Run locally

Requires Node.js 18+ and an Auth0 account (free tier works).

**1. Clone and install**
```bash
git clone https://github.com/gpbsumido/paul-explore.git
cd paul-explore
npm install
```

**2. Set up environment variables**
```bash
cp .env.example .env.local
```

**3. Fill in `.env.local`**
```env
AUTH0_SECRET=            # openssl rand -hex 32
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=         # from Auth0 application settings
AUTH0_CLIENT_SECRET=     # from Auth0 application settings
AUTH0_AUDIENCE=https://portfolio-api
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**4. Start the dev server**
```bash
npm run dev
```

**5. Open [http://localhost:3000](http://localhost:3000)**

TCG browser, Pokédex, and the lab pages work immediately. Calendar and Vitals require a valid Auth0 session.

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
│   ├── lab/              # Interactive technical experiments
│   │   ├── particles/    # R3F particle network with real-time controls
│   │   └── motion/       # Framer Motion interactive demo page
│   ├── landing/          # Landing page section components
│   ├── protected/        # Auth-gated hub page
│   ├── tcg/              # Pokémon TCG browser (browse, sets, card detail, pocket)
│   └── thoughts/         # Write-ups on design decisions (styling, search, TCG)
├── components/
│   ├── calendar/         # Calendar views, event modal, CardSearch, AttachedCardsList, EventCardTile
│   └── ui/               # Shared primitives (Button, IconButton, Input, Textarea, Modal)
├── hooks/                # useCalendarEvents, useCalendars, useCalendarMembers, useCountdowns, useDebounce
├── lib/                  # Shared utilities (calendar helpers, TCG helpers, auth0 client, backendFetch)
├── styles/               # Design tokens
└── types/                # TypeScript types (CalendarEvent, CalendarMember, EventCard, DraftCard, etc.)
```

---

## Things I learned / found interesting

- pre-allocating a `Float32Array` for Three.js line geometry at worst-case size and updating `drawRange` each frame is the right pattern for dynamic geometry that changes every tick; creating a new `BufferGeometry` per frame allocates and garbage-collects thousands of typed arrays per second which shows up as frame drops; one static buffer with a moving draw range costs nothing extra
- tangential velocity bias (nudge perpendicular to the radial direction) creates a natural orbital swirl without any explicit orbit math or angle tracking; just `vel.x += -ry/rLen * strength` and `vel.y += rx/rLen * strength` every frame and the particles naturally circle the center
- to do mouse attraction in Three.js you need world-space coordinates, not screen pixels; `Raycaster.ray.intersectPlane` unprojecting the NDC cursor position onto a `z=0` plane gives you the mouse position in the same coordinate space as the particles so the distance checks and force vectors work correctly
- `PointsMaterial` with `sizeAttenuation: false` keeps dots a fixed pixel size at any depth, which is what you want for a crisp pixel-dot look; `sizeAttenuation: true` scales the point by its distance from the camera which gives a perspective-blurry blob effect
- Tailwind v4's `@theme` block is actually a clean way to bridge CSS custom properties into utility classes — one token file, two systems
- `useSyncExternalStore` is underused for things like theme preference — avoids the hydration mismatch that `useState` + `useEffect` creates
- Next.js middleware for auth is straightforward, but CSP nonces and static generation are fundamentally at odds — Next.js inlines RSC payload scripts with no nonce attribute, so `'strict-dynamic'` blocks them; the fix (async root layout reading the nonce via `headers()`) works but forces every page into dynamic rendering; for sites with no `dangerouslySetInnerHTML`, `'self' 'unsafe-inline'` preserves static generation and is the standard approach for Next.js apps
- Per-row error states in a data table feel much better UX-wise than a single top-level error banner that wipes the whole table
- `IntersectionObserver` only fires on intersection _state changes_ — if the sentinel is already visible after the first load it never re-triggers; the fix is to reconnect the observer after each fetch (using `cards.length` as a dep) so `observe()` immediately reports current intersection state; TanStack Query's `fetchNextPage` replaces the manual `handleLoadMore` callback, and the stable event-handler ref holds the latest guard values without adding them to the observer effect's deps
- The event handler ref pattern (a ref whose `.current` is updated in a `useEffect` whenever deps change) is the right tool for external APIs that hold callback references — one ref instead of mirroring every piece of state individually; React 19 disallows writing to `ref.current` during render, so the update must happen in an effect rather than inline in the render body
- TanStack Query's built-in `signal` from the `queryFn` context handles request cancellation automatically — when a query key changes, any in-flight request for the old key is aborted; this replaces manual `AbortController` boilerplate in every component that fetched on user input
- The BFF (Backend for Frontend) pattern keeps auth tokens entirely server-side: the browser sends session cookies to Next.js, the Next.js API route calls `auth0.getAccessToken()` and forwards the JWT to the Express backend — the access token never appears in the browser's network tab
- `datetime-local` inputs produce naive strings with no timezone offset (e.g. `"2026-02-24T00:00"`); without explicit conversion, Postgres interprets them as UTC, which shifts events to the wrong day in non-UTC timezones — wrapping with `formatISO(parseISO(s))` adds the local offset before the value leaves the browser
- `react-hooks/set-state-in-effect` flags any function in the effect body that calls setState — even async ones — if the call is synchronous before the first `await`; the compliant pattern is to call setState only inside `.then()` / `.catch()` callbacks so the effect body itself never triggers a render
- for "optimistic-ish" form state (like card attachments that need to batch with the parent save), staging changes locally and flushing them all at once on submit is simpler than trying to sync individual operations as they happen — and it means the user never sees a half-saved state if they cancel
- streaming SSR with `Suspense` + async server components removes the "skeleton flash on arrival" problem without shipping any extra JavaScript — the skeleton streams immediately, the real data replaces it once the server fetch resolves
- `revalidate = 86400` (ISR) is the right default for content that rarely changes but does eventually change — static performance with eventual consistency, no manual cache invalidation; `generateStaticParams` + ISR together means the most-visited pages are pre-built and the long tail renders on demand
- TanStack Query's `initialData` option is the clean way to hand server-fetched data to a client component without it re-fetching on mount — set `initialData: { pages: [seedPage], pageParams: [0] }` (for infinite queries) or `initialData: seedValue` (for regular queries) with a short `staleTime`; TanStack treats the data as fresh for that window and skips the initial fetch; once stale it refetches in the background; this replaces the `hasServerData` ref one-time-skip pattern, which required manually seeding state, skipping the first effect run via a mutable ref, and switching to the "normal" fetch path afterward
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
- ShaderGradient exposes `cAzimuthAngle` and `cPolarAngle` as live props — updating them on `onMouseMove` with RAF throttling gives you free camera parallax; the library's own animation loop handles the WebGL redraw so there's no extra draw call cost per mouse event
- `@react-three/fiber` (R3F) separates scene setup from the render loop cleanly — `useMemo` owns geometry and material lifetime, `useFrame` owns the tick, `useEffect` disposes on unmount; the big win over imperative Three.js is that disposal is guaranteed even if a component hot-reloads mid-frame
- R3F's `<Canvas>` can't be server-rendered because WebGL requires `window` — always load it with `next/dynamic` + `ssr: false`; the `loading: () => null` fallback prevents a skeleton flash since the canvas paints solid black immediately on mount anyway
- `color-mix(in srgb, <token> 6%, rgba(255,255,255,0.04))` is a surprisingly clean way to tint glass cards per-feature: you get the pastel hue from the token plus a white-glass base, and the alpha works against any dark background without needing separate dark-mode overrides
- `AnimatePresence mode="wait"` and `next/dynamic` are fundamentally incompatible: `mode="wait"` holds the exiting component in the tree until its exit animation finishes, but `next/dynamic` suspends on first load of a chunk and React's Suspense cleanup fires while the exiting fiber is still mounted, producing a console warning; the fix is to drop `mode="wait"` and let exit and enter run concurrently
- glassmorphism cards need `perspective` set on the grid parent, not on individual cards — without a perspective origin the `rotateX` in `cardFlipIn` collapses to a flat scale and you lose the 3D flip effect; 1000px is far enough to be subtle, close enough to be visible
- spreading a spring preset that already contains `type: "spring"` and also writing `type: "spring"` explicitly in the same object literal produces a TypeScript `2783` error ("specified more than once"); the fix is to just spread the preset without re-stating the type
- TanStack Query's `initialData` in `useInfiniteQuery` is evaluated fresh on every render, not just once — if you provide it unconditionally, every query key change (including filtered ones) receives the seed and `staleTime` suppresses the real fetch for that window; the fix is to gate it: `initialData: seedPage && !filter1 && !filter2 ? { pages: [seedPage], pageParams: [0] } : undefined` so only the exact no-filter key gets seeded
- `AnimatePresence mode="popLayout"` is the right choice when mixing Framer Motion with `next/dynamic`: `mode="wait"` holds the exiting fiber in the tree until its exit animation completes, but `next/dynamic` triggers Suspense cleanup while the fiber is still mounted, producing console warnings; `mode="popLayout"` pops the exiting element out of document flow immediately (absolute-positioned) so the entering element takes its place without either stacking in the layout or triggering the Suspense conflict
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
- `useMutation`'s three lifecycle hooks give you a clean optimistic update pattern: `onMutate` cancels any in-flight queries that could overwrite your optimistic change (`queryClient.cancelQueries`), snapshots the current cache (`queryClient.getQueryData`), applies the change immediately (`queryClient.setQueryData`), and returns the snapshot as context; `onError` restores the snapshot so a failed write leaves nothing broken; `onSettled` (not `onSuccess`) triggers the re-fetch because it runs whether the mutation succeeds or fails — broadcasting a prefix-scoped invalidation (`queryClient.invalidateQueries({ queryKey: prefix })`) rather than a single targeted key covers every related cache entry; this matters when a single write can affect multiple cached ranges (e.g. a multi-day calendar event near a month boundary that is cached under both months' keys)
- a Next.js middleware that runs `auth0.middleware()` on every route will make a network round-trip to Auth0 on every page load, not just auth routes — this shows up in TTFB data across the whole app; the fix is a tight `config.matcher` that only lists routes where token refresh actually matters (the auth callbacks and the protected area), leaving everything else completely untouched
- middleware and static generation are orthogonal in Next.js: `export const dynamic = "force-static"` means the page is pre-rendered at build time and served from CDN cache, but middleware still runs at the edge on every request before the cached HTML is returned — so a page can be fully static and still enforce auth; `force-static` is also a build-time safety net that fails the build if anything dynamic ever gets added to the page component
- `opacity: 0` elements are excluded from the browser's LCP candidate set entirely — even if they're the largest element on the page, they don't count until they become visible; wrapping an H1 in an entrance animation that starts invisible delays LCP by the full animation duration on top of hydration time; the fix is to make the heading visible in the SSR HTML and only animate elements that aren't LCP candidates
- a plain text fallback ("there") is a better loading state than an inline skeleton span inside an H1: a skeleton span changes the line height and flow of the heading when the real name arrives, which registers as a layout shift; "there" and a first name are similar enough in length that the swap is invisible, and it reads naturally as a real sentence in the SSR HTML
- a fetch waterfall in a server component hurts TTFB just as much as a slow database query: if fetch B depends on a value from fetch A, the server sits idle waiting for A before B can even start; the fix is to decouple them — either pass a safe default that lets both start immediately, or restructure so the dependency is resolved after both fetches return rather than before either starts
- `placeholderData` in TanStack Query controls what the component sees while a new key's fetch is in-flight: `keepPreviousData` shows the previous key's data (good for pagination, where page 2 is related to page 1 and a blank flash would be jarring); `placeholderData: []` (or any static value) resets the visible result to that value on every key change (good for search, where the old query's results are completely unrelated to the new one and letting them linger would be misleading); choosing wrong produces either a blank flash between pages or stale results bleeding into a new search
- Auth0 access tokens don't include the `email` claim by default — only the ID token does; the access token is what the Express backend validates, so `req.auth.payload.email` is undefined without a post-login Action that calls `api.accessToken.setCustomClaim("email", event.user.email)`; if a backend middleware relies on email from the token (e.g. to upsert a users table), it silently no-ops on every request until the claim is added
- centralizing backend fetch auth in a BFF utility (`backendFetch.ts`) removes duplicated `getAccessToken()` calls across every API route; the utility fetches the token once and builds the Authorization header, making it easy to add or remove headers (like `X-User-Email`) across all routes in one place instead of hunting through 12 files
- a publicly exposed backend (Railway, fly.io, Render) can't safely trust custom headers like `X-User-Email` from the client — anyone with a valid JWT can set arbitrary header values; the right fix is to include the claim in the signed JWT itself (via an Auth0 Action) so the backend reads it from `req.auth.payload` which can't be spoofed; headers forwarded by a trusted BFF are a reasonable fallback but only safe when the backend is on a private network
- `position: fixed` + `getBoundingClientRect` is the right pattern for tooltips that need to break out of `overflow: hidden` containers (like calendar grid cells or event chips); CSS-only `position: absolute` approaches fail because the nearest positioned ancestor clips the tooltip; fixed positioning uses the viewport as the reference frame so the tooltip is always fully visible regardless of nesting
- bidirectional infinite scroll for a list of periods (days, weeks, months) uses `IntersectionObserver` sentinels at the top and bottom of a scroll container; appending to the bottom is straightforward, but prepending to the top shifts every item down by the new content's height — the fix is `useLayoutEffect` with no deps: save `scrollHeight` before `setState`, then add the height delta to `scrollTop` in the layout effect; `useLayoutEffect` runs synchronously after the DOM mutation and before the browser paints, so the scroll position is corrected before the user sees any jump; this is the same pattern chat apps use to load message history without losing position
- `IntersectionObserver` with a `root` scroll container fires relative to that container's viewport, not the window; `rootMargin` of `"300px 0px"` on the top sentinel and `"0px 0px 300px 0px"` on the bottom one pre-fetches the next period before the user actually hits the edge; guarding against duplicate period insertion in the functional `setState` updater (checking if `getPeriodKey(newPeriod)` already exists in the array) prevents double-appending when the sentinel stays in view after a state update
- `forwardRef` + `useImperativeHandle` is the right pattern for exposing imperative scroll commands to a parent: a nav header that needs to call `scrollToDate(date)` can't use props cleanly (you'd need a date value plus a separate trigger, and logic to reset both); a ref handle with a single `scrollToDate` method is one call at the use site and has no residual state to clean up
- `data-*` attributes are a clean bridge between a scroll listener and React state: a scroll listener can't close over React state without going stale, but it can query `[data-period-key]` on the DOM and read the key of the topmost visible element in real time; `parseISO` reconstructs a local `Date` correctly from a `"yyyy-MM-dd"` string — unlike `new Date("yyyy-MM-dd")` which assumes UTC midnight and shifts the date backward by the local offset in non-UTC timezones
- `key={view}` on the scroll container is the simplest way to reset a complex stateful component when a top-level mode changes: rather than threading view-change side effects through the component (clear the period list, re-center on today, re-initialize the observers), forcing a full remount by changing the key does all of that implicitly in one place; the tradeoff is a slightly longer first-paint for the new view, which is acceptable when the remount happens on user interaction rather than continuously
- making the root `/` route a context-aware dynamic server component is cleaner than a middleware redirect to `/protected`: `auth0.getSession()` is a local cookie decrypt with no network call, so the dynamic render penalty is negligible; logged-in users see the hub at `/` instead of being bounced to an implementation-detail URL; `force-static` on the landing page is gone, but the trade-off is worth it — clean URLs matter more than CDN caching on a personal portfolio's root route

---

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for a running log of changes/additions.
