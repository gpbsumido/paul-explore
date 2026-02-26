# Changelog

## 2026-02-26 - version 0.2.4

- added "What I'm doing to improve these" section to `/protected/vitals` dashboard
- five cards (one per metric) each showing a short title and plain-English explanation of what is in the codebase to improve that score

## 2026-02-26 - version 0.2.3

- added `/protected/vitals` dashboard showing Core Web Vitals collected from users
- five metric cards at the top (LCP, FCP, INP, CLS, TTFB), each with the global P75 value, a rating badge, and the total sample count
- a by-page breakdown table below the cards, pages with fewer than 5 samples are excluded from the table to keep noise out
- `VitalsContent` formats timing metrics as seconds when >= 1000ms (`2.4s`) and as rounded milliseconds otherwise (`340ms`); CLS stays as a 3-decimal score (`0.042`)
- `src/types/vitals.ts` — shared TypeScript types for the vitals data shape (`MetricName`, `MetricSummary`, `PageVitals`, `VitalsResponse`)
- `page.tsx` fetches both backend endpoints in parallel with `Promise.all` and `cache: "no-store"` so the numbers are always fresh; falls back gracefully to empty state if the backend is down
- vitals card added to the feature hub with a `VitalsPreview` mini-preview showing all five metrics as compact rows with colored dots and a progress bar
- feature hub heading count now derives from `FEATURES.length` so it won't go stale when features are added

## 2026-02-26 - version 0.2.2

- `WebVitalsReporter` client component in `src/components/` — registers all five Core Web Vital collectors (LCP, CLS, FCP, INP, TTFB) once on mount and beacons each one to `/api/vitals` when they fire
- uses `navigator.sendBeacon` with a JSON `Blob` so reports make it through even when the user closes the tab mid-navigation; falls back to `fetch` with `keepalive: true` for browsers that don't support sendBeacon
- a pathname ref keeps the reported page accurate across SPA navigations without re-registering observers on every route change, the ref updates on each navigation, the observers read from it when they fire
- `<WebVitalsReporter />` added to root layout alongside `<SpeedInsights />`, both after the app tree so neither competes with first paint

## 2026-02-26 - version 0.2.1

- added `src/app/api/vitals/route.ts` for web vitals ingestion and dashboard reads
- `POST /api/vitals` is open (no session check) — validates metric name against a whitelist and required fields before forwarding to the Express backend; same shape as the backend's own validation so bad payloads fail fast at the edge
- `GET /api/vitals` fetches `/api/vitals/summary` and `/api/vitals/by-page` from the Express backend in parallel with `Promise.all`; attaches the Auth0 access token server-side so the token never reaches the browser (same BFF pattern as the calendar routes)
- returns `{ summary, byPage }` merged into a single response so the dashboard page only needs one fetch

## 2026-02-26 - version 0.2.0

- added Vercel Speed Insights to the root layout with Core Web Vitals (LCP, CLS, FCP, INP, TTFB) now flow into the Vercel dashboard
- `<SpeedInsights />` renders after the app tree so it never blocks first paint; Vercel injects the beacon script asynchronously
-

## 2026-02-26 - version 0.1.19

- added `error.tsx` route-segment error boundaries to `graphql`, `tcg/pokemon`, `calendar`, and `fantasy` so errors don't crash pages
- shared `RouteError` component with errot message, and a "Try again" button wired to Next.js's `reset()` function
- `reset()` re-renders just the failing route segment without a full page reload

## 2026-02-26 - version 0.1.18

- `ThoughtsSkeleton` widths for messages were collapsing, so changed up the width from percentage to actual widths

## 2026-02-26 - version 0.1.17

- added `next/dynamic` lazy loading to all five thoughts pages (styling, tcg, graphql, calendar, search-bar) — each content component now ships in its own JS chunk instead of being bundled with the page
- `ThoughtsSkeleton` component in `src/components/` — replicates the iMessage phone container, sticky top bar, and a mix of sent/received shimmer bubbles; shown as the `loading` fallback while the chunk downloads on SPA navigation
- the skeleton uses the same CSS module classes as the real pages so bubble shapes, border-radius curves, and layout stay identical to the real content; the typing indicator animation plays from the start
- `StylingContent` is the biggest winner since it imports `Button`, `Modal`, and `Input` — those primitives no longer land in any other page's initial bundle
- `SearchBarContent` also earns a separate chunk since it pulls in `SearchDemo` which includes the full client-side threading logic

