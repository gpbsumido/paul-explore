# Changelog

## 2026-03-16 - version 0.6.2

- update landing page to have the consistent menu button we have everywhere else

## 2026-03-16 - version 0.6.2

- extracted all inline sticky nav bars into a single shared `PageHeader` component used across every page:
  - `src/components/PageHeader.tsx` — glassmorphic sticky nav with a breadcrumb trail (`breadcrumbs` prop), optional custom `left` slot, optional `right` slot for extra controls, `showSettings`, `showLogout`, `maxWidth`, `zIndex`, `overlay`, and `as` (nav/header) props
  - `src/components/HeaderMenu.tsx` — client-side dropdown that consolidates theme switching (system/light/dark picker), optional Settings link, and optional Log out link into one control; replaces the previous inline ThemeToggle + logout link pattern
  - updated 21 files to use `PageHeader`: `calendar/page.tsx`, `calendar/events/layout.tsx`, `calendar/countdown/page.tsx`, `settings/SettingsContent.tsx`, `vitals/VitalsContent.tsx`, `graphql/GraphQLContent.tsx`, `lab/layout.tsx`, `tcg/pokemon/page.tsx`, `tcg/pokemon/sets/page.tsx`, `tcg/pokemon/sets/[setId]/page.tsx`, `tcg/pokemon/card/[cardId]/page.tsx`, `tcg/pocket/page.tsx`, `fantasy/nba/player/stats/StatsContent.tsx`, `fantasy/nba/league-history/LeagueContent.tsx`, `FeatureHub.tsx`, and all 11 thoughts `*Content.tsx` files
  - `BreadcrumbItem.onClick` prop threads a click handler through the back-chevron link for cases like `StatsContent` that cancel in-flight queries before navigating
  - `FeatureHub` header uses `as="header"`, `left` (app name), `right` (user info block), `showSettings`, and `overlay` (violet gradient) to match its original design
  - thoughts pages pass `showLogout={false}` and `maxWidth="max-w-3xl"` with `right={<ViewToggle />}`

## 2026-03-16 - version 0.6.1

- all 11 dev notes (thoughts) pages now have a Summary / Chat view toggle defaulting to the direct prose view:
  - `src/app/thoughts/ViewToggle.tsx` — shared segmented pill toggle component
  - each `*Content.tsx` gains `useState<"summary" | "chat">("summary")`, a persistent glassmorphism nav with the toggle, and a prose summary view covering the same material as the chat
  - chat view preserves all existing iMessage bubble content verbatim; phone `.topBar` is replaced by the shared nav so there is no duplicate navigation
  - `RoutingContent.tsx` gains a chat view to match the pattern (it previously had only prose)

## 2026-03-16 - version 0.6.0

- migrated authenticated hub from `/protected` to root `/`:
  - `src/app/page.tsx` converted from static export to async server component; calls `auth0.getSession()` (local cookie decrypt, no network call) and renders `FeatureHub` for authenticated users or `LandingContent` for unauthenticated visitors
  - `src/app/FeatureHub.tsx`, `src/app/loading.tsx` promoted from `src/app/protected/` to root `src/app/`
  - `src/app/vitals/` and `src/app/settings/` promoted from `src/app/protected/vitals/` and `src/app/protected/settings/`
  - `src/proxy.ts` updated: removed `/` redirect block and `/protected` auth enforcement; added equivalent enforcement for `/vitals` and `/settings`
  - `src/types/hub.ts` created (replacing `src/types/protected.ts`); `FeatureHub.tsx` import updated accordingly
  - 21 back-to-hub links updated from `href="/protected"` to `href="/"` across feature pages (calendar, TCG, lab, fantasy, graphql) and thoughts pages
  - `VitalsContent.tsx` TTFB improvement note updated to remove outdated middleware redirect reference
  - `WebVitalsContent.tsx` updated: `/protected/vitals` reference changed to `/vitals`; TTFB landing page prose updated to reflect dynamic server component pattern
  - `SecurityContent.tsx` prose updated: `/protected/*` enforcement references changed to `/vitals` and `/settings`
  - `LandingPageContent.tsx` prose and code snippet updated to reflect auth0.getSession() branch pattern instead of redirect to `/protected`
  - `VitalsSection.tsx` mock data row updated from `/protected/vitals` to `/vitals`
  - `src/app/thoughts/routing/` created with new dev-notes write-up explaining the migration rationale, force-static trade-off, and security model
  - `src/app/dev/skeletons/hub/` created; `src/app/dev/skeletons/page.tsx` updated to reference new hub skeleton route
  - `src/app/protected/` deleted; `src/app/dev/skeletons/protected/` deleted; `src/types/protected.ts` deleted

## 2026-03-15 - version 0.5.32

- fixed visible black line between hero and features sections in light mode: `LandingContent` wrapper was `bg-black` and the `Divider` gradient used `via-white/8`; transparent gradient edges resolved to the black parent background, creating a 1px dark line between two `bg-background` (white) sections; changed wrapper to `bg-background` and divider to `via-foreground/8` so both adapt to light and dark themes

## 2026-03-15 - version 0.5.31

- landing page hero and features sections now respond to theme:
  - **HeroSection**: background changed from hardcoded `bg-black` to `bg-background`; scrim is `bg-background/75` in light mode (white wash keeps gradient as a tint while ensuring `text-foreground` is legible) and `bg-black/50` in dark mode; text uses `text-foreground` / `text-muted`; CTA button uses `bg-foreground text-background` so it inverts correctly in both modes
  - **FeaturesSection**: section changed from `bg-neutral-950 text-neutral-50` to `bg-background text-foreground`; card glass backgrounds and borders now use `var(--glass-bg)` / `var(--glass-border)` tokens instead of hardcoded white rgba values; card text uses `text-foreground` / `text-muted`
  - **`tokens.css`**: glass tokens split by mode — light uses dark-tinted glass (`rgba(0,0,0,0.03)` bg, `rgba(0,0,0,0.08)` border); dark mode overrides restore white-tinted glass

## 2026-03-15 - version 0.5.30

- replaced paginated calendar navigation with infinite bidirectional scroll across all four views:
  - new `InfiniteCalendarScroll` component renders a continuous list of periods; IntersectionObserver sentinels at top and bottom prepend/append periods as the user scrolls; scroll-position preservation via `useLayoutEffect` prevents content jump when prepending
  - day view: scroll continuously through days — each day's full 24-hour time grid stacks vertically; scrolling past midnight flows seamlessly into the next day
  - week view: scroll continuously through weeks — each week's full 7-column time grid stacks vertically
  - month view: scroll continuously through months — each month's grid stacks with a month/year label above it
  - year view: scroll continuously through years — each year's mini-month grid stacks with a year label above it
  - header prev/next buttons and "Today" button now call `scrollToDate` on the infinite scroll container instead of re-mounting the view
  - `currentDate` in the CalendarHeader updates live as you scroll (tracks the topmost visible period)
  - fetch range expands automatically as more periods render — covers earliest to latest period in the current list
  - removed `AnimatePresence` slide animation (replaced by natural scroll motion)

## 2026-03-15 - version 0.5.29

- unified calendar view design and added Google Calendar-style scrollable time grid:
  - **all 4 views** now share the same `rounded-xl border border-border overflow-hidden` outer container
  - **Day/Week views**: time grid is now a fixed-height scrollable container (`clamp(400px, calc(100dvh - 380px), 720px)`); header and all-day row stay pinned above the scroll area; view auto-scrolls to current time on today or 8am on other days on mount/navigation
  - **Month view**: added outer `rounded-xl border border-border` wrapper; replaced raw `bg-neutral-50/60 dark:bg-neutral-900/30` weekend and hover colors with `bg-surface-raised` design tokens
  - **Year view**: wrapped grid in `rounded-xl border border-border` outer panel with consistent padding — matches the other three views
  - standardized `ROW_HEIGHT` to `48px` across both Day and Week views (was 44px in Day)
  - replaced `hover:bg-neutral-50 dark:hover:bg-neutral-900/60` slot hover states with `hover:bg-surface-raised/50` in Day and Week views
  - updated all four skeletons to match the new scroll container structures and dimensions

## 2026-03-15 - version 0.5.28

- fixed calendar view-switch layout bug: `AnimatePresence` was missing `mode="popLayout"`, causing entering and exiting views to stack vertically in document flow — the new view rendered below the full height of the old one, leaving a blank reserved space at the top
  - added `mode="popLayout"` so the exiting element is popped out of flow (absolute-positioned) while the entering element takes its place
  - added `relative` to the wrapper div so the absolutely-positioned exiting element stays contained within the calendar area
  - chose `popLayout` over `mode="wait"` because `mode="wait"` is incompatible with `next/dynamic` — Suspense cleanup fires while the exiting fiber is still mounted, producing console warnings

## 2026-03-15 - version 0.5.27

- fixed GraphQL Pokédex type/name filter not firing: `initialData` in `useInfiniteQuery` was provided unconditionally, so every query key change (including filtered ones) received the unfiltered server seed and `staleTime: 30_000` prevented the actual filter fetch from running
  - gated `initialData` on `!debouncedName && !activeType` so it only seeds the no-filter query key; filtered queries start empty and fetch normally
  - split `staleTime` into two values: `30_000` when seed data is present (short window since we just fetched server-side), `10 * 60_000` for subsequent client fetches

## 2026-03-15 - version 0.5.26

