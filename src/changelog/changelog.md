# Changelog

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