## 2026-02-26 - version 0.1.16

- replaced the iMessage thread-list protected page with a full feature showcase hub
- sticky header with site name, user info, logout, and theme toggle — replaces the old top bar
- six feature cards in a responsive 1/2/3-column grid, each with a dark mini-preview mockup and staggered entrance animations on page load (75ms cascade)
- mini-previews are static mockups of the real feature UI: NBA stats table, league standings rows, TCG card grid, Pocket expansion list, calendar month grid, and GraphQL Pokédex rows
- "Open" link per card goes to the feature; "About" link (where it exists) goes to the write-up thoughts page
- dev-notes section below the feature grid shows compact link cards for all six thoughts pages, scroll-triggered with the same reveal animation
- entrance animations reuse the `reveal()` helper and `useInView` hook from the landing page so the pattern is consistent
- `FeatureHub.tsx` is the new client component — `page.tsx` is now three lines that fetch the Auth0 session and hand off user info
- `ThreadList.tsx` and `protected.module.css` superseded; `types/protected.ts` updated with `FeatureItem` and `ThoughtItem` types

## 2026-02-26 - version 0.1.15

- `React.memo` on `CalendarGrid`, `DayView`, `WeekView`, `YearView`, and `EventChip` — these were re-rendering on every CalendarContent state change (modal open/close, etc.) even when their props hadn't changed
- `MiniMonth` inside `YearView` also wrapped in `memo` since there are 12 on screen at once
- `useCallback` on `openCreateModal`, `openEditModal`, and `handleMonthClick` in `CalendarContent` — without stable callback references, memo on the view components was effectively useless since the props changed identity on every render
- `visibleEvents` memoized in `CalendarContent` from `calendarEvents.events` so the views see a stable array reference rather than depending on the hook's object wrapper being stable
- `useMemo` on `layoutDayEvents` in `DayView` (now `timedLayout`) — the overlap computation only reruns when `dayTimedEvents` actually changes, not on every render
- `useMemo` on `layoutDayEvents` for all 7 columns in `WeekView` (now `timedLayouts`) — computed once per events/navigation change instead of inline in the render loop on every paint
- `weekStart` and `weekDays` memoized in `WeekView` so downstream useMemos have stable deps; `allDaySpanned` also memoized

## 2026-02-26 - version 0.1.14

- added `Cache-Control` headers to all API proxy routes so the CDN (and browser) know what they're allowed to hold onto
- TCG card, set, sets, and series routes: `public, s-maxage=3600, stale-while-revalidate=86400` — data is stable for hours; CDN serves the cached response and revalidates in the background so the page never blocks on a revalidation
- GraphQL proxy: `private, max-age=60` — results vary by query body so CDN sharing would be wrong; `private` keeps it browser-only, `max-age=60` lets the browser reuse the same query result for a minute before hitting the proxy again
- NBA teams/players/stats routes: `public, s-maxage=300` — data updates at most daily; 5-minute CDN window keeps NBA API rate limits comfortable
- NBA league history route: `public, s-maxage=86400` — historical season data is immutable once the season ends, so a full day of CDN cache is fine
- calendar routes left untouched — auth-scoped, user-specific, should never be shared or held by a CDN
- error responses (4xx/5xx) never receive a `Cache-Control` header so a transient failure can't poison the CDN

## 2026-02-26 - version 0.1.13

- added ISR (`export const revalidate = 86400`) to the TCG card detail, set detail, sets list, and pocket pages — each page rebuilds in the background at most once a day so visitors always hit a cached static response
- `generateStaticParams` on the set detail page pre-renders the 10 most recent sets at build time (`STATIC_PRERENDER_COUNT = 10`) — newest sets get a warm static page right after each deploy since those are the most-visited after a release; TCGdex returns sets oldest-first so we take `.slice(-10)`; gracefully returns `[]` if the SDK is down at build time

## 2026-02-25 - version 0.1.12