- redesigned League History and Player Stats pages to match dashboard width and glass system:
  - removed `max-w-[480px]` narrow container — pages now use `min-h-dvh bg-background` full layout with `max-w-5xl` content (matching the nav and protected page)
  - replaced gradient backgrounds (`bg-gradient-to-br from-secondary-600 to-primary-700`) with `bg-background`
  - league history: TeamCard uses `bg-surface border-border` glass tokens; text uses `text-foreground`/`text-muted` instead of hardcoded `text-white`; `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
  - player stats: table wrapped in `bg-surface border-border rounded-xl`; `thBase`/`tdBase` updated to design tokens; sticky column backgrounds use `bg-surface`/`bg-surface-raised`
  - season/team selectors moved to inline `border-b` bar aligned to `max-w-5xl`; replaced `rounded-[10px] focus:border-[#007aff]` with `rounded-lg border-border bg-surface`

## 2026-03-15 - version 0.5.25

- standardized all nav inner divs to `max-w-5xl` — matching the protected dashboard page width
- added Dashboard back-link to all nested pages; pages with a parent now show a breadcrumb trail (Dashboard → Parent → Page):
  - `tcg/pokemon/sets` — Dashboard → Browse → Sets
  - `tcg/pokemon/sets/[setId]` — Dashboard → Sets → [Set Name]
  - `tcg/pokemon/card/[cardId]` — Dashboard → [Set/Browse] → [Card Name]
  - `calendar/events` — Dashboard → Calendar → Events
  - `calendar/countdown` — Dashboard → Calendar → Countdowns

## 2026-03-15 - version 0.5.24

- standardized all nav inner divs to `max-w-[1400px]` — previously mixed between `max-w-5xl`, `max-w-[1400px]`, and `max-w-[480px]`, causing visible width differences across pages
- also fixed remaining old-pattern navs: `settings/SettingsContent.tsx` and `calendar/countdown/page.tsx` migrated to inline glass background; `countdown/page.tsx` back-link changed from `text-red-400` to `text-muted`

## 2026-03-15 - version 0.5.23

- standardized nav headers across all protected pages — canonical pattern: `<nav>` with `sticky top-0 z-20 h-14 border-b border-border`, inline glass background (`color-mix` + `backdropFilter blur(16px)`), back-link in `text-muted hover:text-foreground` with 6×10 SVG chevron, divider pip, page title in `text-xs font-black uppercase tracking-[0.15em]`, `ThemeToggle` + logout on right with `gap-4`
- migrated 9 pages from old patterns (`bg-background/95 backdrop-blur-xl`, `text-red-400`, `<div>` wrapper, centered iOS-style header):
  - `src/app/graphql/GraphQLContent.tsx` — `<div>` → `<nav>`, inline glass, removed two-line title/subtitle, standardized back-link to "Dashboard"
  - `src/app/tcg/pokemon/page.tsx` — inline glass, back-link muted, "Back" → "Dashboard"
  - `src/app/tcg/pokemon/sets/page.tsx` — inline glass, back-link muted
  - `src/app/tcg/pokemon/sets/[setId]/page.tsx` — inline glass, back-link muted
  - `src/app/tcg/pocket/page.tsx` — inline glass, back-link muted, "Back" → "Dashboard"
  - `src/app/tcg/pokemon/card/[cardId]/page.tsx` — inline glass, back-link muted
  - `src/app/fantasy/nba/league-history/LeagueContent.tsx` — full restructure from centered iOS-style nav to standard left-right `<nav>`
  - `src/app/fantasy/nba/player/stats/StatsContent.tsx` — same restructure as LeagueContent
  - `src/app/protected/vitals/VitalsContent.tsx` — added `sm:px-6`, `gap-3` → `gap-4`

## 2026-03-15 - version 0.5.22

- added "Log out" link (`href="/auth/logout"`) to every protected page header — previously only the FeatureHub dashboard had it; now all 12 pages have it:
  - `src/app/calendar/page.tsx`
  - `src/app/calendar/events/layout.tsx`
  - `src/app/lab/layout.tsx`
  - `src/app/protected/vitals/VitalsContent.tsx`
  - `src/app/graphql/GraphQLContent.tsx`
  - `src/app/tcg/pokemon/page.tsx`
  - `src/app/tcg/pokemon/sets/page.tsx`
  - `src/app/tcg/pokemon/sets/[setId]/page.tsx`
  - `src/app/tcg/pokemon/card/[cardId]/page.tsx`
  - `src/app/tcg/pocket/page.tsx`
  - `src/app/fantasy/nba/league-history/LeagueContent.tsx`
  - `src/app/fantasy/nba/player/stats/StatsContent.tsx`

## 2026-03-15 - version 0.5.21

- visual polish pass across landing sections
  - added faint pastel radial glow to `AuthSection`, `NbaSection`, `DesignSection`, `TcgSection`, `CalendarSection`, `GraphQLSection`, `VitalsSection` via new `glow` prop on `Section.tsx`; each glow uses `color-mix(in srgb, var(--color-feature-*) 5%, transparent)` as a full-bleed absolute overlay so the section's existing background gradient is unchanged
  - added hairline gradient dividers (`h-px bg-gradient-to-r from-transparent via-white/8 to-transparent`) between all landing sections in `LandingContent.tsx`
  - standardized highlight card typography in all landing sections: titles `text-[15px] font-semibold` (was `text-sm`), body `text-[13px]` (was `text-xs`)
  - added `border-l-2` pastel accent to `ThoughtCard` in `FeatureHub.tsx`: `borderLeft: 2px solid ${thought.color}` via inline style overriding the `border-border` left edge
- updated `context/concepts/ui-system.md` — added glassmorphism `color-mix` pattern, pastel feature palette table, Framer animation system (spring presets + variant factories), reduced-motion pattern
- updated `context/features/calendar.md` — added "View transitions" section documenting `calendarSlide` variant, `direction` state, `AnimatePresence` mode choice
- updated `context/INDEX.md` — added Particle Lab and Motion Lab rows to Features table
- updated `README.md`:
  - replaced outdated Three.js hero description with ShaderGradient description; added Lab section (Particle Lab + Motion Lab)
  - added Lab entries to project structure tree
  - updated tech stack table (added Framer Motion, React Three Fiber, ShaderGradient rows)
  - added 8 new "Things I learned" entries covering ShaderGradient, R3F, glassmorphism `color-mix`, `AnimatePresence`/`next/dynamic` conflict, `perspective` on grid parent, and the `type: "spring"` TS error
- updated `src/app/thoughts/ui-redesign/UIRedesignContent.tsx` — added section on the Motion Lab (spring physics feel, `LayoutGroup` coordination, the `mode="wait"` + `next/dynamic` conflict and fix)

## 2026-03-15 - version 0.5.20

- created `/lab/motion` route — interactive Framer Motion demo lab
  - `page.tsx`: `"use client"` page with 6 interactive demo sections on `bg-neutral-950`; shared `GLASS` style constant (`rgba(255,255,255,0.04)` bg + `rgba(255,255,255,0.08)` border + `backdropFilter: blur(16px)`); `DemoSection` wrapper component with title, tag badge, description, and demo area
  - **SpringPlayground**: draggable puck with `dragSnapToOrigin`; sliders for stiffness (10–800), damping (1–60), mass (0.1–4.0); crosshair marks origin in 176px arena
  - **StaggerGrid**: 12 colored tiles in a 6-column grid with configurable stagger delay (0.01–0.3 s); Replay button increments `gridKey` to remount and re-run the stagger entrance
  - **ReorderList**: 5 items using `Reorder.Group` / `Reorder.Item` from framer-motion; `touchAction: "none"` on each item; braille `⠿` drag handle
  - **ScrollParallax**: 3 layered elements inside a 208px scrollable container; `useScroll({ container: containerRef })` drives `useTransform` offsets — back layer (-60px + opacity), mid layer (-120px + scale 1→1.5), front layer (180° rotate); scrollbar hidden
  - **GestureCard**: drag + `dragSnapToOrigin` + `whileHover`/`whileTap`/`whileDrag`; live state panel shows idle/hover/tap/drag with color-coded labels; animated dot pulses on state change via keyed `animate={{ scale: [1, 1.5, 1] }}`
  - **SharedLayout**: 3 cards with `layoutId` + `LayoutGroup`; click expands a card to an overlay using `AnimatePresence`; card title animates independently via its own `layoutId`
  - `loading.tsx`: skeleton matching the page layout — header skeleton + 6 section card skeletons at heights matching each demo's actual rendered height

## 2026-03-15 - version 0.5.19

- created `/lab` route group (`src/app/lab/`)
  - `layout.tsx`: sticky nav with "← Dashboard" link, "Lab" badge, ThemeToggle; glass background using `color-mix(in srgb, var(--color-background) 80%, transparent)` + `backdropFilter: blur(16px)`
  - `loading.tsx`: skeleton grid matching the layout structure
  - `page.tsx`: redirects to `/lab/particles`
- created `/lab/particles` route — interactive R3F particle network lab
  - `ParticleScene.tsx`: R3F inner component (no Canvas); rewrites the original `HeroScene.tsx` imperatively-controlled loop as declarative R3F: `useMemo` owns all THREE.js geometry/material lifetime, `useFrame` drives the physics tick, `useEffect` disposes objects on unmount or particle count change; props: `particleCount`, `speedMult`, `connectDist`, `palette`, `mouseAttraction`, `mouseNDCRef`, `camTargetRef`
  - `ParticlesCanvas.tsx`: thin R3F `<Canvas>` wrapper loaded with `ssr: false` via `dynamic`
  - `page.tsx`: `"use client"` page managing all control state; glass panel with speed slider (0.2–3.0×), connection-distance slider (1.5–6.0), color theme picker (5 pastel presets: Cosmic/Ember/Forest/Twilight/Arctic), mouse attraction toggle, live particle count display; pointer-move updates `mouseNDCRef` and `camTargetRef` without triggering React re-renders
  - `loading.tsx`: full-viewport black background with centered pulse orb
- removed `src/app/landing/HeroScene.tsx` (no active importers; particle scene lives at `/lab/particles` now)
- added `particles` feature to `FeatureHub.tsx`: `ParticlesPreview` SVG mockup, token `--color-feature-particles`, href `/lab/particles`
- added `IconParticles` icon and `FeatureCard` entry to `FeaturesSection.tsx`

## 2026-03-15 - version 0.5.18

- added direction-aware view transitions to the calendar (`src/app/calendar/CalendarContent.tsx`)
  - added `calendarSlide` variant to `src/lib/animations.ts`: accepts a `custom` direction value (-1/0/1); `hidden` starts at `x: direction * 40`, `exit` leaves at `x: direction * -40`; direction 0 is a pure crossfade
  - added `direction` state to `CalendarContent` (initial 0)
  - `handleNavigate(dir)`: sets direction to `dir` before updating `currentDate` — forward (+1) slides new view in from the right, backward (-1) from the left
  - `handleToday`: sets direction 0 (crossfade)
  - `handleViewChange`: new `useCallback` wrapper around `setView` that sets direction 0 first; replaces bare `setView` on the `onViewChange` prop
  - `handleMonthClick`: sets direction 0 (year→month is a view-mode change, not navigation)
  - view content wrapped in `AnimatePresence mode="wait" custom={direction}` + `motion.div` with `variants={calendarSlide}`, `key={\`${view}-${currentDate.getTime()}\`}`, `transition={{ ...spring.smooth }}`
  - outer loading wrapper gets `overflow-hidden` to clip the 40px slide offset

## 2026-03-15 - version 0.5.17

- unified glass treatment across all feature cards and nav headers
  - `FeatureHub` card glass: updated base transparency from `var(--color-surface)` / `var(--color-border)` to `rgba(255,255,255,0.04)` / `rgba(255,255,255,0.08)` — matches the landing page `FeaturesSection` spec exactly
  - `FeatureHub` sticky header: switched from Tailwind `bg-background/80 backdrop-blur-md` to inline `color-mix(in srgb, var(--color-background) 80%, transparent)` + `backdropFilter: blur(16px)`; added absolutely-positioned gradient overlay (`linear-gradient(to right, transparent, rgba(139,92,246,0.04), transparent)`) layered under the glass for a subtle violet shimmer
  - `VitalsContent` sticky nav: switched to inline glass style with `blur(16px)` for consistency
  - `calendar/page.tsx` sticky nav: same inline glass update
  - `HeroSection` has no sticky nav — skipped

## 2026-03-15 - version 0.5.16

- replaced RAF/`startTransition`/`setLoaded` entrance stagger in `FeatureHub` with Framer Motion `staggerContainer` + `cardFlipIn` variants
  - card grid is now a `motion.div` with `variants={staggerContainer(0.07)}`, `initial="hidden"`, `animate="visible"`, and `style={{ perspective: "1000px" }}`
  - each `FeatureCard` declares `variants={cardFlipIn}` and inherits `initial`/`animate` from the parent; `transition` is `spring.smooth` or `instantTransition` based on context
  - removed `loaded` state, `useEffect`, `useTransition`, and `STAGGER_MS` from `FeatureHub`
- added `ReducedMotionProvider` to `src/app/providers.tsx`
  - reads `useReducedMotion()` once at the app root and exposes it via `ReducedMotionContext`
  - `useHubReducedMotion()` export lets any client component read the flag without calling the Framer hook directly
  - `ReducedMotionProvider` wraps all children inside `Providers`
- `FeatureCard` now reads `prefersReduced` from props (supplied by `FeatureHub` via `useHubReducedMotion()`) and passes `instantTransition` when true

## 2026-03-15 - version 0.5.15

- applied glass treatment to all feature cards across landing page and protected hub
  - `FeaturesSection`: added `featureToken` prop to `FeatureCard`; each card's background is `color-mix(in srgb, var(--color-feature-*) 6%, rgba(255,255,255,0.04))`, border `color-mix(...15%...)`, with `backdropFilter: blur(16px)`; hover overlay pastel tint at 10%; `whileHover={{ y: -4 }}` with `spring.snappy`; mapped all 7 cards to their tokens (`auth`, `vitals`, `motion`, `nba`, `tcg`, `calendar`, `graphql`)
  - `FeatureHub`: added `FEATURE_TOKEN` map (`nba`, `league→sync`, `tcg`, `pocket→particles`, `calendar`, `graphql`, `vitals`); converted `FeatureCard` from CSS `reveal()` entrance to Framer `motion.div` with `spring.smooth` + stagger delay; applied same glass styles using `var(--color-surface)` and `var(--color-border)` for theme compatibility; preview area tinted at 8%; `whileHover={{ y: -4, transition: spring.snappy }}`
  - updated `FeatureHub` sticky header: `bg-background` → `bg-background/80 backdrop-blur-md`
  - updated `VitalsContent` nav: `bg-background/95 backdrop-blur-xl` → `bg-background/80 backdrop-blur-md`
  - updated `calendar/page.tsx` nav: same update

## 2026-03-15 - version 0.5.14

- rewrote `src/app/landing/VitalsSection.tsx`: replaced `useInView` hook + `reveal()` with Framer Motion animated bars, stats, and badges
  - added `"use client"` directive; removed `./useInView` and `reveal` imports
  - `AnimatedBar`: `useSpring(0, { stiffness: 80, damping: 18 })` drives a `useTransform` width percentage applied via `style={{ width: widthPct }}` on a `motion.div` inside a fixed-height track; added to each metric card and each by-page table row
  - `AnimatedStat`: same pattern as NbaSection — `useSpring` + `useTransform`, preserves suffix (`s`, `ms`, etc.) by splitting the source string; applied to all metric values and by-page LCP values
  - `RatingBadge`: rating dot wrapped in `motion.div`, scales in from `scale: 0` with `spring.bounce` at `delay: 0.6` after bars have settled; used in both metric cards and table rows
  - added `pct` field to `MOCK_METRICS` and `MOCK_ROWS` to drive bar widths (82–92% for good metrics, 52% for needs-improvement)
  - heading uses clipPath wipe; subtitle fades up at `delay: 0.1`; highlights fade up at `delay: 0.8`
  - uses Framer's built-in `useInView(ref, { once: true, margin: "-15% 0px" })`

## 2026-03-15 - version 0.5.13

- rewrote `src/app/landing/GraphQLSection.tsx`: replaced `useInView` hook + `reveal()` with typewriter animation
  - added `"use client"` directive; removed `./useInView` and `reveal` imports
  - replaced mock card grid with a two-panel query inspector layout: left panel shows the typing query, right panel shows result rows
  - `TypewriterQuery` component: `setInterval` at 18 ms/char advances a character count into the query string; blinking `|` cursor via Framer `motion.span` `opacity: [1, 0]` with `steps(1)` easing; cursor disappears when done; reduced-motion skips to full string immediately
  - `RESULT_DELAY = query.length * 0.018 + 0.15` — result rows start fading in only after typing completes; each row staggers an additional `i * 0.05s` with a slight `x: 10` slide
  - feature highlights appear after the last result row (`RESULT_DELAY + results.length * 0.05 + 0.1`)
  - heading uses clipPath wipe; subtitle fades up at `delay: 0.1`; panel frame fades up at `delay: 0`
  - uses Framer's built-in `useInView(ref, { once: true, margin: "-15% 0px" })`

## 2026-03-15 - version 0.5.12

- rewrote `src/app/landing/CalendarSection.tsx`: replaced `useInView` hook + `reveal()` with Framer Motion cell-by-cell grid build
  - added `"use client"` directive; removed `./useInView` and `reveal` imports
  - `MockDay` converted to `motion.div`: each cell animates from `scale: 0, opacity: 0` with `stiffness: 350, damping: 22` and `delay: cellIndex * 0.015` (left-to-right, top-to-bottom across 14 cells)
  - event chips inside each cell are separate `motion.div` elements: start at `opacity: 0`, fade in at `delay: CHIP_DELAY` (= `14 * 0.015 + 0.1 = 0.31s`) so they appear only after all cells are built
  - feature highlights fade up at `CHIP_DELAY + 0.1s` — always after chips
  - `MockDay` accepts `cellIndex`, `inView`, and `prefersReduced` props; row data extracted to `ROW1`/`ROW2` constants so `cellIndex` is derived cleanly (row 2 offset by 7)
  - calendar frame fades up at `delay: 0` as a surface for the cells; heading uses clipPath wipe; subtitle fades up at `delay: 0.1`
  - uses Framer's built-in `useInView(ref, { once: true, margin: "-15% 0px" })`

## 2026-03-15 - version 0.5.11

- rewrote `src/app/landing/TcgSection.tsx`: replaced `useInView` hook + `reveal()` with Framer Motion dealt-card animation
  - added `"use client"` directive; removed `./useInView` and `reveal` imports
  - browser frame fades up at `delay: 0` to give the cards a surface before they land
  - each mock card starts at `y: -60, rotate: (i%3-1)*18, scale: 0.5, opacity: 0` and springs to rest with `spring.bounce` at `delay: 0.2 + i*0.06` — the 0.2s head start ensures the frame is visible before the first card arrives
  - heading uses clipPath left-to-right wipe; subtitle fades up at `delay: 0.1`; highlights fade up at `delay: 0.5` (after all 6 cards have dealt)
  - reduced-motion falls back to plain opacity fade for both frame and cards
  - uses Framer's built-in `useInView(ref, { once: true, margin: "-15% 0px" })`

## 2026-03-15 - version 0.5.10

- rewrote `src/app/landing/NbaSection.tsx`: replaced `useInView` hook + `reveal()` with Framer Motion
  - added `"use client"` directive; removed `./useInView` and `reveal` imports
  - added `AnimatedStat` component: uses `useSpring(0, { stiffness: 60, damping: 15 })` + `useTransform` to count from 0 to the stat value when `inView` flips true; preserves decimal places by parsing the source string; reduced-motion falls back to instant value display
  - `StatRow` converted to `motion.tr` using `slideInRight` variant + `spring.smooth` staggered at `delay: index * 0.05`; all three numeric cells (PTS, REB, AST) use `AnimatedStat`
  - heading uses clipPath left-to-right wipe; subtitle and table container fade up; highlights grid fades up at `delay: 0.35`
  - row data and highlight copy extracted to `ROWS` and `HIGHLIGHTS` constants
  - uses Framer's built-in `useInView(ref, { once: true, margin: "-15% 0px" })`

## 2026-03-15 - version 0.5.9

- rewrote `src/app/landing/DesignSection.tsx`: replaced `useInView` hook + `reveal()` with Framer Motion
  - added `"use client"` directive; removed `./useInView` and `reveal` imports
  - heading uses clipPath left-to-right wipe with `spring.smooth` (consistent with FeaturesSection)
  - subtitle fades up with `spring.smooth` at `delay: 0.1`
  - color swatches each animate individually from a deterministic scattered start: `x: ((i%3)-1)*30`, `y: Math.sin(i*1.7)*20`, `rotate: Math.cos(i*2.3)*12`, `scale: 0.7, opacity: 0` → resting position with `spring.bounce` and `delay: i*0.04`; reduced-motion falls back to a plain opacity fade
  - button variants and radius demo rows fade up at `delay: 0.3` and `delay: 0.4` respectively
  - uses Framer's built-in `useInView(ref, { once: true, margin: "-15% 0px" })`

## 2026-03-15 - version 0.5.8

- replaced emoji icons in `FeaturesSection` with custom 24x24 stroke SVG icons: key (auth), ECG pulse line (vitals), three stacked layers (design system), ascending bar chart (NBA), two offset cards (TCG), calendar grid with dots (calendar), three connected graph nodes (GraphQL); `FeatureCard` prop changed from `icon: string` to `icon: React.ReactNode`
- replaced `&#9654;` triangle bullets in `AuthSection` with per-item 16x16 stroke SVG icons: horizontal key (Auth0 SDK), shield outline (CSP Headers), arrow-through-node (Proxy Middleware), forked path with crossbar (Route Protection)

## 2026-03-15 - version 0.5.7

- rewrote `src/app/landing/AuthSection.tsx`: replaced `useInView` hook + `reveal()` CSS classes with Framer Motion bilateral split
  - added `"use client"` directive; removed `./useInView` and `reveal` imports
  - left column (`motion.div`) slides in from left using `slideInLeft` variant + `spring.smooth`
  - right column (`motion.div`) slides in from right using `slideInRight` variant + `spring.smooth` at `delay: 0.1`
  - added animated SVG lock icon above the heading: shackle arc draws via `pathLength: 0 → 1` (0.45s tween), body outline draws after at `delay: 0.35`, keyhole dot fades in at `delay: 0.65` — fully sequenced before the slide-in reads as complete
  - uses Framer's built-in `useInView(ref, { once: true, margin: "-15% 0px" })`
  - `useReducedMotion()` check: passes `instantTransition` to all motion elements; SVG paths skip to `pathLength: 1` with `duration: 0`

## 2026-03-15 - version 0.5.6

- rewrote `src/app/landing/FeaturesSection.tsx`: replaced `useInView` hook + `reveal()` CSS class pattern with Framer Motion
  - removed imports of `./useInView` and `reveal` from `./Section`; added `"use client"` directive
  - section heading (`motion.h2`) wipes in left-to-right via `clipPath: "inset(0 100% 0 0)"` → `"inset(0 0% 0 0)"` with `spring.smooth`
  - subtitle (`motion.p`) fades up with `spring.smooth` at `delay: 0.15`
  - grid container is now `motion.div` with `style={{ perspective: "1000px" }}` and `staggerContainer(0.07, 0.1)` variants
  - `FeatureCard` is now `motion.div` using `cardFlipIn` variant + `spring.bounce`; accepts `transition` prop for reduced-motion override
  - uses Framer's built-in `useInView(ref, { once: true, margin: "-15% 0px" })` instead of the custom hook
  - `useReducedMotion()` check passes `instantTransition` to all animated elements when true; dropped `visible/delay` props from `FeatureCard`

## 2026-03-15 - version 0.5.5

- tuned `ShaderGradientScene` colors to be visible: `color1: #000000`, `color2: #ffffff`, `color3: #555555`; `uStrength: 3.5`, `uDensity: 1.8`, `uFrequency: 3.0`, `brightness: 1.8`, `cDistance: 20` — previous colors (`#050505`, `#1a1a1a`, `#3a3a3a`) were indistinguishable from the black background
- added dark scrim overlay in `HeroSection.tsx` between the gradient and text: `absolute inset-0 bg-black/50 z-[1]` so white text stays legible over the bright gradient
- added mouse-driven camera parallax to `ShaderGradientScene`:
  - component now accepts `cAzimuthAngle` and `cPolarAngle` as props with defaults `225` and `100`
  - `enableTransition={true}` and `smoothTime={0.18}` on `ShaderGradient` so camera eases to the target angle instead of snapping
- added mouse tracking to `HeroSection`:
  - `onMouseMove` on the section maps cursor X to azimuth `180–270` and cursor Y to polar `85–125`
  - RAF-throttled state update via `useRef` + `requestAnimationFrame` — one `setCameraAngles` call per frame maximum, no batching overhead
  - separate `useEffect` for RAF cleanup on unmount (fixes ESLint `react-hooks/set-state-in-effect` by not mixing `setMounted` and cleanup in the same effect)

## 2026-03-15 - version 0.5.4

- installed `@shadergradient/react@2.4.20`, `@react-three/fiber@9.5.0`, `three-stdlib@2.36.1`
- created `src/app/landing/ShaderGradientScene.tsx`: client component wrapping `ShaderGradientCanvas` + `ShaderGradient` with B&W/grey colors (`color1: #000000`, `color2: #111111`, `color3: #1c1c1c`), `type: waterPlane`, `animate: on`, `uSpeed: 0.15`, `grain: on`, `lightType: 3d`; positioned `absolute inset-0 pointer-events-none`
- rewrote `src/app/landing/HeroSection.tsx`:
  - removed `HeroScene` Three.js import and the two decorative blur blobs
  - removed inline `<style>` block with `@keyframes hero-fade-in` and `@keyframes glow-pulse`; removed `heroReveal` CSS class constant
  - loads `ShaderGradientScene` via `next/dynamic` (`ssr: false`); fallback is `<div className="absolute inset-0 bg-black" />` so LCP fires on the text before WebGL loads
  - `mounted` state pattern: server renders H1 words visible (`initial={false}`) to preserve LCP; client triggers entrance animation on mount
  - H1 split word-by-word into `motion.span` elements using `wordReveal` variant + `staggerContainer(0.08, 0.1)` from `src/lib/animations.ts`; each word has `spring.wordReveal` transition
  - subtitle fades up after title (`spring.smooth`, `delay: 0.5`)
  - CTA button wraps in `motion.div` with `scaleIn` variant + `spring.bounce` (`delay: 0.65`); button style updated from `bg-foreground text-background` to explicit `bg-white text-black` since hero is always dark
  - `useReducedMotion()` check — passes `instantTransition` to all animations when true

## 2026-03-15 - version 0.5.3

- wrapped `LandingContent` in `<div className="bg-black">` — landing page is now always dark regardless of the user's light/dark theme preference; app pages (`/protected`, `/calendar`, etc.) retain `bg-background` and are unaffected
- **HeroSection**: `bg-background` → `bg-black`; `text-foreground` → `text-white`; `text-muted` → `text-white/70`
- **FeaturesSection**: removed `dark:bg-neutral-100 dark:text-neutral-950` overrides (landing is always dark now); removed `dark:text-neutral-600` on subtitle; card `border-border bg-surface` → `border-white/10 bg-white/5`; card text `text-foreground` → `text-white`, `text-muted` → `text-white/60`
- **AuthSection**: section gradient `from-primary-50 to-primary-100 dark:from-primary-950 dark:to-neutral-950` → `from-primary-950 to-neutral-950` (dark variant made permanent); `text-foreground` → `text-white`; `text-muted` → `text-white/70`; bullet icons `text-primary-500` → `text-primary-400` (more readable on dark)
- **DesignSection**: `bg-background` → `bg-black`; heading and body text updated to `text-white`/`text-white/70`/`text-white/50`; secondary button `border-border bg-surface text-foreground` → `border-white/20 bg-white/5 text-white`; radius demo boxes `border-border bg-surface-raised text-muted` → `border-white/10 bg-white/5 text-white/50`
- **NbaSection**: section gradient `from-secondary-600 to-primary-700 dark:from-secondary-900 dark:to-primary-950` → `from-secondary-900 to-primary-950`; `StatRow` — `bg-surface-raised/50` → `bg-white/5`; `text-foreground` → `text-white`; `text-muted` → `text-white/60`; pts column `text-primary-500` → `text-primary-400`
- **TcgSection, CalendarSection, GraphQLSection, VitalsSection**: removed now-redundant `dark:` gradient overrides (all were identical to their light-mode values anyway on a dark page)
- **FooterSection**: `bg-background` → `bg-black`; `text-foreground` → `text-white`; `text-muted` → `text-white/70`

## 2026-03-15 - version 0.5.2

- rewrote `src/components/ui/Modal.tsx`: replaced CSS `animate-modal-enter` with Framer Motion `AnimatePresence`; backdrop fades in/out (`opacity 0→1`, 180ms), modal panel springs in with `spring.smooth` (`opacity 0, scale 0.95, y 12` → resting); glass styling applied — `rgba(15,15,15,0.88)` background, `blur(24px)` backdrop-filter, `rgba(255,255,255,0.12)` border; removed `bg-surface` class so the panel is no longer overridden by the CSS surface token
- removed `@keyframes modal-enter` from `src/styles/tokens.css` and `--animate-modal-enter` Tailwind alias from `src/app/globals.css` — both superseded by Framer Motion

## 2026-03-15 - version 0.5.1

- installed `framer-motion@12.36.0`
- created `src/lib/animations.ts`: shared spring presets (`snappy`, `smooth`, `bounce`, `gentle`, `wordReveal`), reusable Framer variants (`fadeInUp`, `fadeIn`, `scaleIn`, `slideInLeft`, `slideInRight`, `cardFlipIn`, `wordReveal`), `staggerContainer(staggerChildren, delayChildren)` factory, and `instantTransition` for reduced-motion fallback; single import source so spring tuning updates everywhere at once

## 2026-03-15 - version 0.5.0

- UI redesign start — B&W base with pastel feature accents and glassmorphism throughout
- added nine pastel feature color tokens to `src/styles/tokens.css`: `--color-feature-calendar` (#a7f3d0 mint), `--color-feature-tcg` (#fecdd3 rose), `--color-feature-nba` (#fde68a amber), `--color-feature-vitals` (#ddd6fe violet), `--color-feature-graphql` (#bfdbfe blue), `--color-feature-auth` (#fca5a5 salmon), `--color-feature-particles` (#a5f3fc cyan), `--color-feature-motion` (#d9f99d lime), `--color-feature-sync` (#bae6fd sky) — Tailwind-200-level pastels, readable on black, distinct per feature
- added glass system tokens to `src/styles/tokens.css`: `--glass-bg`, `--glass-bg-hover`, `--glass-border`, `--glass-border-strong` — standard frosted-glass recipe used by cards, modals, and navbars going forward

## 2026-03-14 - version 0.4.19

- added `queryKeys.calendar.eventCards(eventId)` to `src/lib/queryKeys.ts`: factory for the event card attachment query; fixes `EventModal` which was using a hard-coded `["calendar", "events", event?.id, "cards"]` key outside the factory
- added `queryKeys.tcg.search(query)` to `src/lib/queryKeys.ts`: separate from `tcg.cards` (the browse page key) since modal card search has no type/set filters and shouldn't share a cache with the browse page
- updated `src/components/calendar/EventModal.tsx`: replaced hand-written query key with `queryKeys.calendar.eventCards(event?.id ?? "")`
- updated `src/components/calendar/CardSearch.tsx`: replaced hand-written `["tcg", "cards", "search", debouncedQuery]` key with `queryKeys.tcg.search(debouncedQuery)`
- updated `src/app/landing/HeroSection.tsx`: added `loading: () => null` to the `next/dynamic` HeroScene import; the scene is a decorative background so there's nothing to hold space for while the chunk downloads, but omitting `loading` entirely throws to the nearest Suspense boundary on slow connections
- added `src/app/protected/vitals/loading.tsx`: route-segment skeleton for the vitals dashboard that matches VitalsContent's exact layout (sticky nav, 5 metric cards on the same grid breakpoints, by-page table with header and rows, improvements grid); previously this async server component had no skeleton and would show a blank page during the parallel backend fetches

## 2026-03-13 - version 0.4.18

- created `src/lib/backendFetch.ts`: `getBackendAuth()` fetches the Auth0 access token, `buildHeaders()` assembles the Authorization header; all 12 calendar BFF routes migrated to use it — removes duplicated `getAccessToken()` boilerplate from every route
- added `InfoTip` component to `src/components/ui`: ⓘ badge that shows a rich multi-line popover on hover using `position: fixed` + `getBoundingClientRect` to punch through `overflow: hidden` containers; supports `side="top"` (default) and `side="bottom"`
- info tips added in `CalendarModal`: sync mode explainer (Local only / Push / Two-way) and invite explainer (account requirement + Editor vs Viewer role descriptions)
- info tips added in `CalendarHeader`: calendar explainer next to the "+" button (pops below), countdowns explainer next to the Countdowns link (pops below)
- fixed owner email not showing in Sharing tab: `upsertUser` middleware now reads `X-User-Email` header as fallback; Auth0 post-login Action is the primary fix (adds `email` claim to the access token); owner member row shows "You" when email is still null as a final fallback
- updated `CalendarAboutContent.tsx`: added thread covering the Auth0 email claim problem, why it silently broke sharing, the JWT custom claim fix, the BFF header approach and why the signed claim is safer on a public backend, and the `backendFetch` utility extraction

## 2026-03-13 - version 0.4.16

- added pencil icon (hover-reveal) to owned calendars in the header dropdown and single-calendar label; clicking opens `CalendarModal` in edit mode wired to `updateCalendar` and `deleteCalendar` — this is how you access the Sharing tab
- added leave icon (hover-reveal) to shared calendars in the header dropdown and single-calendar label; clicking calls `DELETE /members/me` and shows an 8-second warning banner if Google ACL cleanup failed
- non-owners now default to the Sharing tab when the edit modal opens; Details tab fields are disabled with an explanatory note and the Save button is hidden
- `useCalendars` now exposes `isCreating`, `isUpdating`, `isDeleting` loading states; create and edit modals both use them so save/delete buttons show proper loading state

## 2026-03-13 - version 0.4.15

- added sharing chat thread to `src/app/thoughts/calendar/CalendarAboutContent.tsx`: covers why we store a `users` table locally instead of calling the Auth0 Management API, how the membership model works (ownership lives on `calendars.user_sub`, members live in `calendar_members`), editor vs viewer access via `getCalendarForMutation`, and how Google ACL entries are written on invite (fire-and-forget) and revoked on remove (awaited with `googleAclRemoved` flag)

## 2026-03-13 - version 0.4.14

- replaced the native `<select>` in `CalendarHeader` with a custom dropdown so shared calendars can show a person icon next to their name; dropdown closes on outside click via `mousedown` listener; chevron indicates it is interactive; single-calendar static label also gets a person icon when the calendar is shared
- added `PersonIcon` component (head circle + shoulder arc SVG)

## 2026-03-13 - version 0.4.13

- added Sharing tab to `CalendarModal` (edit mode only): tab strip switches between Details and Sharing; owners can invite by email with editor/viewer role selector, change existing member roles via inline tab strip, and remove members; removal checks `googleAclRemoved` and shows an 8-second amber warning when Google access was not revoked; non-owners see a read-only member list with "Shared by [owner email]" header; `SharingTabSkeleton` shows 3 pulsed rows while the member list loads; Save button hidden on Sharing tab

## 2026-03-13 - version 0.4.12

- added `CalendarMember` type to `src/types/calendar.ts`
- updated `Calendar` type to include `role`, `ownerSub`, `ownerEmail` fields returned by the UNION query
- added `calendarMembers(calendarId)` key factory to `src/lib/queryKeys.ts`
- updated `useCalendars` to expose `inviteMember`, `updateMemberRole`, `removeMember` mutations; each invalidates `calendars` and `calendarMembers` on settled
- added `useCalendarMembers(calendarId)` hook for fetching the member list; enabled only when calendarId is non-null; 30s stale time

## 2026-03-13 - version 0.4.11

- added BFF route `src/app/api/calendar/calendars/[id]/members/route.ts`: GET proxies member list (accessible by owner or any member), POST proxies invite-by-email and returns 201
- added BFF route `src/app/api/calendar/calendars/[id]/members/[memberSub]/route.ts`: PUT proxies role update, DELETE proxies member removal and forwards `{ googleAclRemoved }` body so the frontend can warn when Google access was not revoked; memberSub is re-encoded with encodeURIComponent when forwarding to the backend since Auth0 subs contain pipe characters

## 2026-03-12 - version 0.4.10

- added multi-calendar thread to `src/app/thoughts/calendar/CalendarAboutContent.tsx`: covers why a `calendars` table was needed over per-event sync config, the three sync modes (`none`/`push`/`two_way`) and when to use each, how two_way automatically creates the Google Calendar and registers a per-calendar watch channel, the `userId:calId` channel token format for routing webhook notifications to the right calendar, and the import-vs-filter difference between push and two_way

## 2026-03-12 - version 0.4.9

- updated `CalendarModal`: when syncMode is `two_way` and the saved calendar has no `googleCalId`, replaces the modal body with `CalendarModalSkeleton` + "Connecting to Google Calendar…" message while the `POST connect-google` request is in-flight; on success calls `onBanner` with a success message then closes; on failure calls `onBanner` with a warning (calendar is already saved, user can retry by editing) then closes; same flow applies in edit mode when changing syncMode to `two_way`; added `onBanner` prop
- updated `CalendarHeader`: added `banner` state (`success | warning`), auto-dismissed after 5 s with a manual dismiss button; passes `onBanner` to `CalendarModal`

## 2026-03-12 - version 0.4.8

- added `calendarId` field to `CalendarEvent` type
- updated `EventModal`: accepts `defaultCalendarId` prop (from the header's selected calendar), adds `calendarId` form state initialized to the event's own `calendarId` in edit mode or `defaultCalendarId` in create mode, renders a calendar select dropdown (color dot + name) when the user has more than one calendar, includes `calendarId` in the saved event payload
- updated `CalendarContent`: passes `defaultCalendarId={effectiveCalendarId}` to `EventModal`

## 2026-03-12 - version 0.4.7

- added `src/components/calendar/CalendarModal.tsx` with `CalendarModalSkeleton` export: name input, color swatch picker (same pattern as EventModal), three-option sync mode strip (Two-way disabled with tooltip when Google is not connected), connected badge with Disconnect button in edit mode, create-notice when two_way is selected with no linked calendar, inline confirm for delete; on save with syncMode=two_way and no googleCalId, automatically calls POST connect-google to create the dedicated calendar
- added BFF `DELETE /api/calendar/calendars/[id]/google/route.ts` proxying to the backend disconnect endpoint

## 2026-03-12 - version 0.4.6

- added `Calendar` type to `src/types/calendar.ts` with `id`, `name`, `color`, `syncMode` (`none | push | two_way`), and optional `googleCalId`/`googleCalName`
- added `queryKeys.calendar.calendars()` to `src/lib/queryKeys.ts`
- added `src/hooks/useCalendars.ts`: `useQuery` with 60s staleTime, three `useMutation`s (create, update, delete) that each invalidate the calendars key on `onSettled`; no optimistic updates since calendar mutations are infrequent

## 2026-03-12 - version 0.4.5

- added BFF routes for calendar CRUD: `GET`/`POST` at `src/app/api/calendar/calendars/route.ts`, `PUT`/`DELETE` at `src/app/api/calendar/calendars/[id]/route.ts`, and `POST` at `src/app/api/calendar/calendars/[id]/connect-google/route.ts`; all follow the same `auth0.getAccessToken()` + forward-to-backend pattern as the existing event routes

## 2026-03-12 - version 0.4.4

- fixed CSP violation blocking Vercel Live feedback widget: added `https://vercel.live` to `script-src` and `connect-src`, and added `frame-src https://vercel.live` in `src/proxy.ts`

## 2026-03-12 - version 0.4.3

- fixed Google Calendar OAuth connect flow so it works from any environment: `SettingsContent` now passes `?origin=${window.location.origin}` when fetching the auth URL, the BFF forwards it to the backend, and the backend embeds it in the signed state so the callback redirects back to the right origin after OAuth completes; added `http://localhost:3000` to `ALLOWED_ORIGINS` in `routes/google.js` so local dev works too

## 2026-03-12 - version 0.4.2

- fixed off-by-one day bug in countdown `getDaysLabel`: `parseISO("YYYY-MM-DD")` was treating the target date as UTC midnight, causing countdowns to show one day early for users west of UTC; replaced with `new Date(\`${targetDate}T00:00:00\`)`to parse as local midnight in both`CountdownCard.tsx`and`CountdownModal.tsx`

## 2026-03-12 - version 0.4.1

- added `useGoogleCalendarStatus` hook (`src/hooks/useGoogleCalendarStatus.ts`): wraps `useQuery` with `queryKeys.google.authStatus()`, `staleTime: 5min`; returns `{ connected, loading }` with `connected` defaulting to `false` during load so callers never need to check both fields
- added `google.authStatus` key to `queryKeys.ts` under a new `google` namespace
- updated `CalendarHeader`: shows a green dot with title "Synced with Google Calendar" and a small refresh icon button when connected; clicking the button invalidates `["calendar", "events"]` (prefix match) so all range-keyed event queries refetch; both elements are `hidden sm:inline-flex` to avoid cluttering mobile; nothing renders when not connected
- updated `SettingsContent`: uses `useQueryClient` to invalidate `queryKeys.google.authStatus()` on disconnect (so the CalendarHeader indicator disappears immediately) and on return from the OAuth flow when `?gcal=connected` is present in the URL (so the indicator lights up without waiting for the 5-minute stale window)

## 2026-03-12 - version 0.4.0

- added three BFF routes for Google Calendar OAuth: `GET /api/google/auth/url` (returns the Google authorization URL), `GET /api/google/auth/status` (returns `{ connected: boolean }`), `DELETE /api/google/auth/disconnect` (removes tokens and stops the watch channel); all three proxy to the backend with the user's Bearer token via the standard `auth0.getAccessToken()` pattern
- added `/protected/settings` page with a `SettingsContent` client component; shows a "Connected accounts" section with a Google Calendar row; on mount fetches connection status and shows a skeleton while loading; "Connect" redirects to the Google OAuth URL, "Disconnect" calls the DELETE BFF and updates state in place; connected state shows a green "Connected" badge alongside the Disconnect button
- settings page reads the `?gcal` query param on load and shows an inline banner for `connected`, `denied`, and `error` states (the OAuth callback redirects back here with that param); banner is dismissible
- added "Settings" link to the `FeatureHub` sticky header between the theme toggle and "Log out", matching the same `text-[13px] font-medium text-muted hover:text-foreground` style as the logout link

## 2026-03-11 - version 0.3.37

- fixed cookie issue causing HTTP 431 error by adding session limit

## 2026-03-11 - version 0.3.36

- fixed auth routes 404ing: `proxy.ts` was checking `pathname.startsWith("/api/auth/")` but `@auth0/nextjs-auth0` v4 registers its routes at `/auth/*` (login, logout, callback) — not `/api/auth/*`; those requests were falling through to `NextResponse.next()`, Next.js found no page, and returned 404; users could not log in or out
- updated `proxy.ts` to check `/auth/` prefix; updated the unauthenticated `/protected` redirect target and the `vitals/page.tsx` fallback redirect from `/api/auth/login` → `/auth/login`
- no performance impact: the prefix check is a pure string comparison; `auth0.middleware()` scope is unchanged — still only invoked for `/auth/*` and authenticated `/protected/*` requests
- the broken logout was a mild security issue: session cookies had no UI escape path; the fix restores the ability for users to terminate their own sessions

## 2026-03-11 - version 0.3.35

- `EventModal` and `CountdownModal` both show an `[Event] [Countdown]` segmented toggle in the header when opened in create mode; clicking the inactive tab swaps to the other modal, carrying the date across so it pre-fills the new form; in edit mode the toggle is hidden and the header shows the plain title as before; the toggle is implemented via `onSwitchToCountdown` / `onSwitchToEvent` optional props so neither modal depends on the other

## 2026-03-11 - version 0.3.34

- added a `+` button next to the "Countdowns" link in `CalendarHeader` (desktop only, matching the `hidden sm:inline` pattern); clicking it opens `CountdownModal` in create mode directly from any calendar view; header accepts a new optional `onNewCountdown` prop; `CalendarContent` passes `openNewCountdownModal` which carries the `initialDate` through so switching to the event modal also pre-fills the date

## 2026-03-11 - version 0.3.33

- replaced all inline countdown chip divs in `CalendarGrid`, `DayView`, and `WeekView` with a new `CountdownChip` component; styling now matches `EventChip` exactly — same `border-l-[3px]` stripe, same `${color}18` translucent fill, same `text-xs font-medium px-2 py-0.5` sizing — with a small red dot (`h-1.5 w-1.5 rounded-full bg-red-500`) on the far right as the only visual differentiator; chip uses `flex` instead of `truncate` on the outer element so the dot always shows

## 2026-03-11 - version 0.3.32

- migrated `useCountdowns` from `useQuery` to `useInfiniteQuery`; cursor-based pagination using a composite `"YYYY-MM-DD__<uuid>"` cursor so page boundaries are stable across inserts and deletes; `getNextPageParam` returns `lastPage.nextCursor ?? undefined`; `countdowns` is now `data?.pages.flatMap(p => p.countdowns) ?? []` via `useMemo`; adds `fetchNextPage`, `hasNextPage`, `isFetchingNextPage` to the return shape
- `CountdownContent` now destructures `fetchNextPage`, `hasNextPage`, `isFetchingNextPage` and renders a "Load more" button below the list when `hasNextPage` is true
- `page.tsx` SSR seed updated: fetches and passes a full `CountdownPage` object as `initialPage` (was `initialCountdowns: Countdown[]`); hook seeds `initialData: { pages: [initialPage], pageParams: [undefined] }` with `staleTime: 0` — immediately stale so TanStack queues a background refetch on mount without blocking the UI; removed `initialDataUpdatedAt` (was `Date.now() - 29_000`) since it's redundant with `staleTime: 0` and calling `Date.now()` in render violates React's purity rules

## 2026-03-11 - version 0.3.31

- wired countdowns into all four calendar views so they show up inline on their target date
- `CalendarGrid` (month view): countdowns filter by exact day match using `isSameDay(parseISO(targetDate), day)`; events claim chips first, countdowns fill whatever slots are left inside the shared `VISIBLE_CHIPS = 3` budget; countdown chips use a dashed left border in the countdown color to stay visually distinct from event chips
- `DayView`: added countdown props and a `dayCountdowns` memo; all-day banner now shows even when there are only countdowns (no events required); countdown chips render below event chips in the same section
- `WeekView`: countdown chips land in the all-day CSS grid row, one per day column; they share the grid with multi-day event bars so they auto-stack into new rows if both land on the same day
- `YearView`: countdown dots share the 3-dot-per-day budget in `MiniMonth` alongside event dots; no click handler needed since MiniMonth navigates to the month view on click anyway
- `CalendarContent`: added `useCountdowns()` call (no SSR seed needed since this is not the countdowns page), `CountdownModalState` for the inline edit modal, and `CountdownModal` as a lazy dynamic import; countdown click from any view opens the modal in edit mode

## 2026-03-11 - version 0.3.30

- added `/calendar/countdown` page: `page.tsx` is a server component that SSR-seeds countdowns by calling the backend directly (no loopback), same pattern as the calendar page; `CountdownsWithData` wrapped in Suspense with an inline pulse skeleton so the shell streams immediately
- added `CountdownContent.tsx`: client component with the sorted list and modal wiring; `useMemo` re-sorts by `targetDate` after optimistic creates append to the end; `CountdownModal` is dynamically imported since it's only needed on user interaction
- added `CountdownCard.tsx`: memo'd card with a 3px colored left border (same stripe as `EventChip`), formatted target date, and a days-remaining badge that highlights when the date is today
- updated `useCountdowns` to accept `initialCountdowns` so the SSR seed works; same `initialDataUpdatedAt: Date.now() - 29_000` trick as `useCalendarEvents` to queue a background refetch shortly after mount without blocking the UI

## 2026-03-11 - version 0.3.29

- added `src/hooks/useCountdowns.ts` with `useCountdowns`; same TanStack Query + optimistic update pattern as `useCalendarEvents` with one difference: no date-range scoping means there's only ever one cache entry to snapshot and restore, so the mutation logic is simpler; all three mutations (create, update, delete) cancel in-flight fetches, apply optimistically, roll back on error, and invalidate on settle
- added `src/components/calendar/CountdownModal.tsx`; single-column modal using the existing `Modal`, `Input`, `Textarea`, and `Button` primitives; shows a live "X days away / X days ago / Today!" preview below the date input using `differenceInCalendarDays`; `FIELD_LABELS` const at the top keeps all label strings in one place; delete button only renders in edit mode, same danger variant as `EventModal`

## 2026-03-11 - version 0.3.28

- added `Countdown` and `CountdownModalState` types to `src/types/calendar.ts`; countdowns are a separate type from `CalendarEvent` so calendar views can handle the two cases independently without a discriminant field everywhere
- added countdown API client helpers to `src/lib/calendar.ts`: `fetchCountdowns`, `createCountdown`, `updateCountdown`, `deleteCountdown`; follow the same fetch pattern as the existing event helpers (hit the Next.js BFF, auth token never leaves the server)
- added `queryKeys.calendar.countdowns` to `src/lib/queryKeys.ts`; not scoped by date range because countdowns are fetched all at once and displayed wherever their target date falls in the calendar
- added BFF proxy routes at `/api/calendar/countdowns` (GET list, POST create) and `/api/calendar/countdowns/[id]` (GET, PUT, DELETE); same pattern as the events BFF routes, `auth0.getAccessToken()` attaches the JWT server-side

## 2026-03-11 - version 0.3.27

- fixed CLS on `/protected/vitals` caused by the chart skeleton and real chart having different heights: the skeleton was a flat `h-20` (80px) div, but the real `VisXYContainer` at `height={80}` also includes `VisAxis type="x"` which renders version tick labels below the 80px plot area, making the actual rendered height around 100px; all five metric charts swapping simultaneously on hydration caused a ~20px layout shift each
- extracted `CHART_AREA_HEIGHT` and `CHART_CONTAINER_HEIGHT` consts at the top of `VitalsChart.tsx`; both the skeleton div and the real chart wrapper now use `CHART_CONTAINER_HEIGHT` (100px) as their reserved height, so future height adjustments only need to happen in one place

## 2026-03-11 - version 0.3.26

- fixed `src/middleware.ts`: `auth0.middleware()` by itself does not redirect unauthenticated users for non-auth routes — it handles login/logout/callback and touches rolling sessions, then returns `NextResponse.next()` regardless of session state; added an explicit `auth0.getSession(req)` check before `auth0.middleware` for `/protected/*` routes so unauthenticated requests are redirected to login immediately; `getSession(req)` reads from `req.cookies` directly (no network call, no `next/headers`), so this adds no measurable TTFB cost and unauthenticated requests skip `auth0.middleware` entirely which is actually slightly faster
- added accurate comment to `fetchVitals` in the vitals page explaining that `next: { revalidate: 60 }` keys the data cache by URL only (Authorization header is not part of the key), and why that's fine here: the vitals aggregates are site-wide P75 scores, not per-user data, so the cached response is correct for any authenticated caller; auth is still enforced at the page level before the fetch runs

## 2026-03-11 - version 0.3.25

- restored `src/middleware.ts` with a narrow `config.matcher` covering only `/api/auth/:path*` and `/protected/:path*`; the middleware was removed previously because `auth0.middleware()` was running on every route in the app and making a network call to Auth0 on each request, which showed up as TTFB degradation across the whole site; the new matcher limits that cost to only the routes that actually need token refresh and session validation
- `/api/auth/*` is in the matcher so the Auth0 login/logout/callback routes work at all; `/protected/*` is in the matcher so unauthenticated users get redirected to login and access tokens are silently refreshed before they expire
- added `export const dynamic = "force-static"` to `src/app/protected/page.tsx` as an explicit build-time guarantee that the page is always statically pre-rendered; middleware enforcing auth at the edge and the page being statically cached are orthogonal, the middleware runs before the cached HTML is served so a static page can still be auth-protected; if anything dynamic is ever added to the page component the build fails instead of silently downgrading

## 2026-03-11 - version 0.3.24

- fixed LCP and a minor CLS on `/protected` caused by the `reveal()` entrance animation system: the H1 heading was wrapped in `reveal(loaded, "")` which renders it as `opacity-0` until after hydration and a 700ms CSS transition, making LCP consistently bad since the browser doesn't count invisible elements as LCP candidates; removed the `reveal()` wrapper from the heading div so the H1 is visible in the SSR HTML on first paint
- replaced the inline skeleton `<span>` in the H1 for the loading user name with a plain `"there"` fallback; the skeleton span was a minor CLS source when the real name arrived and changed the H1 layout; the text "there" and a typical first name are close enough in length that there's no visible shift
- feature cards and dev notes sections keep their staggered entrance animations since they aren't LCP candidates

## 2026-03-11 - version 0.3.23

- fixed a two-round-trip fetch waterfall on `/protected/vitals` that was hurting TTFB and LCP: `fetchVersions` and `fetchByVersion` ran in parallel, then `fetchVitals` waited for them to finish so it could use `versions[0]` as the default selected version, adding a full extra backend round trip on every page load; all three fetches now run in a single `Promise.all` by passing `urlVersion` directly (or `undefined` for all-time aggregates), then `selectedVersion` is derived from the versions result after everything resolves
- replaced `cache: "no-store"` on the summary and by-page fetches inside `fetchVitals` with `next: { revalidate: 60 }` so repeated requests within the same minute hit the Next.js data cache instead of going to the backend again; versions and by-version stay as no-store since those are quick and need to reflect newly deployed versions
- added JSDoc to all three server-only fetch functions in the vitals page component

## 2026-03-02 - version 0.3.22

- added `/thoughts/landing-page` write-up covering the Three.js particle network: why Three.js in the hero, how the orbital swirl works (tangential nudge per frame instead of explicit orbit math), the pre-allocated `Float32Array` line buffer with `drawRange`, why line colors fade toward black as particles drift apart, how mouse attraction uses `Raycaster.intersectPlane` to get world-space coordinates, the 3-draw-call render loop, and canvas layering with `pointer-events-none` and `z-10` on the text
- updated README with a dedicated landing page hero section, Three.js entry in the tech stack table, and four new "Things I learned" bullets covering the pre-allocated buffer pattern, tangential velocity bias for orbits, mouse world-space unprojection, and `sizeAttenuation: false` for pixel-crisp dots

## 2026-03-02 - version 0.3.21

- added a Three.js particle network to the hero section (`HeroScene.tsx`): 160 nodes (22 larger "star" anchors, 138 small particles) that orbit the center and draw live connection lines to any neighbor within range
- moving the mouse pulls nearby particles toward the cursor, clustering them into a dense web of lines that appears and disappears as particles move in and out of connection range
- each particle has a tangential velocity bias (perpendicular to the radial direction) so the whole field naturally swirls without needing an explicit orbit system
- line color fades to black as the distance between two particles grows toward the connection threshold, so connections look bright when particles cluster and dim as they drift apart
- line geometry is pre-allocated at MAX_PAIRS worst case and uses `drawRange` updated each frame rather than creating new geometry, so there's no GC pressure from 12,720 pairwise checks per tick
- two Points objects (star-sized 3.5px and small 2px) share the color palette of blue, indigo, violet, and cyan matching the design tokens
- canvas uses `alpha: true` and `setClearColor(0, 0)` so the page background shows through on both light and dark mode
- camera parallax on mouse and touch movement, with a reused `Vector3` inside the tick loop to avoid per-frame allocations
- loaded with `next/dynamic` and `ssr: false` so Three.js never runs server-side
- cleanup disposes all three geometries, three materials, and the renderer on unmount
- installed `three` and `@types/three`

## 2026-03-01 - version 0.3.20

- converted `CardSearch` from a manual `useState(results) + useState(loadedQuery) + useRef(AbortController) + useEffect` fetch pattern to `useQuery`; the query key is `["tcg", "cards", "search", debouncedQuery]` so TanStack cancels the in-flight fetch and issues a fresh one automatically on every keystroke — no `abortRef`, no `AbortError` catch, no manual `setResults`
- `enabled: debouncedQuery.trim().length > 0` prevents any fetch until the user starts typing; `staleTime: 5 * 60_000` caches each distinct search term for 5 minutes so re-typing the same query is instant; `placeholderData: []` resets the visible list to empty while the new fetch is in flight so old results never flash for the new query
- `results = (searchQuery.data ?? []).slice(0, DROPDOWN_LIMIT)` and `loading = searchQuery.isLoading && debouncedQuery.trim().length > 0` are derived from the query; a `useEffect([searchQuery.data])` opens the dropdown automatically when results arrive; removed `useState(results)`, `useState(loadedQuery)`, `abortRef`, and the fetch `useEffect`
- converted `EventModal` card loading from a custom `useEffect` that called `fetchEventCards` to `useQuery<EventCard[]>`; the query is `["calendar", "events", event?.id, "cards"]` with `enabled: !!event?.id` and `staleTime: 0` so reopening the modal always shows fresh data with the first render using the cached response while the refetch runs in the background
- a seeding `useEffect([cardQuery.data, cards.length])` copies freshly fetched `EventCard[]` into local `DraftCard[]` state on first arrival; the `cards.length === 0` guard prevents the query's background refetches from overwriting quantity/notes edits the user has made while the modal is open
- removed `fetchEventCards` import from `EventModal`; removed `EventCard` import from `@/types/calendar` that was previously unused after the conversion (it is re-added from the correct location for the `useQuery` type parameter)
- updated three "Things I learned" bullets in the README: IntersectionObserver bullet now mentions `fetchNextPage` and the React 19 `useEffect` requirement; AbortController bullet now describes TanStack's built-in signal handling; `hasServerData` ref bullet now describes the `initialData` option that replaces it

## 2026-03-01 - version 0.3.19

- converted `GraphQLContent` from a manual `useState + useEffect + AbortController + loadedKey/filterKey/hasServerData` pattern to `useInfiniteQuery`; the query key includes `debouncedName` and `activeType` so TanStack cancels the in-flight request and fires a fresh one automatically on every filter change — no `abortRef`, no explicit abort, no `AbortError` catch
- removed `useState(pokemon)`, `useState(total)`, `useState(offset)`, `useState(error)`, `useState(loadingMore)`, `useState(loadedKey)`, `abortRef`, `hasServerData` ref, `EMPTY_FILTER_KEY` constant, and `handleLoadMore`; `useEffect` now exists only for the `IntersectionObserver` reconnect
- `getNextPageParam: (lastPage, allPages) => lastPage.pokemon.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined` drives sequential offset pagination; `initialPageParam: 0` starts at offset 0
- `pokemon` is `useMemo(() => data?.pages.flatMap(p => p.pokemon) ?? [])` and `total` is `data?.pages[0]?.total ?? 0`; `isLoading` replaces the derived `loading = loadedKey !== filterKey`; `isFetchingNextPage` replaces the `loadingMore` boolean
- `initialData` prop seeds the query cache when server-side data is available: `{ pages: [seedPage], pageParams: [0] }` with `staleTime: 30_000`; TanStack skips the initial fetch and considers the data fresh for 30 seconds — replaces the `hasServerData` ref and the pre-seeded `loadedKey` trick
- added `PokemonPage = { pokemon: Pokemon[]; total: number }` to `src/types/graphql.ts` — the per-page shape for `useInfiniteQuery`'s `TData`
- added `fetchPokemonPage({ name, type, offset, signal })` to `src/lib/graphql.ts`; it calls `buildPokemonQuery` + `fetchPokemon` and maps `PokemonListResult` to `PokemonPage`; the component's `queryFn` delegates to this function so the mapping logic stays in the lib
- the live query panel is unchanged; `buildPokemonQuery` is still called with `debouncedName`, `activeType`, `PAGE_SIZE`, and `displayOffset` (derived from `data?.pageParams.at(-1)`) so the panel reflects the most recently fetched page
- added a new iMessage exchange to `/thoughts/graphql` covering the `useInfiniteQuery` migration: what was removed, how the key change replaces `AbortController`, and how `initialData` replaces `hasServerData`

## 2026-03-01 - version 0.3.18

- converted `BrowseContent` and `SetCardsGrid` from manual `useState + useCallback + AbortController + loadedPages` infinite scroll to `useInfiniteQuery`; the query key changes when search or type changes, which causes TanStack to cancel the in-flight request via its own abort signal — removing `abortRef`, `AbortError` catch, and the `useCallback(fetchCards)` wrapper entirely
- `getNextPageParam: (lastPage, _allPages, lastPageParam) => lastPage.hasMore ? lastPageParam + 1 : undefined` drives sequential pagination; `initialPageParam` reads `?page=N` from the URL on mount so the session resumes from the last loaded page without the old sequential restore loop (the `for (let p = 1; p <= targetPage; p++)` loop is gone)
- `data.pages.flatMap(p => p.cards)` replaces the hand-rolled `setCards` append with dedup; `isFetchingNextPage` replaces `loadingMore` state and drives the skeleton tile row appended to the grid while the next page loads; `isLoading` drives the full-grid skeleton (first page only); `hasNextPage` gates the sentinel observer
- `initialData` in `BrowseContent` seeds the query cache with the SSR-fetched page 1 when `initialCards` is provided and the URL has no active filters; `staleTime: 30_000` when seeded, `10 * 60_000` otherwise; the server data is scoped to the no-filter query key so switching to a search automatically fetches fresh filtered results
- `hasServerData` ref, `isFirstMountRef`, `initialPageRef`, `loadedPages` state, and the restore loop are all removed; URL sync now watches `latestPage = data?.pageParams.at(-1)` — a derived number — so the effect only runs when the actual page depth changes
- added `CardPage = { cards: CardResume[]; hasMore: boolean }` to `src/lib/tcg.ts` and exported it; both components import the type from there; `SetCardsGrid` removes its local `CardResume` redefinition and imports from `@/lib/tcg` instead
- added a new iMessage exchange to `/thoughts/tcg` covering the `useInfiniteQuery` migration: what replaces `AbortController`, why the restore loop was dropped, and how the sentinel pattern changed
- updated README TCG section to reflect `useInfiniteQuery` as the pagination mechanism and remove the `AbortController` mention

## 2026-03-01 - version 0.3.17

- converted `EventsContent` from a manual `useState + useEffect + useRef(AbortController) + filterKey/loadedKey` derived loading pattern to `useQuery(queryKeys.calendar.eventsList({ startDate, endDate, cardName: debouncedCardName }))`; when any of the three backend filter params changes, the key changes and TanStack Query fires a fresh fetch automatically — no manual trigger, no AbortController wiring
- added `calendar.eventsList` to `queryKeys.ts` as a separate factory from `calendar.events`; the events list page takes `{ startDate, endDate, cardName }` (raw date strings plus debounced card name) while the calendar grid uses `{ start, end }` ISO timestamps; different shapes warrant separate keys so the two caches never collide
- the `queryFn` receives TanStack Query's abort `signal` from context and passes it to `fetch`; changing a filter cancels the previous in-flight request automatically on key change, replacing the manual `abortRef.current?.abort()` call
- `loading` is `eventsQuery.isLoading` — true only when there is no data for the current filter params and a fetch is in-flight; background refetches (focus, remount with `staleTime: 0`) happen silently without replacing the result list with a skeleton
- title filtering moved from inline `events.filter(...)` to a `useMemo` over `eventsQuery.data`; the memo re-runs only when the returned events or `debouncedTitle` change, not on every render; the `.sort(startDate desc)` is included in the memo so the array is stable until data or title changes
- error message rendered from `eventsQuery.error?.message` so the thrown error text from the `queryFn` reaches the user directly, with a fallback string for unexpected error shapes
- removed `useState(events)`, `useState(error)`, `useState(loadedKey)`, `useEffect`, `useRef`, and the `filterKey` derived string; imports drop `useEffect` and `useRef`, add `useMemo`, `useQuery`, and `queryKeys`

## 2026-03-01 - version 0.3.16

- converted `createEvent`, `updateEvent`, and `deleteEvent` in `useCalendarEvents` from manual `useCallback + setQueryData` handlers to three `useMutation` hooks with the full optimistic update pattern
- each mutation follows the same lifecycle: `onMutate` cancels all in-flight calendar event queries, snapshots the current cache entry for the visible range, and applies the change immediately to the cache so the grid responds before the server round-trip completes; `onError` restores the snapshot so a failed write leaves nothing broken; `onSettled` invalidates all calendar event queries via a `["calendar", "events"]` prefix match so every cached range syncs with the server regardless of which month is on screen
- the prefix invalidation covers multi-day events near month boundaries: deleting an event from the March view now also invalidates the April view's cache so stale data doesn't show up on next navigation
- `UseCalendarEventsReturn` gains `isCreating`, `isUpdating`, and `isDeleting` booleans derived from each mutation's `isPending` state; these replace the local `saving` and `deleting` booleans that `EventModal` was managing itself
- `EventModal` removes `const [saving, setSaving]` and `const [deleting, setDeleting]` state; it now accepts optional `isSaving` and `isDeleting` props which `CalendarContent` passes as `isCreating || isUpdating` and `isDeleting` from the hook; the three buttons (Cancel, Save/Create, Delete) read from props instead of local state; `setSaving(false)` in the catch block is gone because `isPending` resets automatically when a mutation settles
- `CalendarContent` passes `isSaving={calendarEvents.isCreating || calendarEvents.isUpdating}` and `isDeleting={calendarEvents.isDeleting}` to `EventModal`
- added exchange to `/thoughts/calendar` covering the switch to `useMutation` and what the optimistic pattern buys: automatic rollback on error, `isPending` driving button state, and prefix invalidation broadcasting to all cached ranges

## 2026-03-01 - version 0.3.15

- converted the read side of `useCalendarEvents` from a manual `useEffect + AbortController + useState(loadedRange)` pattern to `useQuery(queryKeys.calendar.events({ start, end }))`; the query key includes both `start` and `end` so navigating months automatically triggers a fresh fetch without a manual effect dependency
- the `queryFn` receives TanStack Query's own `signal` from context and passes it to `fetch`, replacing the manual `AbortController`; when the user navigates before a fetch completes, TanStack Query cancels the in-flight request automatically on key change
- `staleTime: 0` so every mount triggers a background check against the server; calendar events can be written from another tab or device at any time, and unlike static reference data (teams, league history) serving a stale cache silently would be incorrect
- `initialData: initialEvents` and `initialDataUpdatedAt: Date.now() - 29_000` feed SSR-seeded events into the query cache on first render so the calendar shows data immediately with no loading state; the 29-second age hint tells TanStack Query the data is almost stale and queues a background refetch after mount without blocking the first paint
- `loading` is `isLoading || isFetching` so the loading indicator covers both the initial fetch and background refreshes; `error` is derived from `isError` and `queryError.message`; `events` is `data ?? []`
- mutation handlers (`handleCreate`, `handleUpdate`, `handleDelete`) now write to the query cache via `queryClient.setQueryData` instead of calling `setEvents`; the effect is identical from the caller's perspective (changes appear immediately), but the data source is now the query cache rather than a parallel `useState`; the `useCallback` deps include `queryClient`, `start`, and `end` so each handler targets the currently visible month's cache key
- removed `useState(events)`, `useState(error)`, `useState(loadedRange)`, `useEffect`, and the derived `loading = loadedRange !== rangeKey` expression; the return signature (`events`, `loading`, `error`, `createEvent`, `updateEvent`, `deleteEvent`) is unchanged so `CalendarContent` needs no updates
- `fetchEvents` import removed since the queryFn now inlines the fetch directly to get access to the abort signal

## 2026-03-01 - version 0.3.14

- created `src/app/fantasy/nba/player/stats/types.ts` to co-locate all types for the Player Stats page; it re-exports `Team`, `Player`, `PlayerStats`, `SortKey`, and `PlayerRow` from `@/types/nba` so `StatsContent` has one local import source instead of reaching into the global types directory
- converted `StatsContent` teams fetch from a bare `useEffect + fetch + setState` to `useQuery(queryKeys.nba.teams(), staleTime: 5 * 60_000)`; the query function fetches, checks `res.ok`, and sorts the list alphabetically before returning, so the selector is always in the right order without extra state
- auto-selection of the first team uses a `useEffect` that watches `teamsQuery.data`; `onSuccess` was removed in TanStack Query v5 so this is the correct v5 pattern; the `selectedTeamId` dep prevents the effect from overwriting a user-selected team on re-renders
- converted players fetch to `useQuery(queryKeys.nba.players(selectedTeamId), enabled: !!selectedTeamId, staleTime: 5 * 60_000)`; when the team selector changes, the key changes and TanStack Query re-fetches automatically with no manual trigger
- converted per-player stats fetches from a `Promise.allSettled` batch loop with `AbortController + useCallback + useRef` to `useQueries`; all player queries fire in parallel instead of in batches of three, which is faster when the network and API can handle the concurrency; `useQueries` also handles cancellation and deduplication automatically
- `remaining` is now `statsQueries.filter(q => q.isPending).length` — a derived value from query state rather than a manually tracked counter; skeleton rows are shown for in-flight queries and disappear as each one resolves
- resolved rows are filtered from `players.map(...)` — only queries that are no longer `isPending` contribute to the rows array; pending players appear as skeleton rows instead of empty data cells; `q.isError` drives the per-row error state that shows the red row and opens the error modal on click
- retry wires to `teamsQuery.refetch()` or `playersQuery.refetch()` depending on which layer failed; per-row errors are retried implicitly by the query cache
- removed `AbortController`, `abortRef`, `useCallback`, `useEffect` for fetching, and five `useState` variables (`teams`, `rows`, `remaining`, `loading`, `error`)

## 2026-03-01 - version 0.3.13

- converted `FeatureHub`'s `/api/me` fetch from a manual `useState` + `useEffect` pattern to `useQuery({ queryKey: queryKeys.me(), staleTime: 5 * 60_000 })`; removes two state variables and the effect entirely; `isLoading` drives the skeleton bones in the header while the request is in-flight, same as before but without the boilerplate
- converted `LeagueContent` from five `useState` variables (`teams`, `members`, `leagueName`, `loading`, `error`) plus `useRef`, `useCallback`, and `useEffect` to a single `useQuery({ queryKey: queryKeys.nba.league(season), staleTime: 60 * 60_000 })`; the query function fetches and sorts teams in one place, returning `{ leagueName, teams, members }` as a single object; switching the season selector now automatically triggers a refetch because `season` is part of the query key; the retry button calls `leagueQuery.refetch()` instead of re-calling the old callback

## 2026-03-01 - version 0.3.12

- added `@tanstack/react-query` and `@tanstack/react-query-devtools` as the data fetching layer for the app; this is the foundation for converting every manual useEffect + fetch + AbortController + derived-loading-state pattern to proper query and mutation hooks over the next several steps
- created `src/app/providers.tsx`, a client component that wraps the app in `QueryClientProvider`; the `QueryClient` lives in `useState` so each server render gets a fresh instance while the browser keeps a stable singleton across navigations; `ReactQueryDevtools` mounts only when `NODE_ENV` is development so there's no bundle impact in production
- created `src/lib/queryKeys.ts` with typed key factory functions for every data domain in the app (me, calendar events, nba teams/players/stats/league, tcg cards, graphql pokemon); centralizing keys here means a `useQuery` call and its corresponding `invalidateQueries` call always use the same shape, change a key once and every reference stays in sync
- wired `Providers` into the root layout wrapping `ThemeProvider`, so `useQuery` and `useMutation` are available anywhere in the component tree

## 2026-03-01 - version 0.3.11

- added `/dev/skeletons` hub page as a dev-only preview tool (404s in production via `notFound()` guard): inline previews of all calendar skeletons (Month, Day, Week, Year), event skeletons (EventList, EventDetail), ThoughtsSkeleton, and FeatureHub header bones; plus linked sub-routes for the full-page skeletons that need their own page to render correctly, `/dev/skeletons/protected`, `/dev/skeletons/tcg-sets`, `/dev/skeletons/tcg-pocket`, `/dev/skeletons/tcg-card`, and `/dev/skeletons/tcg-set-detail`

## 2026-03-01 - version 0.3.10

- updated some skeletons to fully match actual components
- fixed `/protected` TTFB (was 2.1s) and FCP (was 3.0s): `page.tsx` was calling `auth0.getSession()` to pass user info to `FeatureHub`, which forced Next.js to treat the route as dynamic and spin up a cold serverless function on every visit; removed the session call from `page.tsx` so it's now a plain sync component — Next.js statically pre-renders it at build time and Vercel serves the HTML from CDN edge; TTFB drops from cold-start (~2.1s) to CDN-served static (~50ms)
- added `GET /api/me` — reads the Auth0 session cookie server-side and returns `{ name, email }`; same BFF pattern as the calendar routes so the token never reaches the browser; `FeatureHub` fetches this on mount and shows pulsing skeleton bones in the header while in-flight, replacing them with name and email once resolved; the cookie decrypt is fast (~5ms) so even including network round-trip, FCP is unaffected since the page HTML has already painted by then

## 2026-03-01 - version 0.3.9

- refactored stagger delay approach in `FeatureHub`: replaced the hardcoded `STAGGER_DELAYS` array with a single `STAGGER_MS = 75` constant; delay is now computed as `i * STAGGER_MS` and applied via an inline `transitionDelay` style instead of Tailwind delay classes — dynamic class names like `delay-[${ms}ms]` are stripped by Tailwind's scanner at build time, so inline styles are the correct approach; new cards and dev notes automatically get the right delay with no array to maintain
- fixed landing page sections appearing empty in Vercel production: the root cause was `script-src 'nonce-{nonce}' 'strict-dynamic'` in `proxy.ts` — the landing page became fully static (SSG) after moving the auth redirect to middleware in 0.3.5, so Vercel's edge middleware now applies the CSP to every CDN-cached response; Next.js inlines RSC payload scripts (`self.__next_f.push(...)`) directly into the HTML with no nonce attribute, and `'strict-dynamic'` ignores `'self'`, so all scripts were blocked and JS never ran; HeroSection still animated because its animation is a `@keyframes` CSS rule in a `<style>` tag — no JS needed
- fixed `connect-src` missing `https://vitals.vercel-insights.com` — `connect-src 'self'` was silently blocking Vercel Speed Insights from sending its beacons; added the domain explicitly so Speed Insights actually reports
- CSP approach changed from `'nonce-{nonce}' 'strict-dynamic'` to `'self' 'unsafe-inline'`: tried the "correct" fix of making `layout.tsx` async and reading the nonce from request headers to stamp it on the RSC inline scripts — it worked, but making the root layout async opts every page out of static generation (all routes become dynamic ƒ), which directly hurts TTFB and LCP; `'unsafe-inline'` is the standard Next.js CSP for apps with static pages, and the real XSS protection here is React's automatic JSX escaping — no `dangerouslySetInnerHTML` exists anywhere in the codebase, so user-generated calendar data flows through React's escaping pipeline and never reaches the DOM as raw HTML

## 2026-02-28 - version 0.3.8

- fixed build crash on `/tcg/pokemon/sets/[setId]`: `generateStaticParams` already had a try/catch so an SDK list failure returns `[]` and skips pre-rendering, but `generateMetadata` and the page component had bare `tcgdex.set.get()` calls with no error handling. A network timeout during static generation threw an unhandled exception that killed the build worker; both calls now use `.catch(() => null)` so a timeout produces a graceful 404 for that set instead of taking down the whole build

## 2026-02-28 - version 0.3.7

- ThoughtCard text no longer truncates, preview text wraps to new lines instead of getting cut off with an ellipsis
- cards in the same grid row stay equal height: `h-full` on the inner Link fills the grid item's height (CSS grid stretches all items in a row to the tallest by default via `align-items: stretch`); without it, the card background and border stopped at content height even when the grid item was taller

## 2026-02-28 - version 0.3.6

- FCP fix for `/calendar/events/[id]`: was fully client-side (useState + useEffect fetching event + cards after hydration -- blank page, then skeleton, then content); converted to async server component with Suspense using the same CalendarWithData pattern -- EventDetailWithData fetches both in parallel directly from the backend, EventDetailSkeleton streams in the HTML shell, real content on the first paint
- added `loading.tsx` for the `/calendar/events/[id]` route segment so navigating to an event shows the skeleton immediately during SSR
- fixed EventDetailSkeleton grid to match the real content: added `md:grid-cols-5` to the card grid (was `grid-cols-3 sm:grid-cols-4`, missing the wider breakpoint)
- added `loading: () => null` to the EventModal `next/dynamic` call -- without a loading prop, a missing chunk throws to the nearest Suspense boundary (root); explicit null keeps the modal quiet while the chunk downloads on first open
- `transition-all` → specific property lists across 7 files:
  - `FeaturesSection.tsx`: gradient overlay uses `opacity` + `transform` (scale) -- changed to `transition-[opacity,transform]`
  - `YearView.tsx`, `BrowseContent.tsx`, `sets/page.tsx`, `pocket/page.tsx` (×2), `SetCardsGrid.tsx`: all hover only `border-color` + `box-shadow` -- changed to `transition-[border-color,box-shadow]`
  - `EventModal.tsx`: color swatch buttons had `transition-all` on focus-visible outlines; removed the transition (focus indicators should appear instantly per WCAG)
- added `export const revalidate = 86400` to `/tcg/pokemon/page.tsx` -- card data is static, no reason to re-render the RSC per request
- added `export const revalidate = 3600` to `/graphql/page.tsx` -- Pokémon data changes infrequently; cached RSC serves repeat visits without re-hitting PokeAPI
- updated `/thoughts/calendar` with an exchange on the event detail SSR conversion

## 2026-02-28 - version 0.3.5

- TTFB fix on "/": landing page was calling `auth0.getSession()` solely to redirect logged-in users, which forced Next.js to treat the page as dynamic and re-render it on every request; moved the redirect to `proxy.ts` middleware (which already runs per-request) so the page component has no async work and Next.js can statically pre-render it at build time
- updated the TTFB improvement card in the vitals dashboard to mention the static landing page
- updated `/thoughts/vitals` with a new exchange on why the landing page TTFB was bad and how the middleware redirect fixed it

## 2026-02-28 - version 0.3.4

- INP fix: replaced `transition-all` in `Section.tsx`'s `reveal()` with `transition-[opacity,transform]` -- `transition-all` forces the browser to watch every CSS property for changes on every frame, even for an animation that only touches opacity and transform; scoping it to the two actual properties cuts per-frame work across every staggered card on the site
- INP fix: split entrance animation and hover transition onto separate elements in FeatureCard and ThoughtCard -- both previously lived on the same div, which caused the last `transition-property` rule to silently clobber the other; outer div now carries the entrance animation only, inner div carries the hover effect only
- INP fix: wrapped `setLoaded(true)` in `startTransition` inside FeatureHub -- setting loaded kicks off staggered re-renders across 7+ cards; marking it non-urgent lets React drain any queued input events before doing the paint
- INP fix: `VersionSelector` now wraps `router.push()` in `startTransition` for the same reason; the `<select>` goes visually disabled with reduced opacity while the transition is pending so the user gets feedback without a blocked interaction
- updated the INP improvement card in the vitals dashboard to describe what's actually in the codebase: specific transition properties + startTransition, not the old memo/callback note which described calendar optimizations
- updated `/thoughts/vitals` with a new exchange covering why `transition-all` is expensive and how `startTransition` defers non-urgent re-renders

## 2026-02-28 - version 0.3.3

- protected hub CLS fix: FeatureHub's feature card preview area now has a fixed height of 112px with overflow-hidden, matching the skeleton's preview bone exactly; VitalsPreview with 5 rows was taller than 112px and was causing a layout shift on every page load
- vitals chart CLS fix: VitalsChart now renders a matching 5-card skeleton grid on the server instead of returning null; unovis needs the DOM so it was always a client-only render, and the chart popping in after hydration was pushing the by-page table down
- protected hub stagger fix: STAGGER_DELAYS only had 7 entries for 8 thought cards; Styling Decisions (index 7) fell back to delay "" and fired at the same time as Bundle Analysis instead of last in the cascade; added delay-[525ms] to complete the sequence
- `CalendarSkeletons.tsx` code quality: moved GRID_COLS, GRID_CELLS, LAST_ROW_START, and the other view constants to module level instead of inlining them inside functions; added WEEK_DAY_COUNT and YEAR_MONTH_COUNT so magic numbers don't drift from the real views
- improved calendar page metadata description

## 2026-02-28 - version 0.3.2

- calendar CLS fix: day, week, and year views now each have a pixel-matched skeleton shown while the JS chunk downloads; DaySkeleton mirrors DayView's 44px row height and 4.5rem gutter, WeekSkeleton mirrors WeekView's 48px rows and 7-column header, YearSkeleton mirrors YearView's responsive grid of 12 mini month cards
- extracted all four skeletons into `src/app/calendar/CalendarSkeletons.tsx` -- MonthSkeleton (previously inlined in loading.tsx), DaySkeleton, WeekSkeleton, YearSkeleton; loading.tsx now just re-exports MonthSkeleton to keep things in one place
- each `next/dynamic` call for DayView, WeekView, and YearView in CalendarContent now passes a `loading` prop so there's no unsized layout jump on first switch
- updated the CLS improvement card in the vitals dashboard to accurately describe what's in the codebase now
- updated `/thoughts/calendar` write-up to mention the view-specific skeletons and the CLS fix

## 2026-02-28 - version 0.3.1

- `WebVitalsReporter` now includes `app_version` in every beacon -- read directly from `package.json` at build time via a static import, no env var needed; old rows default to `unknown` and still show under "All versions"
- version selector added to the vitals dashboard nav -- a `<select>` that pushes `?v=X.Y.Z` to the URL; selecting a version filters all aggregates to that version and above; defaults to the latest version on first load; "All versions" is always available
- version filtering is semver-aware -- uses `string_to_array(app_version, '.')::int[]` in Postgres so `0.10.0 > 0.9.0` sorts correctly; `unknown` rows are excluded from filtered views
- version trend charts added using unovis -- one sparkline per metric showing P75 across the last 5 versions, color-coded by Good/Poor thresholds; only shows when there are at least 2 versions of data
- new `GET /api/vitals/versions` and `GET /api/vitals/by-version` BFF routes -- both return empty gracefully if the backend endpoints are not deployed yet, so the selector and chart just stay hidden
- `VitalsPage` fetches versions, version trend data, and aggregates in parallel; selected version lives in the URL so filtered views are shareable
- extracted `METRIC_ORDER`, `METRIC_CONFIGS`, `MetricConfig`, `formatValue`, and `getRatingColor` into `src/lib/vitals.ts` -- was duplicated between `VitalsContent` and `VitalsChart`
- updated `/thoughts/vitals` write-up to cover version filtering and the trend chart

## 2026-02-27 - version 0.3.0

- calendar page now streams server-side data on first load -- `CalendarWithData` async server component fetches the current month's events directly from the backend at request time; `CalendarContent` is wrapped in a `Suspense` boundary so the skeleton arrives in the HTML shell and real data replaces it once the fetch resolves
- `loading.tsx` added to the calendar route segment -- 42-cell animate-pulse skeleton matching the month grid exactly (7 columns, 6 rows), prevents layout shift when the stream resolves
- `useCalendarEvents` hook now accepts an `initialEvents` prop; when provided it seeds state from server data and pre-marks the current range as loaded so no redundant client-side fetch fires on mount
- `CalendarContent` uses `next/dynamic` for DayView, WeekView, YearView, and EventModal -- these only load when the user actually needs them; CalendarGrid stays as a static import since it's the LCP element
- extracted `GRID_COLS`, `GRID_CELLS`, and `LAST_ROW_START` as named constants in `loading.tsx` so the skeleton dimensions are readable and won't drift from the real grid
- `proxy.ts` now calls `auth0.middleware()` only for `/auth/*` routes; all other routes use `auth0.getSession()` which reads the encrypted session cookie locally with no network round-trip -- removes TTFB overhead on every protected page load
- server component calls the backend directly instead of going through `/api/calendar/events` to avoid a loopback HTTP call to the same server
- updated `/thoughts/calendar` write-up with a section on the streaming SSR approach and lazy-loaded views

## 2026-02-27 - version 0.2.9

- added `src/app/icon.tsx`, a custom favicon using Next.js ImageResponse (dark background, white "P", served at /icon as PNG; falls back to existing favicon.ico in older browsers)
- added `src/app/opengraph-image.tsx` for shared OG image generated at build time; dark background with site name and feature list
- added `src/lib/site.ts` — SITE_URL and OG_IMAGE config pulled from NEXT_PUBLIC_SITE_URL with paulsumido.com as fallback; single place to update if the domain changes
- added Open Graph and Twitter card metadata to pages
- each page extracts TITLE and DESCRIPTION as module-level consts to avoid repeating the strings across title, openGraph, and twitter fields
- added fallback openGraph and twitter metadata to root layout.tsx so pages without their own get at least the og:image and siteName
- thoughts pages use `type: "article"`, feature pages use `type: "website"`

## 2026-02-27 - version 0.2.8

- added `/thoughts/bundle` write-up covering the bundle analyzer setup
- added "Bundle Analysis" thought card to the FeatureHub dev notes grid
- removed `Auth0Provider` from `src/app/layout.tsx` since `useUser` is never called anywhere in the codebase, so the provider was wrapping the entire app for no reason and pulling the full Auth0 client SDK (`jose`, `oauth4webapi`, `openid-client`, `swr`) into the browser bundle
- removed the `auth0.getSession()` call from the root layout that existed solely to feed the provider
- root layout is now a synchronous function instead of async — no await calls remain at this level
- Auth0 session access still works in protected routes via `auth0.getSession()` in their own server components and API routes
- added `@next/bundle-analyzer` as a dev dependency
- configured in `next.config.ts` to activate when `ANALYZE=true` — wraps the existing config so the analyzer is a no-op in normal builds
- added `npm run analyze` script (`ANALYZE=true next build --webpack`) — the `--webpack` flag is required because `@next/bundle-analyzer` does not work with Turbopack, which Next.js 16 uses by default
- some components were unecessarily client components, so converted them into server components

## 2026-02-26 - version 0.2.7

- removed `src/app/loading.tsx` (root-level hero skeleton) — it was a Suspense boundary that cascaded before every route-specific loading state, causing two completely different skeletons in sequence when navigating to thoughts pages
- restored `src/app/thoughts/loading.tsx` with ThoughtsSkeleton — now the only skeleton shown when navigating to any thoughts page
- routes without a `loading.tsx` (calendar, NBA stats, league history) use React's `startTransition` to keep the previous page visible during navigation, which is correct since those pages have no server-side async work in their page.tsx

## 2026-02-26 - version 0.2.6

- fixed double-skeleton flash when navigating from protected page to any thoughts page
- removed `next/dynamic` from all thoughts `page.tsx` files — App Router already code-splits client components per route, so `next/dynamic` was adding a second Suspense boundary (one server-side from the RSC stream, one client-side from the chunk download) causing two skeleton renders
- added `src/app/thoughts/loading.tsx` — shows `ThoughtsSkeleton` once during the RSC fetch, which is the correct place for this loading state
- updated protected `loading.tsx` skeleton to match the actual FeatureHub layout — replaced the stale iMessage thread-list skeleton with bones for the sticky header, feature card grid (7 cards), and dev-notes thought card grid (7 cards)

## 2026-02-26 - version 0.2.5

- added `VitalsSection` to the landing page after GraphQLSection
- mock dashboard preview shows five metric cards (LCP, FCP, INP, CLS, TTFB) and a mini by-page table with color-coded ratings
- added Web Vitals card to `FeaturesSection` grid
- updated FeaturesSection subtitle to mention real-user performance monitoring

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