- streaming SSR for GraphQL Pokédex and TCG browse — page 1 is now fetched server-side so the grid renders on first paint instead of after a client-side effect
- `fetchPokemonDirect` added to `lib/graphql.ts` — calls PokeAPI directly from the server (no proxy needed) with `next: { revalidate: 3600 }` so repeated renders hit Next.js's fetch cache instead of PokeAPI every time
- `graphql/page.tsx` introduces `PokemonWithData` async server component + `GraphQLSkeleton` — Suspense boundary streams the skeleton immediately while the server fetch resolves
- `GraphQLContent` accepts an `initialData` prop; pre-seeds `pokemon`, `total`, and `loadedKey` state from it and skips the initial `useEffect` fetch via a `hasServerData` ref
- `tcg/pokemon/page.tsx` follows the same pattern: `BrowseWithData` fetches page 1 via the TCGdex SDK directly, `BrowseSkeleton` shows the filter bar + card grid placeholders during the stream
- `BrowseContent` accepts `initialCards`; skips page-1 fetch when server data exists and URL has no active filters; if `?page=N` is in the URL it still loads pages 2–N to restore scroll position
- protected page header and footer are now sticky — changed `min-height: 100dvh` to `height: 100dvh` on `main` and added `overflow-y: auto; min-height: 0` to `.threadList` so only the thread list scrolls
- both pages fall back gracefully when the upstream is unavailable at server time — the client components handle it the same way they always did

## 2026-02-25 - version 0.1.12

- added GraphQL Pokédex at `/graphql` — search and filter
- `/api/graphql` proxy route forwards POST bodies to the upstream endpoint, keeping the URL server-side and `connect-src` locked to same-origin
- `src/types/graphql.ts` — PokeAPI response shapes (`Pokemon`, `PokemonListResult`, `GraphQLResponse`), `POKEMON_TYPES` const, `PAGE_SIZE`
- `src/lib/graphql.ts` — query strings (`LIST_QUERY`, `LIST_BY_TYPE_QUERY`), `buildPokemonQuery`, `fetchPokemon`, sprite/name/stat helpers, `POKEMON_TYPE_COLORS`
- live "Show query" panel in the browser: collapses/expands to show the current GraphQL query + variables, updates as you search or switch type
- loading state is derived (`loadedKey !== filterKey`) same pattern as the calendar and TCG browser — no extra setState in the effect body
- `raw.githubusercontent.com` added to `img-src` CSP for PokeAPI sprites
- `/api/` paths skip the auth redirect in `proxy.ts` — API route handlers manage their own auth where needed
- added `/thoughts/graphql` write-up: why GraphQL over REST, why plain fetch over Apollo, how Hasura auto-generates the schema, the proxy pattern, query variables vs interpolation
- two new threads added to the protected page: GraphQL Pokédex and GraphQL thoughts
- GraphQL Pokédex section added to the landing page (indigo gradient, mock browser UI)
- Calendar and GraphQL cards added to FeaturesSection; grid changed to `sm:grid-cols-2 md:grid-cols-3` to accommodate 6 features

## 2026-02-24 - version 0.1.11

- updated event modal styling
- end-before-start inline warning shows under the date row when end < start
- card search results now show an explicit "Add" button per row instead of click-anywhere, and display a spinner while the fetch is in-flight instead of plain "Searching…" text
- quantity field replaced with a +/− stepper
- added placeholder for card search so user's know what to do
- added Calendar feature to landing page

## 2026-02-24 - version 0.1.10

- added `Tooltip` UI primitive — renders at a fixed screen position so it escapes `overflow:hidden` containers
- time-grid event blocks in DayView and WeekView get a `min-w-[40px]` floor so still visible if too many
- time-grid event blocks (`block` variant) go solid on hover — translucent stripe at rest so the grid stays readable, full event color + white text on mouse-over; 150ms ease transition on background and text color
- fixed overlapping timed events in day and week views, side-by-side instead
- added `layoutDayEvents` to `lib/calendar.ts`: assign each event a column index, then computes the total concurrent columns for its overlap group so each event gets exactly `1/N` of the available width
- removed now-unnecessary `parseISO` import from DayView (event geometry is fully computed in the lib)
- fixed multi-day event display across all calendar views — events now show on every day they cover, not just their start day
- added `spanningEventsForDay` and `singleDayTimedEventsForDay` helpers to `lib/calendar.ts`
- updated `eventsForDay` and `allDayEventsForDay` in the lib to use overlap checks (`startOffset <= 0 && endOffset >= 0`) fixing the year view event dots and month grid too
- multi-day timed events now go in the all-day row in both day and week view
- timed events in day and week view are now absolutely positioned blocks that span their actual duration
- month view: multi-day events appear on each day they cover; continuation days get a flat bar style (no left border stripe) so you can visually tell the event started on an earlier day
- added `EventChip` `continuation` and `block` props — `continuation` for multi-day overflow days in the month grid, `block` for height-filling time-grid use
- extracted `VISIBLE_CHIPS`, `GUTTER_WIDTH`, and `isSpanning` as named constants/helpers in CalendarGrid and DayView/WeekView
- moved `singleDayTimedEventsForDay` out of WeekView into the lib so DayView could reuse it without copy-pasting

## 2026-02-23 - version 0.1.9

- added a calendar about page at `/calendar/about` — same iMessage write-up format as the other thoughts pages, covers why date-fns over moment, the BFF auth pattern, junction table vs JSON column, timezone handling, what I'd still improve
- "About" link added to the calendar header next to Events
- persist read threads and display according to if read or not

## 2026-02-23 - version 0.1.9

- added an events list page at `/calendar/events` — searchable and filterable
- event detail page at `/calendar/events/[id]` — shows event info and a card grid
- "Events" link added to the calendar header next to the view switcher
- added `fetchEvent` and `searchEvents` to `lib/calendar.ts`; `EventSearchFilters` type lives in `types/calendar.ts`

## 2026-02-23 - version 0.1.8

- functionality to attach Pokémon cards to calendar events (can track what you're bringing or targeting to event?)
- new `event_cards` table in the DB, card search in the event modal with debounced input reusing the our browse endpoint
- cards are staged locally while editing and only written to the backend on save — keeps it from making a bunch of requests while you're still picking cards
- extracted `useDebounce` to its own hook and `CardResume` type to `lib/tcg.ts` since both the TCG browser and the card search needed them

## 2026-02-23

- connect calendar to backend
- created API routes (`/api/calendar/events`, `/api/calendar/events/[id]`) that proxy to the Express backend with Auth0 access tokens attached server-side — token doesn't touch browser
- added `fetchEvents`, `createEvent`, `updateEvent`, `deleteEvent` client functions in `src/lib/calendar.ts`
- new `useCalendarEvents` hook (`src/hooks/useCalendarEvents.ts`) — fetches events for the current date window, re-fetches on navigation, keeps local state in sync after mutations; `loading` is derived from whether the current range has been resolved so no setState fires synchronously in the effect body
- `CalendarContent` replaces local `useState` array with the hook; date window is computed from `currentDate + view` (month view covers the full grid including overflow days)
- `EventModal` `onSave`/`onDelete` are now async — buttons disable and show "Saving…"/"Deleting…" while in flight, inline error shown on failure
- fixed timezone offset bug — `datetime-local` inputs produce naive strings (no TZ); now wrapped with `formatISO(parseISO(...))` before sending so Postgres stores the correct UTC moment and events land in the right day box on read back
- Auth0 custom API registered so the SDK issues RS256 JWTs instead of opaque/JWE tokens that `express-oauth2-jwt-bearer` can't verify
- `AUTH0_AUDIENCE` added to frontend `.env.local` and `authorizationParameters.audience` set in `Auth0Client` so the token carries the right audience claim
- added `toCalendarEvent` row mapper in `db.js` so all calendar queries return camelCase (`startDate`, `endDate`, `allDay`) instead of raw Postgres snake_case

## 2026-02-23

- added `/calendar` page with different views, and with navigation
- installed `date-fns` for all date math replacing Moment.js which i used to use for rojects since it's lighter
- clicking cells or events (chip) opens modal to create or edit
- new `Calendar Event`
- new chip, iconButton, textArea primatives

## 2026-02-22

- added metadata across all pages — root layout title/description, static exports for TCG browse/sets/pocket pages, `generateMetadata` for set detail and card detail pages using SDK-fetched name

## 2026-02-22

- `AbortController` on fantasy NBA fetches — `LeagueContent` aborts on season switch, `StatsContent` aborts on team switch including mid-batch with loop exit guard on `signal.aborted`

## 2026-02-22

- `AbortController` on all card fetches — each new fetch aborts the previous in-flight request, preventing stale responses from overwriting newer data on rapid filter changes
- `hasMore` now uses `>= PER_PAGE` instead of `===` for defensive API compatibility
- `Number.isNaN` guard on `initialPageRef` to handle malformed `?page=` params

## 2026-02-22

- refactored infinite scroll ref pattern — replaced multiple state mirrors with a single event handler ref (`onScrollRef`) updated every render; observer always calls a fresh closure, page number is plain state

## 2026-02-22

- page number synced to URL as user scrolls (`?page=N`) on browse and set detail pages — back navigation and shared URLs restore scroll state by sequentially fetching pages 1–N on mount
- `Suspense` boundary added around `SetCardsGrid` to support `useSearchParams`
- skeleton cards while inside the grid during infinite scroll
- update the landing page with the tcg feature

## 2026-02-22

- added Pokemon TCG browser — browse/search cards with debounced search, deduplication, and filter, grouped by series, per-set card grids, and a card info page
- added specific page for PTCG Pocket
- created Next.js API route TCG proxies
- added `toPlain()` helper in `src/lib/tcg.ts` to strip circular `sdk`/`tcgdex` back-references from SDK model instances before JSON serialisation
- all card queries sort by `localId ASC` when calling API
- infinite scroll using `IntersectionObserver` — sentinel div at bottom of list triggers next page fetch when scrolled into view; `cardsLengthRef` prevents unintentonal fires during initial load
- URL filters on browse page so it's synced and doesn't reset scroll and are shareable by url
- `Suspense` boundary around `BrowseContent` in `page.tsx` as required by Next.js App Router for `useSearchParams()`
- updated CSP `img-src` in `proxy.ts` to allow `https://assets.tcgdex.net`; added `loading="lazy"` to all card and set images
- added `/thoughts/tcg` page covering the new pages

## 2026-02-18

- Created League History page for fantasy league that shows the teams, their record, players, and rank

## 2026-02-18

- Main page updated to shows previews of functionality and to use the design tokens so it respons to theme toggle
- removed some uneccessary threads since they basically do nothing
- update logout Auth0 strategy to remove confirmation before logout

## 2026-02-18

- made the search bar on the protected page functional — extracted `ThreadList` client component from the server page to keep auth server-side while enabling client-side filtering by name, href, and preview
- added `/thoughts/search-bar` page explaining the server/client split, filtering approach, trade-offs, with a live search demo
- aligned NBA stats page header to match the thoughts pages (two-line title, same chevron, 480px container)

## 2026-02-18

- added NBA Player Stats page at `/fantasy/nba/player/stats` — select a team, view player stats (PTS, REB, AST, STL, BLK), sortable columns, progressive batch loading with skeleton rows
- created Next.js API route proxies (`/api/nba/teams`, `/api/nba/players/[teamId]`, `/api/nba/stats/[playerId]`) to forward requests to the backend while keeping `connect-src 'self'` CSP intact
- updated `proxy.ts` to treat `/api/` paths as public so API routes skip the auth redirect
- added error handling per player row — failed stat fetches show an error row; clicking it opens a modal explaining NBA API rate limits and caching
- added "NBA Stats" thread to the protected page thread list
- stats page uses Tailwind utility classes (no CSS module), design tokens via `@theme` bridge, dark mode support, existing UI components (Button, Modal, ThemeToggle)

## 2026-02-17

- redirect to the protected page from the main page if logged in
- update style of protected page to match thoughts of design page (IOS messaging list)

## 2026-02-17

- added design system with design tokens (colors, spacing, typography, shadows, radii, z-index, transitions) in `src/styles/tokens.css`
- installed tailwind v4 on top of CSS — `@theme` block bridges tokens into tailwind utilities so both systems share the same values
- fixed global resets (`* { padding: 0 }`) overriding tailwind utilities by wrapping them in `@layer base`
- added ThemeProvider using `useSyncExternalStore` for localStorage + matchMedia subscriptions — defaults to OS preference, allows manual override, persists choice
- added ThemeToggle component
- created accessible UI primitives: Button (4 variants, 3 sizes, loading state), Input (label association, error/helper text, aria-describedby), Modal (portal, focus trap, escape/backdrop dismiss, scroll lock, focus restoration)
- added `/thoughts/styling` page explaining the styling decisions, trade-offs, and live component demos

## 2026-02-10

- added CSP headers in proxy.ts with per-request nonces for inline scripts, locked everything else down to same-origin
- layout.tsx reads the nonce from request headers so we can tag scripts with it
- set up postcss with autoprefixer
- styled protected page, use page.module.css as well as a specific module css for it
- created reusable components

## 2026-02-10

- added auth0 login/logout to the homepage using `@auth0/nextjs-auth0`
- created `src/lib/auth0.ts` for the auth0 client and `src/proxy.ts` to handle the auth routes
- main layout.tsx to use Auth0Provider and page.tsx and show login/logout depending on if you're signed in
- added route protection in proxy.ts so you get redirected to login if you try to hit any page besides the homepage without being logged in
- created some reusable components for main page and protected page
