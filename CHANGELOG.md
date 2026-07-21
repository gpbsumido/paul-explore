# Changelog

## 2026-07-21 - version 0.25.47

- Workflow Editor is now editable: drag nodes around the graph, edit a node's label and config in place, and add or remove connections between nodes

## 2026-07-21 - version 0.25.46

- Email Studio blocks are now editable in place (heading, body, button text type right in the preview) and image blocks import a local file straight to a data URL, no server

## 2026-07-21 - version 0.25.45

- Dashboard Designer drag-drop reworked on dnd-kit: drag a widget by its title onto another to drop it into that slot, or onto a trailing zone to send it to the end, so it lands in empty cells reliably. move and resize buttons still work

## 2026-07-21 - version 0.25.44

- Auth Flows fields are now actually typeable with inline validation (email format, password length, matching confirm, 6-digit code). still a walkthrough, nothing authenticates

## 2026-07-21 - version 0.25.43

- Referral Links now shows real click stats from the API, polling so the total ticks up, with a recent-clicks list and proper loading and empty states. an "open link" button records a click so you can watch it move

## 2026-07-21 - version 0.25.42

- Referral Links now creates real links against the portfolio_api: pick where it points on paulsumido.com, optionally name the slug, and the server enforces uniqueness (a taken slug comes back as a friendly error). shows the created link with copy

## 2026-07-21 - version 0.25.41

- UA Campaign Builder is now a stepped flow (basics, targeting, review) that only lets you move on once the campaign has a name, with the live preview card carrying across every step

## 2026-07-21 - version 0.25.40

- Web3 Gamer Hub now uses a real wallet connect (the shared wagmi/RainbowKit setup): connect a browser wallet and it shows your actual address, ENS, and balance. the NFT grid stays fixture data. the demo mounts its own Web3Provider so wallet code only loads here, not app-wide

## 2026-07-21 - version 0.25.39

- Web3 Gamer Hub: added a transfer mode with two wallet panes, drag an NFT from one to the other (or use the arrow button) to move it across, both grids update. simulated, no real transaction

## 2026-07-21 - version 0.25.38

- Web3 Gamer Hub: click an NFT to open a detail modal with its metadata, attributes, and a provenance/history timeline (fixture data)

## 2026-07-21 - version 0.25.37

- each Public Dashboards slug is now actually its own dashboard: different chart type (line, bar, area, radial), its own tiles, and metrics that read the right way (counts, percentages, dollars, latency) instead of the same layout recolored. added an acquisition slug too

## 2026-07-21 - version 0.25.36

- Public Dashboards now shows the JSON config each slug renders from, in a read-only syntax-highlighted panel, so you can see the config-in dashboard-out idea directly

## 2026-07-21 - version 0.25.35

- the Conference Game minigame now runs a 20-second round with a countdown, a game-over screen, a locally-persisted best score, and a play-again button

## 2026-07-21 - version 0.25.34

- fixed the Conference Game demo hanging on "building": the booth build now loads to 100% and drops into a small reflex minigame (tap the targets to score) instead of an endless spinner

## 2026-07-21 - version 0.25.33

- the AI Content Module can now "post to social (not really)": a confirm modal lets you pick a character voice (Hype Announcer, Grumpy Veteran, Lore Keeper, Meme Lord) and posts the copy restyled in that voice, streamed in

## 2026-07-21 - version 0.25.32

- Admin Suite rows can now reassign in place: move a user to another org, a key to another owner, or a config to another org, all persisted locally

## 2026-07-21 - version 0.25.31

- reworked the Admin Suite into a tabbed console (orgs, users, API keys, configs) with create flows that assign each new user/key/config to an org or user, plus per-key reveal/copy. Persists to local storage (local memory), no backend, via a new `usePersistentState` hook

## 2026-07-21 - version 0.25.30

- made the authenticated e2e login setup resilient to fix intermittent CI timeouts: it retries the Auth0 login once from a clean state, handles an occasional consent screen, and gives the login-to-app redirect a longer (45s) timeout

## 2026-07-21 - version 0.25.29

- reworked Per-title Dashboards (portal v1) into a config-driven view: one config array drives every title's dashboard, with a single mode that reskins per title and a compare mode that diffs two titles' KPIs with per-metric deltas and an overlaid chart

## 2026-07-21 - version 0.25.28

- computed the Pareto chart's cumulative line without a mutable render-scoped variable, satisfying the react-compiler immutability lint

## 2026-07-21 - version 0.25.27

- reworked Standard Analytics into an interactive dashboard: KPI cards double as metric selectors and a range (7/30/90d) and segment (all/new/returning) filter recompute a live area chart per domain tab. Also fixed the chart not drawing (recharts needs a definite-height parent)

## 2026-07-21 - version 0.25.26

- Chart Library charts can now be renamed and re-accented through a settings modal (opened from a gear on each chart); the accent recolors that chart's series via a scoped CSS variable

## 2026-07-21 - version 0.25.25

- Chart Library charts now use a shared design-system tooltip (a label plus a colored swatch and formatted value per series) instead of the default recharts one

## 2026-07-21 - version 0.25.24

- fixed the Chart Library focus mode: recharts charts rendered blank because their flex container measured zero height on mount; the focused chart now has a concrete min-height and renders

## 2026-07-21 - version 0.25.23

- expanded the Chart Library demo to all 17 chart types (added cohort heatmap, Pareto, sentiment word cloud, DAU trend/KPI, DAU-vs-MAU, session histogram, regional split, stacked revenue, correlation scatter, balance radar, and KPI tiles), all re-rolling on one seed

## 2026-07-21 - version 0.25.22

- removed unused `@dnd-kit/sortable` and `@dnd-kit/utilities`; the kanban only needs `@dnd-kit/core` (they can come back if a later drag demo needs sortable)

## 2026-07-21 - version 0.25.21

- Character Sheets now has a roster of characters and a stepped create modal (identity, then class, then the stat-point budget) for adding new ones

## 2026-07-21 - version 0.25.20

- Community Mode likes now tick up live on an interval, and clicking a post opens an analytics modal with its likes, replies, and a like-over-time trend

## 2026-07-21 - version 0.25.19

- Community Mode now lets you compose a new post or reply to a post through a modal; replies thread under their post with a count

## 2026-07-20 - version 0.25.18

- Post Queue kanban cards now open an edit modal on click (or keyboard activation) to change a post's title, scheduled day, and column

## 2026-07-20 - version 0.25.17

- reworked the Post Queue demo into a kanban board (Backlog / Scheduled / Published): cards drag between columns with dnd-kit, with keyboard-reachable move buttons as the accessible equivalent, and the week strip recomputes. Adds `@dnd-kit`

## 2026-07-20 - version 0.25.16

- scoped the wallet provider off the root layout so wagmi/RainbowKit and their telemetry no longer load (and trip the site CSP) on every page. It will mount around the gamer-hub NFT demo when that lands, keeping wallet code off pages that do not use it

## 2026-07-20 - version 0.25.15

- added a live store inspector to the Campaign Manager demo: a redux-devtools-style pane showing the dispatched-action log and a snapshot of the store, updating as you create and toggle campaigns

## 2026-07-20 - version 0.25.14

- reworked the Campaign Manager demo: creating a campaign now runs through a stepped modal (basics, then targeting/schedule, then a review) with progressive disclosure and per-step gating, backed by a reducer, instead of the inline one-field form

## 2026-07-20 - version 0.25.13

- marked the wallet/referral public exports (`ConnectWallet`, `useCreateReferral`, `useReferralStats`, `getReferral`) with `ts-prune-ignore-next` so the dead-code CI passes; the demos that consume them land in later phases

## 2026-07-20 - version 0.25.12

- added a typed client and react-query hooks for the portfolio_api referrals endpoints (create, resolve, click, stats), for the upcoming referral-links demo

## 2026-07-20 - version 0.25.11

- added a reusable `useWallet` hook (address, ENS, balance, connection status) and a design-system-styled `ConnectWallet` button, both usable anywhere under the wallet provider

## 2026-07-20 - version 0.25.10

- added app-wide wallet-connect support (wagmi + viem + RainbowKit) via a `Web3Provider` mounted in the root layout, themed to match light/dark. Groundwork for the gamer-hub wallet demo and reusable across the app. The WalletConnect project id reads from `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (injected wallets work without it)

## 2026-07-20 - version 0.25.9

- trimmed the work-portfolio stage padding and gaps so the demo surface gets a bit more room, groundwork for the demos that now use the extra space

## 2026-07-20 - version 0.25.8

- the work-portfolio info popup now stays open once shown (whether opened by hover or click) until you dismiss it with the close button or Escape; hovering away or pressing outside no longer closes it

## 2026-07-20 - version 0.25.7

- removed the Economy & Financial Health demo from the work-portfolio catalog and registry; it overlapped too much with the other analytics demos to earn its slot in the revamp

## 2026-07-20 - version 0.25.6

- gave the Work Portfolio hub card an animated mini dual-ticker preview (two rows of accent-dotted chips marqueeing in opposite directions, mirroring the real feature) so it stands out, with a static fallback under prefers-reduced-motion

## 2026-07-20 - version 0.25.5

- reordered the feature categories on the hub and landing so Engineering, Labs, and the everyday tools lead, and filed Work Portfolio under Engineering in both places

## 2026-07-20 - version 0.25.4

- bumped `@paul-portfolio/css` to 0.4.1, which fixes the ghost button label losing contrast on hover in dark mode. The work-portfolio ticker chips read correctly on hover now

## 2026-07-20 - version 0.25.3

- removed the Streaming Ops demo and its Ops Console project from the work-portfolio catalog, registry, and tests, trimming the set down as part of the demo revamp

## 2026-07-20 - version 0.25.2

- updated menu settings to include Work Portfolio

## 2026-07-20 - version 0.25.1

- fixed the work-portfolio tickers so chips under the trailing (cloned) half of a marquee are clickable again. The aria-hidden clone was `inert`, which kills pointer events, so everything to the right of the last real chip (e.g. past Analytics Portal v2 in the top ticker, and intermittently in the bottom one) was a dead zone. The clone now stays out of the a11y tree and the tab order but is clickable
- added the shared `PageHeader` to the work-portfolio page, so there's a back link to the dashboard and a light/dark theme toggle. The stage fills the space below it without scrolling
- known follow-up: the ghost chip label loses contrast on hover in dark mode. That's a design-system bug (`.btn--ghost:hover` uses a fixed light neutral); fixed in `@paul-portfolio/css` 0.4.1 and lands here on the next dependency bump

## 2026-07-19 - version 0.25.0

- version-only bump to control merge order (sits after the ds-backed-primitives stack). No functional change

## 2026-07-19 - version 0.24.0

- version-only bump to control merge order (sits after the work-portfolio stack). No functional change

## 2026-07-19 - version 0.23.5

- bumped `@paul-portfolio/react` and `/css` to 0.2.0 and `/tokens` to 0.1.9, which add IconButton, Textarea, InfoTip, Switch, Spinner, and Divider to the shared design system
- re-backed `components/ui/IconButton` onto the design system's `IconButton` (it was hand-rolled Tailwind before), so its styling now comes from the shared `.icon-btn` class like Button and Input already do. Kept it a thin wrapper so every call site keeps working. Left `Textarea` and `InfoTip` local for now: their local versions are richer than the new DS ones (a character counter / hideLabel on Textarea, rich `ReactNode` popover content on InfoTip), so backing those cleanly needs a DS enhancement rather than a lossy rewrap

## 2026-07-19 - version 0.23.4

- moved the content/ops/game demos onto design-system primitives: the campaign-manager name field and character-sheet name/class are `Input`, the character-sheet stat steppers and post-queue reorder controls are `IconButton`, and the streaming-ops run-script button is a `Button`. Accent CTAs (Create, Connect wallet, Start demo), the like buttons, and colored status toggles stay as-is

## 2026-07-19 - version 0.23.3

- moved the UA-batch demos onto design-system primitives: the signup wizard fields, campaign-builder name/reward, and referral handle are now `Input`; the signup Back / Start-over and admin reveal/copy buttons are `Button`. Accent CTAs (Next, Submit, Copy link, Generate), the budget slider, channel select, and template chips stay as-is

## 2026-07-19 - version 0.23.2

- moved the portal-v2 demos' neutral controls onto design-system primitives: the wallet-lookup address field and the LLM message field are now `Input`, the dashboard-designer palette and email-studio add-block buttons are `Button`, and the widget move/resize/remove controls are `IconButton`. Accent CTAs (Look up, Send), tabs, and segmented toggles stay as-is

## 2026-07-19 - version 0.23.1

- swapped the chart library's neutral controls onto design-system primitives: the Reroll button is now a `Button`, and the focus-mode prev/next are `IconButton`s from `@/components/ui`. Left the Grid/Focus segmented toggle custom (no segmented-control primitive)

## 2026-07-19 - version 0.23.0

- moved the work-portfolio chrome onto the app design-system primitives instead of hand-rolled buttons: the stage arrows, the chip info buttons, the explainer close, and the stage-header info button are now `IconButton`, and the ticker chip select body is a ghost `Button`, all from `@/components/ui` (which wraps `@paul-portfolio/react`). Kept the explainer window's anchored positioning custom since the shared `Modal` is centered-only

## 2026-07-19 - version 0.22.1

- work-portfolio write-up and docs, closing out the feature. Added a `/thoughts/work-portfolio` dev-notes page (summary + chat views) covering the reasoning: reconstruction over emulation, anonymizing client work and enforcing it with a test, the no-new-deps rule, the dual-ticker UX and its click-a-moving-target tradeoff, and shipping the whole thing as merge-order-independent PRs. Registered it in the thoughts hub
- listed the page in the README feature list and noted both routes in the architecture map

## 2026-07-19 - version 0.22.0

- work-portfolio e2e coverage (public Playwright project): intro state, clicking a feature chip and a project chip, arrow + keyboard navigation, `?feature=` deep link, and the explainer window open/close. Freezes CSS animations in the ticker-click tests so the marquee can't move mid-click

## 2026-07-19 - version 0.21.6

- wallet + NFT inventory demo from the gamer hub, the last of the 24: a fake wallet-connect that reveals an on-chain asset grid with rarity-tagged items. With this the whole demo set is wired, once all the demo PRs land every ticker feature has a real reconstruction behind it

## 2026-07-19 - version 0.21.5

- conference game demo: a faux game-embed frame with a booth-build start screen and a running-scene state, plus a note on how the original streamed WebGL gameplay events back into the analytics pipeline. The real engine build isn't shipped, so this stands in for the embed pattern

## 2026-07-19 - version 0.21.4

- streaming ops demo from the ops console: a topic table with consumer-lag badges (green/amber by threshold) and a fake maintenance console that appends rebalance-script output on run. Brings in a copy of the seeded-RNG helper for this batch

## 2026-07-19 - version 0.21.3

- character sheet demo from the content engine: edit a game character's name and class and spend a 30-point stat budget across STR/AGI/INT/LCK with live bars, capped both per-stat and at the total budget

## 2026-07-19 - version 0.21.2

- community mode demo from the content engine: a likeable community feed with a per-post engagement bar and a running total, standing in for the posts and community-analytics views

## 2026-07-19 - version 0.21.1

- post queue demo from the content engine: a reorderable list of scheduled posts (move up/down) with a week strip that shows how many posts land each day, recomputed from the queue

## 2026-07-19 - version 0.21.0

- first content-batch demo, the content engine's campaign manager: a list with a create form and an inline draft/live status toggle, standing in for the original's CRUD routes

## 2026-07-19 - version 0.20.6

- auth flows demo, last of the UA batch: a walkthrough of the identity screens (sign in, verify email, reset password, wallet passport) with dot navigation and a next-screen cta. Read-only fields, nothing authenticates, it's the shape of the hosted-identity flows. Also moved the referral-links seed write off the synchronous effect path for lint

## 2026-07-19 - version 0.20.5

- referral links demo from the UA tools: type a handle to mint a referral link, copy it, and watch a simulated click counter tick up (seeded off the handle so it's stable). Brings in a copy of the seeded-RNG helper for this batch

## 2026-07-19 - version 0.20.4

- campaign builder demo from the UA tools: a form (name, reward, budget slider, channel) with a live preview card that updates as you type, including an estimated-installs figure derived from the budget

## 2026-07-19 - version 0.20.3

- AI content module demo from the platform console: pick a template (patch notes, event teaser, store blurb), hit generate, and the canned copy streams in word by word. No model behind it, just the shape of the assisted-writing flow

## 2026-07-19 - version 0.20.2

- admin suite demo from the platform console: a members-and-roles table with color-coded role chips, plus a live API key you can reveal and copy (copy faked with local state, the key is obviously fake)

## 2026-07-19 - version 0.20.1

- signup flow depth: per-step validation (required fields plus a real email check) blocks advancing with inline errors, a campaign-attribution chip rides along from the entry link's utm source, and submitting lands on a completion screen that credits the campaign. Start-over resets it

## 2026-07-19 - version 0.20.0

- first UA-batch demo, the driver signup flow shell: a three-step wizard (contact, vehicle, review) with a step indicator and back/next navigation that carries entered values through to the review step. Validation, campaign attribution, and the completion screen come next

## 2026-07-19 - version 0.19.7

- workflow editor demo, the last of the portal-v2 batch: a hand-built SVG node graph (trigger, filters, enrich, action with connecting edges) where clicking a node shows its read-only config below. Stands in for the original's node-graph library plus code editor
- decoupled the stage placeholder test from any specific slug (it now renders the coming-soon demo directly) so wiring a demo can't break it, and moved the wallet-lookup loading flag off the effect path to satisfy the render-safety lint rule

## 2026-07-19 - version 0.19.6

- email studio demo from portal v2: a block-based email composer (add heading/text/button/image blocks to a live preview) next to a campaign table with per-campaign status chips and open rates

## 2026-07-19 - version 0.19.5

- LLM assistant tool-call rows: each answer now runs a fake tool first (query_warehouse, segment_players, search_docs) shown as a monospace row that ticks from running to done before the text streams. Makes it read like a real agent, retrieve then answer, not just a canned chatbot

## 2026-07-19 - version 0.19.4

- LLM assistant demo, chat shell: a chat surface that streams canned answers word by word, routed by keyword (retention, revenue, whales) with a fallback. Suggestion chips and a text input, send disabled while a response streams. Tool-call rows come next

## 2026-07-19 - version 0.19.3

- wallet lookup depth: the NFTs tab shows a rarity-tagged asset grid (or an empty state for wallets with none) and the Transactions tab a send/receive history. Switching to a data-heavy tab shows a brief skeleton-loading state first, like the original waiting on the chain-data API

## 2026-07-19 - version 0.19.2

- wallet lookup demo, shell: paste (or pick a sample) address and get an overview card of balance, tokens, NFTs, and first-seen, with Overview / NFTs / Transactions tabs. Data is a deterministic fake keyed off the address so the same address always resolves the same, no chain calls. NFT and transaction tabs come next

## 2026-07-19 - version 0.19.1

- dashboard designer gets its interactivity: widgets reorder by pointer drag or with left/right move buttons, and resize between one and two columns with a size toggle. Kept the button controls alongside drag so the reorder is keyboard-reachable and testable, not drag-only

## 2026-07-19 - version 0.19.0

- first portal-v2 demo, the dashboard designer shell. The original used a gridstack drag-drop engine; this rebuilds the idea as a CSS-grid canvas you compose from a widget palette (KPI tile, trend line, bar chart), with per-widget remove and an empty state. Reorder and resize come next. Carries a copy of the seeded-RNG helper so this demo batch stands alone

## 2026-07-19 - version 0.18.6

- slug-driven dashboards demo, the last of the analytics batch: a slug picker (`/d/<slug>`) that reshapes one dashboard entirely from config, different tiles, chart type, and accent per slug, which was the whole idea of the original catch-all route. Also tidied a couple of unused imports the linter flagged in the chart library

## 2026-07-19 - version 0.18.5

- economy and financial-health demo from portal v1: a faucet-vs-sink bar chart for an in-game currency next to a KPI grid (net supply, sink ratio, whales, inflation) that color-flags supply pressure

## 2026-07-19 - version 0.18.4

- per-title dashboard demo from portal v1: a game switcher (Game A/B/C, anonymized client titles) that reskins one dashboard with each game's accent color, genre, and its own MAU / ARPU / retention numbers and trend area

## 2026-07-19 - version 0.18.3

- standard analytics demo: the domain-split dashboard sections from the analytics suite. Tabs for Game / Web / On-chain / Sandbox, each swapping its own KPI trio and bar chart. Per-tab numbers are deterministic so switching back and forth is stable

## 2026-07-19 - version 0.18.2

- chart library demo gets its depth: two more chart types (a radial engagement gauge and a ranked-titles bar table) and a Grid/Focus toggle. Focus mode blows one chart up full-size with prev/next to page through all six, so it reads like the real thing where you drill into a single visualization

## 2026-07-19 - version 0.18.1

- first work-portfolio demo: the analytics chart library. The original was 17 documented ECharts components, this rebuilds a representative board on recharts (growth curve, conversion funnel, retention bars, revenue donut). All four charts share one seed so a Reroll button re-rolls the whole board at once, off a small seeded RNG. Wired into the demo registry so it replaces the coming-soon placeholder

## 2026-07-19 - version 0.18.0

- work-portfolio base is feature-complete. Accessibility pass: the stage announces selection changes through a polite live region, and axe scans of both the intro and a selected demo come back clean. Reworked the stage layout so the demo surface fills ~95% of the space between the two tickers (compact header row, arrows hugging the edges) instead of sitting small in the middle
- tightened a few things the linter caught along the way: the demo registry now resolves every slug to a component at module scope so render code does a plain lookup, the explainer's key handling moved to a document listener (a dialog is a container, not an interactive element), and the deep-link and reduced-motion effects defer their state writes off the synchronous effect path

## 2026-07-18 - version 0.17.12

- work-portfolio demo stage. Each feature resolves through a registry to its demo component behind `next/dynamic` (own chunk, skeleton while loading), falling back to a coming-soon placeholder — demo PRs will each flip exactly one registry line, which is what makes them mergeable in any order. The stage surface carries the owning project's accent theme (tint, accent CSS var, mono/sans flavor): site chrome outside, original-app flavor inside
- built the reference demo end to end: the driver-onboarding real-time dashboard, KPI tiles plus a signups line chart (recharts) advancing on a local interval that stands in for the original polling API

## 2026-07-18 - version 0.17.11

- work-portfolio explainer hover intent: resting the mouse on an i button for 350ms opens the window unpinned, and leaving closes it again. A click pins it so mouse-out keeps it open. Timer-based, tested with fake timers

## 2026-07-18 - version 0.17.10

- work-portfolio explainer window. Every chip and the stage header carry a small i button (chips got restructured into a shell with two buttons, since buttons can't nest). Clicking it opens an anchored dialog: feature explainers show what the feature did, the original stack, and what's real vs mocked in the reconstruction; project explainers show the blurb, stack, and the features that didn't make the ticker. Esc, outside presses, and the close button dismiss it; focus is trapped inside while open, and it marks itself as an isolated keyboard scope so arrow keys don't drive the stage from within

## 2026-07-18 - version 0.17.9

- work-portfolio deep links: `?feature=<slug>` selects that demo on load (unknown slugs just leave the intro up), and moving the selection writes the slug back with `replaceState` so the URL stays shareable without polluting history. Tests reset the jsdom URL between cases since the sync effect genuinely writes it

## 2026-07-18 - version 0.17.8

- work-portfolio keyboard navigation: ArrowLeft/ArrowRight cycle the selected feature through the same wraparound logic as the stage arrows. Keys are ignored while typing in a form control, inside contenteditable, or when focus sits inside an isolated keyboard scope (the marker the explainer window will use). Handler guards against window-targeted events, which have no DOM element API

## 2026-07-18 - version 0.17.7

- work-portfolio stage navigation: arrow buttons flank the stage and cycle the selected feature with wraparound. From the intro state, next lands on the first feature and prev on the last (`cycleIndex` helper, unit tested). The stage crossfades on selection change by remounting a keyed motion div, deliberately avoiding AnimatePresence exit-waits which stall under jsdom

## 2026-07-18 - version 0.17.6

- work-portfolio tickers are now interactive. Hover freezes the marquee (`animation-play-state`); on touch, the first touch freezes the strip for a few seconds so a tap can land. Chips are real buttons: clicking a feature selects it on the stage, clicking a project jumps to that project's first feature, and selection rings stay in sync across both tickers (`aria-pressed` carries the state). The marquee's clone copy is `inert` so its buttons can't be focused or clicked

## 2026-07-18 - version 0.17.5

- work-portfolio tickers now actually tick: the strip renders twice inside a track that slides one copy-width on a CSS keyframe loop, top ticker traveling left and bottom traveling right. The clone is aria-hidden so assistive tech only reads one set. `prefers-reduced-motion` swaps the marquee for a plain scrollable row with a single copy, driven by a small matchMedia hook (guarded for jsdom)

## 2026-07-18 - version 0.17.4

- work-portfolio tickers, static first pass: a reusable Ticker strip renders the 11 project chips along the top edge and the 24 feature chips (icon, title, project tag, project-accent dot) along the bottom. No animation yet, that lands next so each behavior stays independently testable. Route skeleton already matches the strip heights

## 2026-07-18 - version 0.17.3

- registered the work-portfolio feature in the hub FEATURES list so it shows up on the landing hub, with a test pinning the entry. Noted the new route in the architecture map

## 2026-07-18 - version 0.17.2

- started the work-portfolio feature: a single page at `/work-portfolio` that will demo features from 11 past projects as self-contained reconstructions. This commit lays the data spine: a typed catalog of 11 anonymized projects and 24 features (5 flagged as flagships), the route with metadata and a layout-matched loading skeleton, and an intro card as the stage's resting state
- everything in the catalog is deliberately anonymized (no employer or client names), enforced by a unit test that scans every work-portfolio source file for a banned-name list so a slip can't ship

## 2026-07-18 - version 0.17.1

- added the `/thoughts/bundlers` dev-notes page and registered it in the THOUGHTS hub. It writes up which bundler this project runs (Turbopack, the Next 16 default for dev and build; webpack only for `pnpm analyze` because the analyzer doesn't support Turbopack), whether it's the right call (yes, and the split setup is best-practice), and the real decision drivers behind when a lead reaches for a different bundler entirely — library output (Rollup/tsup), CLI speed (esbuild), webpack-config migration (Rspack), Module Federation (webpack/Rspack), the framework deciding for you (Vite), and zero-config spikes (Parcel)
- the through-line is the mental model: you don't pick a bundler in the abstract, the deliverable and the dominant constraint pick it. Ties back to the `@paul-portfolio/*` packages this site consumes as the concrete "now you'd use a library bundler" case. Summary and chat views, same pattern as the other thoughts pages

## 2026-07-18 - version 0.17.0

- added the `/thoughts/tree-shaking` dev-notes page and registered it in the THOUGHTS hub. It's the public write-up of this whole pass, and it leans into the reasoning rather than the diff: the three kinds of dead weight (shipped bundle vs. deploy weight vs. source hygiene) and why they pay off in different currencies, why removing an unused export is not a bundle win, the two findings that looked identical to their tools but needed opposite calls (`gltf-transform` kept, the v1 hero components deleted), and the blocking-vs-advisory trade-off behind putting the checks in CI. Summary and chat views, same pattern as the other thoughts pages
- rolled the tree-shaking work (0.16.7 through here) up into a minor version

## 2026-07-18 - version 0.16.14

- cleaned up the cascade left behind by removing the calendar read-side and the duplicate `FleetStats` in 0.16.11. Those functions were the last consumers of a few imports and schemas, which only showed up once the new CI checks and ESLint ran over the result — a nice demonstration that no single tool sees everything
- ESLint flagged the now-unused imports (`EventSearchFilters`, `eventsResponseSchema`, `cardsResponseSchema` in `lib/calendar.ts`, `fleetStatsSchema` in `types/operator.ts`) that `ts-prune` can't see because they're unused _imports_, not exports. Removed them
- removing those imports then orphaned two _exports_ — `cardsResponseSchema` (`lib/schemas.ts`) and the `EventSearchFilters` type (`types/calendar.ts`) — which the new blocking `deadexports` check caught. Removed those too. `eventsResponseSchema` and `fleetStatsSchema` survived because other code still uses them. tsc, lint, and dead-code checks all green

## 2026-07-18 - version 0.16.13

- wired the tree-shaking checks into CI so the cleanup doesn't rot. Added a blocking `Dead-code check` step to `.github/workflows/ci.yml` that runs `pnpm deadcheck` — `depcheck` for unused dependencies, then `ts-prune` for dead exports. Both fail the build on findings
- `depcheck` and `ts-prune` are now pinned devDeps (not `pnpm dlx`) so CI runs them from the frozen lockfile. Known false positives are curated in `.depcheckrc.json` (CLI-only tools, PostCSS plugins, CSS `@import` side-effects, the framework itself) and `.ts-prunerc.json` (App Router convention exports, config defaults, e2e setup, generated files, the `components/ui` barrel)
- `ts-prune`'s own `--error` flag counts `(used in module)` exports as findings, but those are used inside their own file and aren't dead. Added `scripts/check-dead-exports.mjs` to filter those out so only genuinely-unreferenced exports fail the build. Negative-tested it: an injected dead export fails with exit 1, a clean tree passes
- filed the guide that drove this pass under `plans/` (local planning docs, like `context/`) and added a "10. Automating this in CI" section covering what runs, the false-positive problem, and the blocking-vs-advisory trade-offs. The public write-up of all this is the new `/thoughts/tree-shaking` page
- documented both tools in `context/tech-stack.md`

## 2026-07-18 - version 0.16.12

- deleted the two orphaned v1-landing WebGL components `ShaderGradientScene.tsx` and `WaterRipple.tsx`. Nothing imported them — not even the retired v1 landing that `page.tsx` still keeps reachable through the version switch — so they were pure dead code left over from an earlier hero iteration. The ShaderGradient story is still told in `/thoughts/ui-redesign` and `/thoughts/landing-page`, so no history is lost
- dropped the `@shadergradient/react` dependency along with them. `ShaderGradientScene` was its only importer, so removing the component orphaned the whole WebGL package. This is the one change in the pass that actually trims the shipped bundle, not just source. Confirmed `waveSim.ts` stays (it's still shared with the live `WeatherCanvas`), and `tsc` is green

## 2026-07-18 - version 0.16.11

- removed a batch of dead exports that `ts-prune` flagged and I verified by hand (grepped the whole repo, including co-located tests, for each symbol — every one appeared only in its own definition file). Because these are unused _exports_ from modules that are otherwise imported, the bundler already tree-shakes them out, so this is source-hygiene, not a bundle-size win. `tsc` and all 626 tests stay green
- deleted two orphaned components: `PageIntro.tsx` and `PageLayout.tsx` (nothing rendered them)
- dropped unused animation variants `fadeIn` and `calendarSlide` from `lib/animations.ts`
- dropped the dead read-side of `lib/calendar.ts` (`fetchEvents`, `fetchEvent`, `searchEvents`, `fetchEventCards`, `eventsForHour`). The calendar feature fetches through other paths now; the write-side CRUD (`createEvent`/`updateEvent`/`deleteEvent`) is still live and untouched. The response schemas these used are shared with the API routes, so nothing cascaded
- dropped unused helpers `getPlayerTier` (`lib/fantasyHelpers.ts`) and `getAlert` (`lib/operator-data.ts`), plus dead type aliases `PokemonType`, `PokemonTypeName`, `GraphQLResponse`, `ESPNOwner`, `PlayerStatsMap`, and a duplicate `FleetStats` (the live one is the interface in `lib/operator-utils.ts`)
- left the two orphaned v1-landing WebGL components (`ShaderGradientScene`, `WaterRipple`) alone for now — they're unreachable but tangled up with the retired-version system, so they get their own decision

## 2026-07-18 - version 0.16.10

- moved the source `.glb` models out of `public/` and into a new `models-src/` directory. The eight raw models (256K) are the regeneration source for the landing 3D models, but nothing at runtime loads them — only the optimized copies in `public/models/` get served. Everything under `public/` ships with every deploy, so the raw sources were 256K of never-loaded weight riding along on each one. They stay in the repo (still version-controlled) but no longer ship
- kept the `@gltf-transform` toolchain. It first looked like an unused devDep (depcheck flags it), but it's the documented, manually-run asset-prep pipeline that strips Draco compression from GLBs for a real CSP reason — `depcheck` just can't see CLI-only usage. Added a `models-src/README.md` with the regenerate command and noted the source/output split in `context/architecture-map.md`

## 2026-07-18 - version 0.16.9

- deduped `.gitignore`: `.DS_Store` was listed twice (once under `# misc`, once under a separate `# macOS` block). Checked that no `.DS_Store` files are actually tracked (`git ls-files "*.DS_Store"` was empty), so nothing needed untracking — just collapsed the duplicate ignore rule down to the single `# misc` entry

## 2026-07-18 - version 0.16.8

- removed the five Next.js starter SVGs that came with `create-next-app` and were never used: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`. Grepped the whole app (src, e2e, context, README, CSS) for each filename first to confirm zero references. Everything in `public/` ships with every deploy whether or not anything points at it, so unreferenced starter assets are pure dead weight

## 2026-07-18 - version 0.16.7

- started a tree-shaking pass following `docs/tree-shaking-guide.md`. First up: dropped `autoprefixer`. Tailwind CSS v4 runs Lightning CSS internally, which already does vendor prefixing, so the separate autoprefixer pass in `postcss.config.mjs` was doing redundant work. Removed the plugin and the dependency, confirmed the production build still compiles CSS cleanly

## 2026-07-18 - version 0.16.6

- fixed Web Vitals recording every beacon's `app_version` as "unknown", which is why new app versions never appeared in the vitals dashboard (it stayed stuck on 0.15.x). The `/api/vitals` BFF route validates the beacon with `vitalsBeaconSchema` and forwards the parsed result, but the schema only declared `metric`, `value`, `rating`, and `page` — so Zod's default key-stripping dropped `nav_type` and `app_version` before they reached the backend. Added both fields to the schema. Regression from the API-hardening commit that introduced schema validation on this route
- audited every other `parseBody`-based route (all calendar + operator routes) for the same "schema strips a forwarded field" bug — they're safe because their client payloads are strongly typed (`Omit<CalendarEvent,"id">`, `Pick<Calendar,...>`) to match the schemas exactly, unlike the hand-built vitals beacon

## 2026-07-17 - version 0.16.5

- fixed poor FCP and CLS on the `/` route (guest landing). Real-user vitals for the current minor version (0.15.x) showed FCP p75 jump to ~2.6s and CLS reach ~0.2 on `/`, both regressions from the previous minor
- FCP: `LandingContentV2` was one big `"use client"` bundle that eagerly pulled framer-motion in through all four sections. Restored the eager-Hero + lazy-below-fold pattern the v1 landing already used, splitting `ProjectsSection`, `StatsStrip`, `ThoughtsPreview`, and `FooterSection` into async chunks via `next/dynamic` (`ssr: true`, so the streamed HTML and SEO are unchanged). Smaller initial chunk means first paint lands sooner
- CLS: the hero used `min-h-dvh`, which grows when the mobile URL bar hides on scroll and shifts every section below it. Switched to `min-h-svh` (stable smallest-viewport height) so the hero never resizes mid-scroll
- no change to markup, landmarks, or accessibility semantics on the landing

## 2026-07-17 - version 0.16.4

- fixed thoughts loading skeleton flashing the chat/phone layout before snapping to the Summary view — rebuilt `ThoughtsSkeleton` to mirror the Summary layout (sticky header, title block, stacked section shimmers) so the loading state matches what actually renders
- updated the Vitals CLS note that described the old chat-bubble skeleton

## 2026-07-17 - version 0.16.3

- expanded the API backend overhaul write-up with the full reasoning — per-phase "why it holds up" rationale, explicit "the pivot" callouts for every course change (response envelope shelved, legacy-JS restore, Swagger CSP), a collected pivots list, a system-design principles synthesis, and a frontend dev's framing throughout
- extended the chat view to match the expanded content

## 2026-07-17 - version 0.16.2

- added `/thoughts/api-backend-overhaul` dev-notes page walking through all twelve phases of the portfolio_api TypeScript overhaul — from the consumer-contract constraint through the three data-access patterns, middleware, caching, testing, pnpm, and the architecture audit
- registered the API backend overhaul entry in the THOUGHTS hub list (featureData)

## 2026-07-16 - version 0.16.1

- add dev thoughts page about pnpm switch

## 2026-07-16 - version 0.16.0

- linting with pnpm

## 2026-07-16 - version 0.16.0

- migrated package manager from npm to pnpm — content-addressable store, strict dependency resolution, faster installs
- added `packageManager` and `engines` fields to `package.json` for pnpm/node version enforcement
- replaced `package-lock.json` with `pnpm-lock.yaml`
- updated GitHub Actions CI to use `pnpm/action-setup` with `--frozen-lockfile` installs
- bumped dependency minimums exposed by pnpm's strict resolution: eslint `^9.39.5`, typescript `^5.5`, `@types/node` `^20.19`, `@playwright/test` `^1.61.1`, `@axe-core/playwright` `^4.12.1`
- fixed new `react-hooks/refs` lint errors in ParticleScene (moved ref writes into useEffect)
- suppressed intentional `react-hooks/set-state-in-effect` and `react-hooks/immutability` false positives
- added `package-lock.json` to `.gitignore` to prevent accidental npm usage
- updated README, next.config.ts, and docs to use pnpm commands
- added npm-to-pnpm dev thoughts page

## 2026-07-15 - version 0.15.35

- added AI Security & Bare Repo Attacks thoughts page — covers prompt injection via CLAUDE.md, hardened least-privilege agent configs, deny lists, PreToolUse boundary hooks, and sandboxed environments (frontend and backend) for untrusted code
- hardened `.claude/settings.local.json` — stripped auto-approved permissions from 143 to 23 (read-only only), added 20-rule deny list blocking destructive and privileged commands
- added PreToolUse hook in `.claude/settings.json` — blocks destructive shell patterns and prompts for confirmation on commands targeting paths outside the project directory
- added AI Security entry to thoughts index (featureData)
- re-order dev notes
- bumped version to 0.15.35

## 2026-07-15 - version 0.15.34

- (superseded by 0.15.35)

## 2026-07-15 - version 0.15.33

- fix: E2E globalSetup Auth0 login times out in CI — added `networkidle` wait for Auth0 SPA hydration, broadened email input selector for New Universal Login
- fix: globalSetup Auth0 failure blocks public E2E tests in CI — override credentials to empty for `--project=public` so public tests aren't gated on auth
- added failure screenshot capture in globalSetup for CI debugging (`auth-failure.png` uploaded as artifact)
- extracted `loginAndSetup` helper from globalSetup for cleaner error handling
- removed duplicate `storageState` call in globalSetup

## 2026-07-15 - version 0.15.32

- fix: calendar today circle `bg-red-500` fails WCAG AA contrast vs white (~3.1:1) — changed to `bg-red-600` (~4.6:1)
- fix: calendar out-of-month day numbers `text-muted/50` fails contrast — changed to `text-muted`
- fix: calendar "+N more" overflow text fails contrast on tinted backgrounds — changed to `text-foreground/80`
- fix: TCG browse axe `document-title` violation from React 19 hydration clearing `<title>` — added `networkidle` wait before title check
- fix: vitals a11y test navigated to removed `/protected/vitals` URL — updated to `/vitals`
- fix: vitals page 274 color-contrast violations — `text-green-600`/`text-yellow-600` → `-800` for WCAG AA on white/surface backgrounds
- fix: vitals VersionSelector `<select>` missing accessible name — added `aria-label`
- fix: calendar E2E used static event title causing parallel test interference — switched to `uniqueTitle()` for isolation
- fix: calendar UI test used optimistic temp UUID for delete — added page reload after POST to get server-assigned IDs
- fix: calendar API test missing required `color` field and wrong response shape (`{id}` vs `{event:{id}}`)
- fix: calendar E2E removed non-existent "Confirm" delete step (EventModal deletes directly)
- updated landing page stats: tests 108→640+, write-ups 17→25
- updated testing thoughts page counts (108→640+) and metadata
- added E2E Testing and NBA Playoffs Bracket to thoughts index (featureData)
- updated testing thought preview to mention Playwright and e2e count
- bumped version to 0.15.32

## 2026-07-15 - version 0.15.31

- (superseded by 0.15.32)

## 2026-07-15 - version 0.15.30

- fix: E2E globalSetup clicked "Continue with Google" instead of database login — tightened button regex to `/^continue$/i` and switched to a dedicated Auth0 database user
- fix: globalSetup parsed calendar POST response as `{ id }` but backend returns `{ calendar: { id } }` — calendar ID was `undefined`, silently breaking all CRUD tests
- fix: calendar day numbers used `opacity-25` failing WCAG AA contrast — switched to `text-muted/50`
- fix: calendar infinite scroll container not keyboard-accessible — added `tabIndex={0}`, `role="region"`, and `aria-label`
- fix: settings a11y test locator matched both `<main>` and `<h1>` — switched to `getByRole("heading")`
- fix: proxy.ts auth catch block silently swallowed errors — added error logging
- docs: updated E2E thoughts page with "what broke when we actually ran them" section
- bumped version to 0.15.30
- update CI to include secrets

## 2026-07-15 - version 0.15.29

- updated Design System imports for CSS fix for padding/spacing

## 2026-07-15 - version 0.15.28

- docs: expanded design system thoughts page with spacing token mismatch and modal focus bug — now 9 bugs documented with 10 takeaways
- bumped version to 0.15.28

## 2026-07-14 - version 0.15.27

- fix: modal inputs losing focus on every TanStack Query background refetch — the `useEffect` in Modal had `handleKeyDown` in its dependency array, which changed whenever the parent re-rendered (new `onClose` reference). Each re-run called `requestAnimationFrame(() => focusable[0].focus())`, stealing focus from the active input. Fixed by storing `handleKeyDown` in a ref so the effect only runs when `open` changes.
- bumped version to 0.15.27

## 2026-07-14 - version 0.15.26

- switched from individual component CSS imports to `@paul-portfolio/css/components.css` entry point — one import gets all design system component styles without the reset that conflicts with Tailwind
- added `@paul-portfolio/css` as an explicit dependency (was previously only transitive through the React package)
- updated design system thoughts page with the `components.css` entry point section and chat thread
- updated context docs (`ui-system.md`, `tech-stack.md`) to reflect design system package usage
- bumped version to 0.15.26

## 2026-07-14 - version 0.15.25

- docs: expanded design system thoughts page with Storybook CI and Chromatic lessons — monorepo source aliases, esbuild automatic JSX runtime, and portal component snapshot gotchas
- bumped version to 0.15.25

## 2026-07-13 - version 0.15.24

- fix: resolved circular `@theme` references in globals.css — Tailwind v4's `@theme` block creates new CSS custom properties, so `--color-X: var(--color-X)` was self-referencing and resolving to the guaranteed-invalid value. All Tailwind utilities for colors, shadows, and border radii were silently broken. Fixed by referencing `--paul-*` prefixed source tokens
- fix: removed `@paul-portfolio/css` import — the full CSS package brought in competing resets, base typography, heading sizes, and `@layer` declarations that conflicted with Tailwind v4, shifting spacing and layout. Only the tokens package is needed since React components handle their own CSS
- fix: restored distinct `--color-surface-raised` values (was incorrectly aliased to same value as `--color-surface`)
- docs: expanded design system thoughts page with circular reference and CSS layer conflict lessons
- bumped version to 0.15.24

## 2026-07-12 - version 0.15.20

- fix: `WebVitalsReporter` now skips registration on localhost and 127.0.0.1. Dev-mode pageviews were sending slow CWV metrics (unminified JS, turbopack overhead, devtools) to the backend, polluting the vitals dashboard with poor scores for the latest versions.
- fix: NavBar always renders `border-b` (transparent when not scrolled, `border-border` when scrolled). Previously the border was conditionally added on scroll, causing a 1px CLS.
- bumped version to 0.15.20

## 2026-07-12 - version 0.15.19

- added AI Agent Patterns to the Thoughts hub in `featureData.tsx` so it appears on the `/thoughts` page
- bumped version to 0.15.19

## 2026-07-12 - version 0.15.18

- added AI Agent Patterns to README.md features list and Learn section description (updated topic count from 13 to 14)
- bumped version to 0.15.18

## 2026-07-12 - version 0.15.17

- fix: allow starting a new agent run from terminal states (completed, error, cancelled). Previously the START action only worked from idle, so after a run finished the demo was stuck until a page refresh. The reducer now only blocks START during running or awaiting_approval.
- fix: switching scenarios now clears previous output. Added RESET action to the reducer and `reset()` to `useAgentRun`. Scenario selector calls reset on change, returning state to idle so the demo area shows the placeholder instead of stale results.
- bumped version to 0.15.17

## 2026-07-12 - version 0.15.16

- `context/architecture-map.md` — added `/learn/ai-agent-patterns` and `/thoughts/ai-agent-patterns` routes, `useStreamingText`/`useAutoScroll`/`useAgentRun` hooks, `src/lib/agent/` modules, and `src/components/agent/` component section.
- `context/INDEX.md` — added AI Agent Patterns to the features table.
- bumped version to 0.15.16

## 2026-07-12 - version 0.15.15

- `src/app/thoughts/ai-agent-patterns/page.tsx` — server component with metadata, OG tags, `revalidate = 86400`, renders AgentPatternsContent.
- `src/app/thoughts/ai-agent-patterns/AgentPatternsContent.tsx` — dev thoughts page with summary/chat view toggle. Summary view covers 10 sections: SSE vs WebSockets vs polling, SSE wire format, fetch + ReadableStream, state machines over booleans, streaming markdown, auto-scroll UX, error taxonomy, performance at 50 tokens/sec, anti-patterns, and testing streaming UI. Chat view is an iMessage-style conversation covering the same topics using Sent/Received/Timestamp components.
- bumped version to 0.15.15

## 2026-07-12 - version 0.15.14

- `src/app/learn/ai-agent-patterns/page.tsx` — server component with metadata, OG tags, and dynamic import of AgentPatternsContent.
- `src/app/learn/ai-agent-patterns/AgentPatternsContent.tsx` — interactive feature page demoing all agent UI patterns. Scenario selector (5 scenarios as pill buttons), live demo area with AgentTimeline + StopButton + auto-scroll, status indicators for each run state, and 8 explanatory sections covering SSE parsing, state machines, streaming text, tool calls, approval gates, auto-scroll, error handling, and anti-patterns.
- `src/app/learn/LearnHub.tsx` — added "AI Agent Patterns" topic (category: Frontend Patterns, difficulty: 3) with AgentPatternsMark SVG icon.
- bumped version to 0.15.14

## 2026-07-12 - version 0.15.13

- `src/components/agent/AgentTimeline.tsx` — vertical timeline rendering a sequence of `AgentStep[]`. Maps each step kind to its component: thinking (pulsing dot + italic text), text (StreamingMarkdown), tool_call (ToolCallCard), approval_request (ApprovalGate), error (red-tinted banner). Uses `staggerContainer` and `fadeInUp` from `@/lib/animations` for entrance animations.
- `src/components/agent/StopButton.tsx` — cancel button for in-progress agent runs. Uses `Button` with `variant="danger"` and `size="sm"`, square stop icon, `aria-label="Stop generation"`.
- `src/components/agent/AgentTimeline.test.tsx` — 8 tests covering empty steps, thinking/text/tool_call/approval_request/error step rendering, multiple steps in order, and axe accessibility scan with mixed step types.
- `src/components/agent/StopButton.test.tsx` — 4 tests covering button text, onStop callback, aria-label, and axe scan.
- bumped version to 0.15.13

## 2026-07-12 - version 0.15.12

- `src/components/agent/ApprovalGate.tsx` — human-in-the-loop approval gate component. Displays action name and description with Approve (primary) and Deny (outline) buttons when pending, or a status label when resolved. Uses `role="alertdialog"` with `aria-labelledby`/`aria-describedby` via `useId()`. Framer Motion `scaleIn` entrance animation. Warning-style left-border card styling.
- `src/components/agent/ApprovalGate.test.tsx` — 12 tests covering action name/description rendering, Approve/Deny button clicks firing callbacks, `role="alertdialog"` with proper ARIA ID references, keyboard accessibility, approved/denied status labels replacing buttons, and axe accessibility scan.
- bumped version to 0.15.12

## 2026-07-12 - version 0.15.11

- `src/components/agent/StreamingMarkdown.tsx` — lightweight markdown renderer for mid-stream content. Hand-rolled parser handles paragraphs, code fences (auto-closes unclosed fences during streaming), inline code, bold, italic, and bullet lists. Wrapped in `React.memo` for memoization. No external markdown dependencies.
- `src/components/agent/StreamingMarkdown.test.tsx` — 10 tests covering plain text paragraphs, bold/italic/inline code rendering, complete code fences, unclosed code fence auto-close during streaming, multiple paragraphs, bullet lists, memoization, and axe accessibility scan.
- bumped version to 0.15.11

## 2026-07-12 - version 0.15.10

- `src/components/agent/ToolCallCard.tsx` — expandable tool call card component. Displays tool name with animated status indicator (spinner for running, checkmark for done, x for error). Clicking the header toggles an expand/collapse panel (Framer Motion `AnimatePresence`) showing formatted input JSON and result or error message. `aria-expanded` tracks state, keyboard accessible via native button element. Props: `step: ToolCallStep`, `defaultExpanded?: boolean`.
- `src/components/agent/ToolCallCard.test.tsx` — 13 tests covering tool name rendering, three status indicators, click toggle, formatted JSON display, result text, error message with `data-error` styling, `aria-expanded` attribute, keyboard Enter/Space toggle, and axe accessibility scans for all three status states.
- bumped version to 0.15.10

## 2026-07-12 - version 0.15.9

- `src/hooks/useAgentRun.ts` — orchestrator hook wiring together `agentReducer`, `createMockStream`, `createSSEParser`, and `AbortController`. Parses SSE events from the mock stream and dispatches reducer actions (text_delta→APPEND_TEXT, thinking→APPEND_THINKING, tool_use_start→ADD_TOOL_CALL, tool_result→COMPLETE_TOOL_CALL, approval_request→REQUEST_APPROVAL, done→COMPLETE, error→ERROR). Returns `{ state, start, stop, approve, deny }` with abort support and approval flow resume.
- `src/hooks/useAgentRun.test.ts` — 9 tests covering initial idle state, start transitions to running, simple scenario completion with thinking+text steps, stop preserves partial steps, approval flow (awaiting_approval→approve→completed, deny→completed with denied status), error_recovery scenario, and no-op on duplicate start.
- bumped version to 0.15.9

## 2026-07-12 - version 0.15.8

- `src/hooks/useAutoScroll.ts` — React hook that tracks whether a scrollable container is near the bottom and provides a `scrollToBottom()` function with smooth scrolling. Attaches a passive scroll listener to avoid blocking the main thread. Returns `{ containerRef, isAtBottom, scrollToBottom }` with configurable threshold (default 100px).
- `src/hooks/useAutoScroll.test.ts` — 5 tests covering initial state (isAtBottom true), scrollToBottom calling `scrollTo`, isAtBottom true within threshold, isAtBottom false beyond threshold, and passive scroll listener verification.
- bumped version to 0.15.8

## 2026-07-12 - version 0.15.7

- `src/hooks/useStreamingText.ts` — React hook for streaming text accumulation with batched DOM updates. Consumes a `ReadableStream<string>` of SSE-formatted chunks, parses with `createSSEParser`, accumulates `text_delta` content in a ref buffer, and flushes to state via `requestAnimationFrame` batching to prevent per-token re-renders. Returns `{ text, isStreaming, start(stream), reset() }` with cleanup on unmount.
- `src/hooks/useStreamingText.test.ts` — 7 tests covering initial state, streaming start, text accumulation from text_delta events, stream end preserving text, reset clearing state, unmount cleanup, and ignoring non-text_delta events. Uses `renderHook` + `act()` with fake timers and a controllable `createTestStream()` helper.
- bumped version to 0.15.7

## 2026-07-11 - version 0.15.6

- `src/lib/agent/mock-stream.ts` — mock AI agent streaming service with five demo scenarios (simple, tool_calls, thinking, approval, error_recovery). `createMockStream(scenario)` returns a `ReadableStream<string>` producing SSE-formatted chunks on timers with a `resume()` function for the approval scenario's pause/resume flow. Exports `SCENARIOS` metadata array for the UI picker.
- `src/lib/agent/mock-stream.test.ts` — 7 tests covering event sequence for all 5 scenarios, stream cancellation, and SCENARIOS metadata validation. Uses `vi.useFakeTimers()` for deterministic timing.
- bumped version to 0.15.6

## 2026-07-11 - version 0.15.5

- `src/lib/agent/agent-state.ts` — agent run state machine reducer with discriminated union states (idle, running, awaiting_approval, completed, error, cancelled). Pure function, no React dependency. Handles 10 action types: START, APPEND_TEXT, APPEND_THINKING, ADD_TOOL_CALL, COMPLETE_TOOL_CALL, REQUEST_APPROVAL, RESOLVE_APPROVAL, COMPLETE, ERROR, CANCEL. Invalid transitions return state unchanged. All transitions produce new objects (immutable).
- `src/lib/agent/agent-state.test.ts` — 28 tests covering every state transition, content appending, tool call lifecycle, approval flow (approve resumes, deny completes), invalid action guards, and immutability via Object.freeze.
- bumped version to 0.15.5

## 2026-07-11 - version 0.15.4

- `src/lib/agent/sse-parser.ts` — SSE wire format parser with chunked boundary handling. `createSSEParser()` returns a stateful `{ feed(chunk): SSEEvent[] }` that handles split chunks, multi-line data fields, event/id/retry fields, and comment lines. Pure function, no React or DOM dependencies.
- `src/lib/agent/sse-parser.test.ts` — 12 tests covering single events, event type parsing, multi-line data, id/retry fields, comments, multiple events per chunk, split-across-chunk boundaries, incomplete chunks, [DONE] sentinel, empty data, and event type reset between events.
- bumped version to 0.15.4

## 2026-07-11 - version 0.15.3

- `src/lib/agent/types.ts` — type definitions for the AI agent UI feature: `SSEEvent` (parsed SSE frame), `AgentStep` discriminated union (thinking, text, tool_call, approval_request, error), `AgentRunState` state machine (idle, running, awaiting_approval, completed, error, cancelled), `AgentRunAction` reducer actions, `Scenario` and `ScenarioMeta` for demo scenarios. Pure types, no runtime code.
- bumped version to 0.15.3

## 2026-07-10 - version 0.15.2

- Fixed all 14 ESLint issues (2 errors, 12 warnings) that were failing CI:
  - Added `@typescript-eslint/no-unused-vars` config with `argsIgnorePattern`, `varsIgnorePattern`, and `ignoreRestSiblings` for standard `_`-prefix convention
  - Fixed `jsx-a11y/no-noninteractive-tabindex` on scrollable stats table in NbaSection (added `role="region"` + `aria-label`)
  - Fixed `jsx-a11y/no-static-element-interactions` on Tooltip wrapper span
  - Added missing `meQuery.data?.name` dependency to auto-save useEffect in PlayoffBracketContent
  - Suppressed `@next/next/no-img-element` for small decorative team logos in FinalsCard and SeriesPickCard
  - Removed unused imports (`beforeEach`, `vi`) in proxy.test.ts and unused `STATUSES`/`StoreStatus` in operator factory
- bumped version to 0.15.2

## 2026-07-10 - version 0.15.1

- Project-wide WCAG 2.1 AA accessibility audit and remediation across all features:
  - **Operator pages**: added ARIA roles and labels to ToastNotification (`aria-live`), Bone (`aria-hidden`), RefreshBar (`role="status"`), StockBar (`role="meter"`), AlertTrendChart/FleetHealthChart/InventoryComparisonChart (`role="img"` with text alternatives)
  - **Calendar**: full combobox rewrite for CardSearch (keyboard navigation, `aria-activedescendant`, live region for result count), radiogroup patterns for CalendarModal sync/role toggles, tablist for CountdownModal entry type toggle, keyboard-accessible time slots in DayView and WeekView (`role="button"`, Enter/Space handling), event delegation pattern for CalendarGrid day cells
  - **PageHeader**: semantic breadcrumb navigation with `<ol>`/`<li>`, `aria-current="page"`, `aria-label="Breadcrumb"`
  - **Fantasy**: fixed label-control association in PlayerCompare with `htmlFor`/`id` pairs
  - **Learn**: added ARIA roles and keyboard handlers to EventDelegationContent interactive containers
  - **Loading states**: added `aria-busy`/`aria-label` to operator, store detail, and vitals loading pages
- Fixed color contrast violations across 40+ files: replaced `text-muted/30`, `text-muted/40`, `text-muted/60` opacity modifiers with `text-muted` to meet WCAG AA 4.5:1 minimum ratio
- Added visually-hidden `<h1>` headings (`sr-only`) to 14 pages missing level-one headings
- Added `eslint-plugin-jsx-a11y` recommended rules to ESLint config for lint-time a11y enforcement
- New test suites:
  - `src/__tests__/operator/a11y.test.tsx` — 16 axe scan and semantic assertion tests for operator components
  - `src/__tests__/calendar/a11y.test.tsx` — 13 axe scan, keyboard accessibility, and ARIA assertion tests for calendar components (CountdownModal, CardSearch, DayView, WeekView, CalendarGrid)
- Updated accessibility dev thoughts page with comprehensive WCAG masterclass content, three-layer defense strategy, and tooling documentation
- All 506 tests passing, zero lint errors
- bumped version to 0.15.1

## 2026-07-09 - version 0.15.0

- Added WCAG primer and learning path to the `/thoughts/accessibility` dev notes page:
  - "WCAG for the uninitiated" section: POUR principles, conformance levels (A/AA/AAA), success criterion numbering system
  - "Getting up to speed" section: keyboard-first testing, axe browser extension, semantic HTML before ARIA, WAI-ARIA Authoring Practices, recommended courses, the dozen criteria that cover most day-to-day work
  - Matching chat-view messages for both new sections
- bumped version to 0.14.13

## 2026-07-09 - version 0.14.12

- Added accessibility testing patterns and PR review checklist to the `/thoughts/accessibility` dev notes page:
  - Color contrast section covering SC 1.4.3/1.4.11 findings and design token approach
  - Testing patterns for new components: three-layer pattern (axe scans, label/ARIA assertions, keyboard behavior) with WCAG criteria numbers
  - 11-item PR review checklist for UI changes
  - Matching chat-view messages for all new sections
- bumped version to 0.14.12

## 2026-07-09 - version 0.14.11

- Fixed 6 WCAG AA color contrast failures across light and dark themes:
  - `text-error-600` on dark surfaces (3.71:1) — added `dark:text-error-500` for 4.76:1 ratio
  - `text-success-600` on light backgrounds (3.30:1) — bumped to `text-success-700` for 5.02:1
  - `text-warning-600` on light backgrounds (3.19:1) — bumped to `text-warning-700` for 5.02:1
  - danger button `text-red-500` (3.76:1) — bumped to `text-red-600` for 4.83:1
  - `text-muted/50` on both themes (1.96:1 / 2.70:1) — replaced with full `text-muted` across 41 files
- Updated Input, Textarea, Button, SeverityBadge, InventoryRow, FleetStatsBar, PlanogramSlot, SensorOfflineCallout, ConnectionQuality, StoreCard, PlanogramTab, and all thoughts/calendar/fantasy pages
- bumped version to 0.14.11

## 2026-07-09 - version 0.14.10

- `e2e/public/landmarks.spec.ts` — 5 E2E tests verifying skip-to-content link (exists, visually hidden until focused, targets `#main-content`), navigation landmark, and main landmark on the landing page
- `LandingContentV2.tsx` — wrapped page sections in `<main>` element so the v2 landing page has a proper main landmark. Footer stays outside `<main>` as expected
- bumped version to 0.14.10

## 2026-07-09 - version 0.14.9

- `e2e/authenticated/a11y.spec.ts` — axe accessibility scans for calendar, vitals, and settings pages behind auth. Self-skips when `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` are not set so CI without credentials stays green
- `package.json` — added `test:e2e:auth` script (`playwright test --project=authenticated`) for running authenticated E2E tests locally
- **Known gap**: CI only runs `--project=public`. Authenticated axe scans require real Auth0 credentials and run locally via `npm run test:e2e:auth`
- bumped version to 0.14.9

## 2026-07-09 - version 0.14.8

- verified all 477 tests (45 files) pass via `npm test`, including all new axe-based a11y tests. No jsdom or CI config changes needed — vitest-axe runs in the existing jsdom environment without additional setup
- bumped version to 0.14.8

## 2026-07-09 - version 0.14.7

- `Chip.tsx` — added `onRemove` prop: renders a remove button with accessible name (`Remove ${label}`) and an x icon. Static, clickable, and removable chips all pass axe scans
- `Chip.test.tsx` — 5 tests: axe scans for static/clickable/removable variants, remove button has accessible name including chip label, onRemove fires on click
- bumped version to 0.14.7

## 2026-07-09 - version 0.14.6

- `Modal.tsx` — mark sibling DOM content with `aria-hidden="true"` when modal is open so screen readers ignore the background. Cleaned up on close
- `Modal.test.tsx` — 6 tests: axe scan, role/aria-modal attributes, focus moves to first focusable on open, Tab cycles within focus trap, Escape closes, background marked inert
- `Tooltip.tsx` — added `onFocus`/`onBlur` handlers so tooltip shows on keyboard focus (not just hover). Added Escape dismiss and `aria-describedby` linking tooltip content to trigger via generated ID
- `Tooltip.test.tsx` — 5 tests: axe scan, shows on focus, hides on blur, Escape dismiss, aria-describedby linking
- `InfoTip.tsx` — changed root element from `<span>` to `<button>` for proper button role. Added `onFocus`/`onBlur`, Escape dismiss, `aria-describedby`, configurable `delay` prop
- `InfoTip.test.tsx` — 5 tests: axe scan, trigger has accessible name, shows on keyboard focus, aria-describedby linking, Escape dismiss
- bumped version to 0.14.6

## 2026-07-09 - version 0.14.5

- `Textarea.tsx` — added character count display when `maxLength` is set, with `aria-live="polite"` so screen readers announce changes. Count is linked to the textarea via `aria-describedby`
- `Textarea.test.tsx` — 9 tests: axe scans (visible label, hidden label, error state), label association, aria-invalid on error, aria-describedby for errors, character count display, count updates on typing, aria-live on count element
- bumped version to 0.14.5

## 2026-07-09 - version 0.14.4

- `Input.test.tsx` — 9 tests: axe scans (visible label, hidden label, error state), label association via htmlFor/id, aria-invalid on error, aria-describedby linking error messages and helper text. Confirms existing implementation covers WCAG label and error announcement requirements
- bumped version to 0.14.4

## 2026-07-09 - version 0.14.3

- `IconButton.test.tsx` — 4 tests: axe violation on empty aria-label (button-name rule), no violations with descriptive label, aria-label renders on the button element, focus-visible outline classes. Confirms existing required `aria-label` prop covers the accessible name requirement
- bumped version to 0.14.3

## 2026-07-09 - version 0.14.2

- `Button.tsx` — replaced native `disabled` attribute with `aria-disabled` so disabled buttons remain focusable for screen reader discovery. Click prevention via guard on `onClick` instead of native disabled. Swapped `disabled:` Tailwind prefix classes for direct `pointer-events-none opacity-50` applied conditionally
- `Button.test.tsx` — 11 tests: axe scan for all 5 variants (primary, secondary, outline, ghost, danger), loading state, disabled state, focusability when disabled, no native disabled attr, click prevention when disabled, focus-visible ring classes
- bumped version to 0.14.2

## 2026-07-09 - version 0.14.1

- added `vitest-axe` for unit-level WCAG 2.1 AA accessibility scans alongside the existing Playwright axe E2E layer
- `src/test/a11y.ts` — pre-configured axe instance scoped to wcag2a, wcag2aa, wcag21a, wcag21aa tags. Render a component, pass the container, assert `toHaveNoViolations()`
- `src/test/setup.ts` — wired up vitest-axe matchers globally via `expect.extend()`
- `src/test/a11y.test.ts` — two smoke tests: accessible markup passes, inaccessible markup (img without alt) is caught
- `/thoughts/accessibility` — new thoughts page covering the approach: two-layer axe scanning, primitive component audit strategy, what axe catches vs. behavioral tests, 3D page accessibility, CI story
- bumped version to 0.14.1

## 2026-07-07 - version 0.14.0

- bumped to 0.14.0 for v2 redesign milestone
- README.md — added V2 Redesign section: versioning scheme (`?version=v1`), Adam Hartwig design inspiration, what changed (editorial layout replacing 3D hero), bundle impact (zero WebGL bytes on default path)
- `/thoughts/ui-redesign` — added V2 redesign section documenting: editorial layout direction, what was removed (WeatherCanvas, ShaderGradient, Three.js globe), what was added (CSS gradient, scroll animations, project showcase), versioning approach, bundle impact. Added corresponding chat view messages

## 2026-07-07 - version 0.13.15

- page.tsx — refactored version routing from if/else branching to a `VERSIONS` registry pattern. Each version maps to a `{ Landing, Hub }` component pair. `CURRENT_VERSION` constant controls the default. `resolveVersion()` validates the URL param against the registry. Adding a future version (v3, etc.) is a single entry in the registry with no branching logic to update
- single rendering path: determines content from `VERSIONS[version]`, conditionally wraps with `VersionBanner` for old versions. `satisfies` constraint ensures every version entry matches the expected component types
- updated V2 Redesign thoughts page with version registry section
- bumped version to 0.13.15

## 2026-07-07 - version 0.13.14

- VersionBanner.tsx — fixed-position amber banner at `src/app/v2/VersionBanner.tsx` shown when `?version=v1` is active: "You're viewing v1 — switch to current ↗" with link to `/` (no version param). `bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300`, z-50 above nav
- page.tsx — renders VersionBanner above v1 components when `isV1`, wraps v1 content in `pt-8` div to account for banner height. v2 path unchanged
- updated V2 Redesign thoughts page with VersionBanner section
- bumped version to 0.13.14

## 2026-07-07 - version 0.13.13

- v2 quality gate — verified all 7 checklist items:
  - **Reduced motion**: every Framer Motion animation in v2 has `useReducedMotion()` guard — HeroSection, ProjectCard, ThoughtsPreview collapse delays to 0 and use `instantTransition`; StatsStrip count-up hook shows final values immediately; scroll indicator bob disabled
  - **TypeScript**: `npm run build` passes with zero errors
  - **Bundle splitting**: zero 3D imports (`three`, `@react-three/*`, `shader-gradient`) in `src/app/v2/`; 19/124 client chunks contain 3D deps, all lazy-loaded via `next/dynamic` and only fetched on `?version=v1`
  - **Hydration**: HeroSection and StatsStrip use `useSyncExternalStore` mounted flag — SSR renders final visible state, animation only after hydration. ProjectCard and ThoughtsPreview use `whileInView` (below-fold, no mismatch risk)
  - **LCP**: hero H1 renders with `initial={false}` on SSR so text is visible in initial paint
  - **CLS**: HeroSection reserves `min-h-dvh`, ProjectCard preview reserves `min-h-[200px]`, all other sections use padding-based height
  - **Tests**: 421 tests passing across 36 files, no regressions
- updated V2 Redesign thoughts page with quality gate section
- bumped version to 0.13.13

## 2026-07-07 - version 0.13.12

- dark mode and responsive audit — verified all v2 components use design token classes (`text-foreground`, `text-muted`, `bg-background`, `bg-surface`, `border-border`) with no hardcoded colors. Responsive breakpoints confirmed: hero text scales (`text-5xl`/`6xl`/`7xl`), project cards stack on mobile (`flex-col sm:flex-row`), stats grid goes 2x2 (`grid-cols-2 sm:grid-cols-4`), thoughts grid goes single column (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), footer stacks (`flex-col sm:flex-row`). Ambient gradient has explicit dark variant in `hero.module.css`. Nav blur uses token-based `bg-background/80`
- HeroSection.tsx — removed year from badge pill ("Full-Stack Engineer · 2026" → "Full-Stack Engineer")
- updated V2 Redesign thoughts page with audit section
- bumped version to 0.13.12

## 2026-07-07 - version 0.13.11

- Settings icon button on Feature hub only redirected to Settings page. Lost the Settings menu
- made sure settings menu shows link to Settings Page
- bumped version to 0.13.11

## 2026-07-07 - version 0.13.10

- FeatureHubV2.tsx — replaced placeholder with full authenticated hub: NavBar (authenticated), hero header with personalized greeting and inline stats, category filter tabs (All/NBA/Pokemon/Calendar/Engineering/Labs) with pill-shaped buttons and horizontal scroll on mobile, filtered FeatureCard grid with stagger animation, and ThoughtCard dev notes section with scroll-triggered reveal
- page.tsx — updated to pass `initialMe` prop to FeatureHubV2 so user name renders on first paint without a client-side fetch
- updated V2 Redesign thoughts page with FeatureHubV2 section
- bumped version to 0.13.10

## 2026-07-07 - version 0.13.9

- LandingContentV2.tsx — replaced placeholder with full composition of all v2 landing sections: NavBar (unauthenticated), HeroSection, ProjectsSection, StatsStrip, ThoughtsPreview, FooterSection. Wrapped in `scroll-smooth bg-background` div for smooth anchor scrolling across the whole page
- updated V2 Redesign thoughts page with landing composition section
- bumped version to 0.13.9

## 2026-07-07 - version 0.13.8

- FooterSection.tsx — minimal server component footer at `src/app/v2/landing/FooterSection.tsx` with "paul-explore" wordmark, copyright year, and links to GitHub (external), Thoughts, and "View v1 →" (`?version=v1`). `border-t border-border`, stacks vertically on mobile, row on desktop. No animations, dark mode aware
- updated V2 Redesign thoughts page with FooterSection section
- bumped version to 0.13.8

## 2026-07-07 - version 0.13.7

- ThoughtsPreview.tsx — curated dev thoughts grid at `src/app/v2/landing/ThoughtsPreview.tsx` showing all write-ups from the shared THOUGHTS array in a responsive grid (1-col mobile, 2-col tablet, 3-col desktop). Each card has a colored left accent border, title, preview text, and hover shadow. Section heading "How it's built" with subtitle, centered. Framer Motion staggered fade-up on scroll (50ms stagger, `whileInView`, `once: true`), guarded by `useReducedMotion()`
- updated V2 Redesign thoughts page with ThoughtsPreview section
- bumped version to 0.13.7

## 2026-07-07 - version 0.13.6

- StatsStrip.tsx — full-bleed evidence strip at `src/app/v2/landing/StatsStrip.tsx` with 4 key stats (14 features, 108+ tests, 17 write-ups, 5 CWV metrics tracked) in a 2x2 mobile / single-row desktop grid. Count-up animation on scroll intersection via `useCountUp` + Framer Motion `useInView`. `useSyncExternalStore` mounted flag renders final values during SSR for hydration safety. `bg-surface` background band with `border-y border-border`
- useCountUp.ts — added optional `inView` parameter (defaults to `true` for backward compat) and `hasAnimated` ref so animation only fires once when the element scrolls into view
- updated V2 Redesign thoughts page with StatsStrip section
- bumped version to 0.13.6

## 2026-07-07 - version 0.13.5

- ProjectsSection.tsx — main showcase section at `src/app/v2/landing/ProjectsSection.tsx` that renders all 14 features as ProjectCard components, grouped by category (Fantasy & NBA, Pokemon, Productivity, Engineering, Labs & Learning, Social) with sticky category labels and thin horizontal rules. Cards alternate `reversed` prop for zig-zag layout. Section has `id="projects"` as the hero scroll CTA target
- updated V2 Redesign thoughts page with ProjectsSection section
- bumped version to 0.13.5

## 2026-07-07 - version 0.13.4

- featureData.tsx — extracted FEATURES, THOUGHTS, PREVIEW_MAP, FEATURE_TOKEN, all 14 mini-preview components (NBAPreview, MatchupsPreview, etc.), all static preview data arrays, and FeatureCard/ThoughtCard presentational components into `src/app/_shared/featureData.tsx` so both v1 FeatureHub and v2 can share them
- FeatureHub.tsx — imports all data and sub-components from `@/app/_shared/featureData` instead of defining inline; default export and internal logic unchanged
- updated V2 Redesign thoughts page with shared data extraction section
- bumped version to 0.13.4

## 2026-07-07 - version 0.13.3

- ProjectCard.tsx — reusable project showcase card at `src/app/v2/landing/ProjectCard.tsx` with two-column layout (60% preview / 40% text, reversible), color-tinted preview area, category dot, title, description, "View project →" and optional "Read about it →" links. Framer Motion scroll-triggered `whileInView` entrance with stagger delay, hover lift. `useReducedMotion()` guard
- updated V2 Redesign thoughts page with ProjectCard section
- bumped version to 0.13.3

## 2026-07-07 - version 0.13.2

- HeroSection.tsx — v2 hero at `src/app/v2/landing/HeroSection.tsx` with CSS-only ambient gradient background (violet/blue tints, 20s drift animation, dark/light aware), staggered word-reveal H1 using `fadeInUp` + `spring.wordReveal`, badge pill, subtitle, scroll-to CTA, and bobbing scroll indicator line. Uses `useSyncExternalStore` mounted flag for LCP safety and `useReducedMotion()` guard
- hero.module.css — CSS module for the ambient gradient with `background-size: 400% 400%` drift keyframes
- updated V2 Redesign thoughts page with HeroSection section
- bumped version to 0.13.2

## 2026-07-07 - version 0.13.1

- NavBar.tsx — fixed top nav at `src/app/v2/landing/NavBar.tsx` with wordmark left, auth-aware right side (Log in link for guests, settings gear for authenticated users), transparent-to-frosted scroll transition at 50px
- updated V2 Redesign thoughts page with NavBar section
- bumped version to 0.13.1

## 2026-07-07 - version 0.13.0

- page.tsx — added URL parameter-based version routing (`?version=v1` serves original, default serves v2) with `searchParams.version` from Next.js App Router page props
- v1 components (LandingContent, FeatureHub) wrapped in `next/dynamic` so Three.js / R3F / ShaderGradient chunks only load on the v1 path
- v2 placeholder components at `src/app/v2/LandingContentV2.tsx` and `src/app/v2/FeatureHubV2.tsx` — statically imported, no 3D deps
- added V2 Redesign thoughts page at `/thoughts/v2-redesign`
- bumped version to 0.13.0

## 2026-07-07 - version 0.12.16

- VersionSelector.tsx — rewrote version dropdown with grouped options: Current Major (default, all data in the major version), Current Minor (all patches in latest minor), last 3 minor versions with individual patch versions in optgroups, and older minors aggregated as single entries
- page.tsx — updated version filtering to support mode-based URL params (`major:0`, `minor:0.12`, or exact `0.11.3`); fetchVitals and fetchByVersion now forward `mode` param to the backend
- updated Web Vitals thoughts page with version selector grouping section
- bumped version to 0.12.16

## 2026-07-07 - version 0.12.15

- HeroSection.tsx — extracted 3 theme-dependent inline style objects to module-level constants (dark/light variants for vignette, h1 text-shadow, subtitle text-shadow) to avoid recreating objects on every render for Framer Motion diffing
- 9 learn pages (15 intervals) — added `document.hidden` guard to all `setInterval` play callbacks so auto-step animations pause when the tab is hidden
- updated Render Performance thoughts page with both sections
- bumped version to 0.12.15

## 2026-07-07 - version 0.12.14

- useOperatorStores, useOperatorAlerts, useOperatorInventory, useOperatorActivity — replaced inline `data ?? []` fallbacks with module-level typed `EMPTY` constants to prevent new array reference on every render during loading phase
- updated Render Performance thoughts page with empty array reference stability section
- bumped version to 0.12.14

## 2026-07-07 - version 0.12.13

- ModelLazyMount.tsx — converted from one-shot lazy mount to bidirectional observer: unmounts WebGL canvases when they scroll 1000px+ offscreen, remounts when they approach again. Keeps active WebGL context count low to avoid context eviction flicker on mobile (browsers limit to ~4-8 contexts)
- updated Render Performance thoughts page with WebGL context lifecycle section
- bumped version to 0.12.13

## 2026-07-07 - version 0.12.12

- FeaturesSection.tsx — extracted whileHover object literal to module-level `HOVER_ANIMATION` constant (11 FeatureCard instances were each creating new objects + spreading spring.snappy on every render)
- updated Render Performance thoughts page with whileHover section
- bumped version to 0.12.12

## 2026-07-04 - version 0.12.11

- StoreCard.tsx — wrapped in React.memo (re-renders on every 30s poll cycle)
- CardTile in BrowseContent.tsx — wrapped in React.memo (20+ instances per page)
- PokemonCard.tsx — wrapped in React.memo (rendered in GraphQL grid)
- package.json — bumped to 0.12.11

## 2026-07-04 - version 0.12.10

- code-split all 13 learn page routes using `next/dynamic`: async-patterns, binary-search, debounce-throttle, dynamic-programming, event-delegation, from-scratch, hash-maps, memoization, recursion-backtracking, sliding-window, stacks-queues, trees-graphs, two-pointers -- each page now lazy-loads its content component so the router only ships lightweight server-rendered shells until the user navigates to a topic (`ssr: false` removed since page.tsx files are Server Components that export metadata)
- updated Render Performance thoughts page with learn pages code splitting section
- bumped version to 0.12.10

## 2026-07-04 - version 0.12.9

- fixed loading state flicker across 7 hooks (useOperatorStores, useOperatorAlerts, useOperatorInventory, useOperatorStore, useOperatorActivity, useCalendarEvents, useCountdowns): changed `loading` from `isLoading || isFetching` to just `isLoading` so skeletons only show on initial load, not on every background poll cycle; `RefreshBar` already handles the subtle "updating" indicator via `isFetching`
- updated Render Performance thoughts page with loading flicker section
- bumped version to 0.12.9

## 2026-07-04 - version 0.12.8

- added `refetchIntervalInBackground: false` to all four operator polling queries (useOperatorStores 30s, useOperatorAlerts 15s, useOperatorInventory 60s, OperatorDashboard fleet-summary 15s) so TanStack Query pauses polling when the tab is hidden; combined with existing `refetchOnWindowFocus: true`, dashboard refreshes immediately on tab return
- updated Render Performance thoughts page with background polling section
- bumped version to 0.12.8

## 2026-07-04 - version 0.12.7

- eliminated `window.innerWidth`/`innerHeight` reads from WeatherCanvas mousemove handler (60+ Hz): Clear and Storm effects now receive cached canvas dimensions via `setMouse` instead of querying the DOM on every event, avoiding potential layout reflow
- updated Render Performance thoughts page with mousemove dimension caching section
- bumped version to 0.12.7

## 2026-07-04 - version 0.12.6

- replaced `transition-all` with explicit property lists in 8 production components: `transition-[border-color,background-color]` for HeroSection/FooterSection auth buttons, `transition-[width,background-color]` for StockBar/StoreCard/PredictionPanel/NbaSection progress bars, `transition-[background-color,border-color]` for SeriesPickCard/FinalsCard team rows, `transition-[opacity,border-color]` for SeriesPickCard/FinalsCard containers
- updated Render Performance thoughts page with transition-all cleanup section
- bumped version to 0.12.6

## 2026-07-04 - version 0.12.5

- added `content-visibility: auto` with `contain-intrinsic-size` to TCG `CardTile` and GraphQL `PokemonCard` to gate rendering of offscreen cards in infinite scroll lists; browser skips paint, layout, and style recalculation for offscreen elements and can release image decode buffers — no JavaScript or new dependencies needed
- updated Render Performance thoughts page with infinite scroll content-visibility section
- bumped version to 0.12.5

## 2026-07-04 - version 0.12.4

- replaced HeroSection scroll-hint `motion.rect` infinite Framer Motion animation with a CSS `@keyframes` animation (`animate-scroll-hint` utility); Framer Motion infinite animations run RAF callbacks for the entire session even when scrolled offscreen, CSS animations are compositor-friendly and browsers throttle them when not visible
- bumped version to 0.12.4

## 2026-07-04 - version 0.12.3

- fixed flash of authenticated hub skeleton for unauthenticated users on the root page: replaced the FeatureHub-shaped `loading.tsx` (header, 7 feature cards, 8 thought cards) with a neutral `bg-background` div since `auth0.getSession()` is a local cookie decrypt that resolves in milliseconds
- bumped version to 0.12.3

## 2026-07-04 - version 0.12.2

- reduced FeaturesSection `backdrop-filter` blur radius from 16px to 4px across all 11 FeatureCards (Gaussian kernel cost scales with radius squared, so ~1/16th GPU compositor cost per card while preserving frosted glass aesthetic)
- updated Render Performance thoughts page with backdrop-filter blur reduction section
- bumped version to 0.12.2

## 2026-07-04 - version 0.12.1

- debounced WeatherCanvas resize handler at 150ms to prevent dozens of offscreen canvas allocations per second during window drag-resize (cloud effect was calling `makeCloudSprite` 14 times per resize frame, each allocating a `document.createElement('canvas')` with gradient fills)
- updated Render Performance thoughts page with resize debounce section
- bumped version to 0.12.1

## 2026-07-04 - version 0.12.0

- fixed WeatherContext value instability causing cascading re-renders: wrapped `toggle` and `setSelectedEffect` in `useCallback`, wrapped context value object in `useMemo` keyed on actual values so consumers only re-render when data changes
- created Render Performance thoughts page at `/thoughts/render-perf` documenting the runtime performance review and incremental fixes (starting with WeatherContext, with 17 more issues queued)
- bumped version to 0.12.0

## 2026-07-04 - version 0.11.17

- added Operator and Learn to the landing page feature grid in FeaturesSection (new IconLearn + IconOperator SVGs, FeatureCards with design tokens and links)
- created dedicated OperatorSection landing component with mock fleet dashboard (4 store rows with status dots, health bars, alert badges), 3 highlight cards, and violet-themed CTA
- created dedicated LearnSection landing component with dot-grid topic list (8 topics with category labels), 3 highlight cards, and emerald-themed CTA
- wired OperatorSection and LearnSection into LandingContent.tsx as dynamic imports, rendered after FeaturesSection
- bumped version to 0.11.17

## 2026-07-04 - version 0.11.16

- polished all 13 learn pages for Visual Style Guide consistency: fixed PageHeader breadcrumbs and maxWidth on async-patterns and from-scratch pages, changed code block containers from `<div>` to `<pre>` on debounce-throttle and memoization pages, reduced code block span colors from 4 to 3 (removed redundant text-foreground identifier spans) on two-pointers/hash-maps/stacks-queues/binary-search/trees-graphs pages, added missing monospace complexity notes to "spot this pattern" boxes on debounce-throttle/memoization/event-delegation/async-patterns pages, standardized dot-grid positioning and outer shell structure on async-patterns and from-scratch pages
- added missing learn routes to architecture map (dynamic-programming through from-scratch)
- bumped version to 0.11.16

## 2026-07-04 - version 0.11.15

- added From Scratch topic page at `/learn/from-scratch` -- tabbed interface with five pill-toggled challenges (once(), pipe(), Promise.all(), bind(), Array.map()), each with a guided line-by-line code walkthrough where lines reveal one at a time via motion.div + fadeInUp with "Next line" pill button, each revealed line paired with a text-[11px] annotation explaining what it does (hidden on mobile), progress counter showing lines revealed; "Run tests" pill appears when all lines are revealed, test cases render as thin-bordered rows with AnimatePresence staggered entrance, monospace ✓ at text-foreground/50 for pass and ✗ at text-foreground/30 for fail; tab content swaps with AnimatePresence mode="wait" crossfade; Reset pill to restart walkthrough; bottom nav with "← Async Patterns" and "Back to all topics" with small 3×3 dot-grid SVG motif; no "spot this pattern" box (the whole page is the pattern); follows Visual Style Guide
- bumped version to 0.12.5

## 2026-07-04 - version 0.11.14

- added Async Patterns topic page at `/learn/async-patterns` -- interactive event loop simulator with three preset code snippets (console logs, setTimeout + Promise, nested microtasks), three-column layout (Call Stack, Microtask Queue, Macrotask Queue) with motion.div blocks moving between columns via AnimatePresence + spring transitions, output line accumulating below, step-by-step narration, Step/Play/Reset pill controls at 800ms interval; Promise combinators section with three stacked SVG timeline diagrams (Promise.all, Promise.allSettled, Promise.race) showing task bars as motion.rect at varying fillOpacity with scaleX scroll-triggered animation and resolution dots at different positions; sequential vs parallel pitfall section with two code blocks and companion SVG timelines (end-to-end bars for sequential ~3s vs overlapping bars for parallel ~1s); three stacked code templates (event loop quiz answer with output order, Promise.all parallel fetch, try/catch/finally error handling); "spot this pattern" callout; follows Visual Style Guide
- bumped version to 0.12.4

## 2026-07-04 - version 0.11.13

- added Event Delegation topic page at `/learn/event-delegation` -- interactive bubbling visualizer with nested DOM boxes (document > body > div > ul > li) built via Array.reduce, clicking the innermost li triggers staggered activation up through each layer (120ms per step) with ring pulse and accent border, "Bubble!" pill button resets and replays; cost comparison section with two scrollable 50-item lists side by side (50 individual onClick handlers vs single parent handler using data-idx delegation), click highlights the selected row in both, handler count labels show 50 vs 1; dynamic list demo with add/remove items via AnimatePresence, single parent handler using data-item-id delegation, counter tracks dynamically added items to prove no re-binding needed; capture vs bubble static SVG diagram with three nested boxes and directional arrows showing capture (down) and bubble (up) phases; vanilla JS delegation code block (~12 lines) with target.closest pattern; React synthetic events left-border callout explaining built-in delegation; "spot this pattern" callout; follows Visual Style Guide
- bumped version to 0.12.3

## 2026-07-04 - version 0.11.12

- added Memoization topic page at `/learn/memoization` -- interactive cache visualizer demo with three compute(n) pill buttons triggering a 1-second progress bar on cache miss (requestAnimationFrame-driven), instant return with row flash on cache hit, cache table grows via AnimatePresence + fadeInUp, status text shows miss/hit state; React.memo component tree demo with Parent and three children (List/Form/Chart) as thin-bordered boxes connected by lines, render counts in monospace, "Re-render parent" pill button cascades to all children without memo vs parent-only with React.memo toggle; "build it from scratch" annotated memoize() utility (~10 lines) with JSON.stringify key derivation; "when not to memoize" left-border callout with four anti-patterns; "spot this pattern" callout; follows Visual Style Guide
- bumped version to 0.12.2

## 2026-07-04 - version 0.11.11

- added Debounce & Throttle topic page at `/learn/debounce-throttle` -- live click timeline demo with three horizontal timelines (Raw, Debounced 300ms, Throttled 300ms) showing DOM-based dots at time-proportional positions with scaleIn entrance and flash-to-settle opacity on debounced/throttled dots, real debounce (trailing) and throttle (leading) logic via setTimeout/Date.now refs, Clear button resets all state; leading vs trailing edge section with two side-by-side static SVG timeline diagrams showing event dots, 300ms brackets, and handler fire position; "build it from scratch" section with annotated two-column code blocks (code left, annotations right via flex layout hidden on mobile) for debounce (~8 lines) and throttle (~10 lines); "when to use which" left-border callout with four use cases; "spot this pattern" callout; follows Visual Style Guide
- bumped version to 0.12.1

## 2026-07-04 - version 0.11.10

- added Dynamic Programming topic page at `/learn/dynamic-programming` -- static fib(5) call tree SVG as bridge from recursion page (dashed borders on duplicate nodes), interactive bottom-up Fibonacci table demo with 8 cells filling left to right via AnimatePresence (step/play/reset controls), interactive Unique Paths grid demo with preset size pills (3×3 through 6×6) filling in diagonal-wave order with narration explaining each cell's formula, top-down vs bottom-up section with left-border callouts and small static SVG direction diagrams (tree with recurse/combine arrows, row of cells with iterate arrow), climbing stairs mini-demo as SVG staircase with 6 thin-bordered steps and ways-to-reach counts auto-animating bottom to top via motion.text with staggered delays on scroll, three stacked code templates (top-down memoized recursion, bottom-up table iteration, climbing stairs concrete example), "spot this pattern" callout with O(n²) or O(n\*m) time; follows Visual Style Guide
- bumped version to 0.12.0

## 2026-07-03 - version 0.11.9

- added Recursion & Backtracking topic page at `/learn/recursion-backtracking` -- interactive Fibonacci call tree demo with SVG binary tree built dynamically for n=3-6 presets, memoization toggle that prunes redundant subtrees (dashed borders without memo, fade-to-invisible with memo), DFS step-through with vertical call stack panel and cache chip row (AnimatePresence entries), call count comparison showing savings; interactive backtracking subsets demo for [1,2,3] with 15-node binary decision tree, +n/−n edge labels, active path highlighting at strokeOpacity 0.5 with backtracked paths dimmed, result chips accumulating with AnimatePresence, leaf labels showing subset notation; "why recursion feels hard" left-border callout; two stacked code templates (recursive template, backtracking choose/explore/unchoose); "spot this pattern" callout with O(2^n) or O(n!) time; follows Visual Style Guide
- bumped version to 0.11.9

## 2026-07-03 - version 0.11.8

- added Trees & Graphs topic page at `/learn/trees-graphs` -- interactive tree traversal demo with SVG binary tree (7 nodes), pill-toggled DFS modes (pre-order, in-order, post-order) and BFS, edges animate with pathLength as they're followed, visited nodes fill to fillOpacity 0.2 with strokeOpacity 0.7, vertical call stack panel for DFS (thin-bordered blocks with spring entries) and horizontal queue panel for BFS, visit order accumulates as monospace chips with AnimatePresence; DOM tree analogy section with mini SVG tree showing querySelector is DFS; interactive graph BFS demo with SVG undirected graph (6 nodes, 7 edges, cycles), three preset start/target pairs plus click-to-change-target, BFS explores level by level with staggered fill delays (level \* 0.08), shortest path edges highlighted at strokeOpacity 0.6, queue and visited set shown as chip rows; three stacked code templates (tree DFS recursive, tree BFS iterative, graph BFS with visited set); "spot this pattern" callout with O(V+E) time; follows Visual Style Guide
- bumped version to 0.11.8

## 2026-07-03 - version 0.11.7

- add Vitals and Learn quicklinks in settings menu

## 2026-07-03 - version 0.11.6

- added Binary Search topic page at `/learn/binary-search` -- two interactive demos: classic binary search on a sorted 10-element array with L/R/mid pointer labels that spring between cells via motion.div, three preset targets (found-quick, found-longer, not-found), eliminated cells fade to opacity-[0.15]; search-the-answer-space demo ("minimum ship capacity to deliver packages in D days") with capacity range cells, lo/hi/mid pointer labels springing inward, package day-assignment visualization below showing how packages distribute across days for each candidate capacity; "the real insight" left-border callout with static F/T monotonic predicate row and boundary accent; two stacked code templates (classic find-target, search-the-answer predicate boundary); "spot this pattern" callout with O(log n) time; follows Visual Style Guide with dot-grid background, thin-bordered rounded-sm cells, hoverSpring animations, step/play/reset pill controls, narration with monospace values
- bumped version to 0.11.6

## 2026-07-03 - version 0.11.5

- added a not-found page for when we navigate to pages that don't exist

## 2026-07-03 - version 0.11.4

- added Stacks & Queues topic page at `/learn/stacks-queues` -- side-by-side interactive Stack (LIFO) and Queue (FIFO) with push/pop and enqueue/dequeue controls using spring-animated blocks via AnimatePresence, Valid Parentheses demo with preset pills scanning characters left to right while a stack visualization grows/shrinks with push/pop/mismatch highlighting, "when to use which" left-border callout with two concise lists, two stacked code templates (valid parentheses stack, BFS queue), "spot this pattern" callout with O(n) time/O(n) space; follows Visual Style Guide
- bumped version to 0.11.4

## 2026-07-03 - version 0.11.3

- added Hash Maps & Sets topic page at `/learn/hash-maps` -- interactive Two Sum (unsorted) demo with array cells on top and map table growing below via AnimatePresence as each value is stored, SVG hashing diagram with pathLength-animated arrows drawing in on scroll, Set operations mini-visual with add/has/delete chips that enter with scaleIn, flash on has, and exit on delete, three stacked code templates (Map pattern, Set pattern, frequency counting), "spot this pattern" callout with O(n) time/O(n) space; follows Visual Style Guide with dot-grid background, thin-bordered cells, left-border accent callouts, prev/next navigation
- bumped version to 0.11.3

## 2026-07-03 - version 0.11.2

- added Sliding Window topic page at `/learn/sliding-window` -- two interactive demos (Max Sum Subarray with window size selector and spring-animated window overlay that slides across cells, Longest Substring Without Repeats with variable window overlay that expands/contracts and seen-characters chips via AnimatePresence), fixed vs variable window comparison with mini-cell diagrams, stacked code templates for both patterns, step/play/reset controls, narration per step; follows the Visual Style Guide with dot-grid background, thin-bordered cells, left-border accent callouts, prev/next navigation
- bumped version to 0.11.2

## 2026-07-03 - version 0.11.1

- added Two Pointers topic page at `/learn/two-pointers` -- first topic page, sets the quality bar for all others; two interactive demos (Two Sum on sorted array with target selector, Remove Duplicates in-place with read/write pointers), step/play/reset controls, narration per step, code template, "spot this pattern" box, prev/next navigation; follows the Visual Style Guide with dot-grid background, thin-bordered cells, spring-animated pointer indicators, left-border accent callouts
- bumped version to 0.11.1

## 2026-07-03 - version 0.11.0

- added `/learn` hub page with 13 algorithm and frontend pattern topics grouped by category (Core Algorithms, Frontend Patterns) -- editorial design with dot-grid background, monospace numbering (01-13), no card borders, unique geometric SVG marks per topic that animate on hover to demonstrate each concept (two pointers converge, sliding window slides, DP grid fills in a diagonal wave, etc.)
- added learn entry to FeatureHub with preview component echoing the hub's dot-grid + monospace-number aesthetic
- added `--color-feature-learn` design token
- added dashboard back-link to learn page header via PageHeader breadcrumbs
- updated `/learn` implementation plan with comprehensive Visual Style Guide and specific styling details for all 13 topic page steps
- bumped version to 0.11.0

## 2026-07-03 - version 0.10.40

- fixed alert dismiss not persisting across route handlers -- Next.js bundles each route handler independently in dev mode, so the dismiss PATCH route and the alerts GET route had separate instances of the in-memory data store; dismissing an alert updated one instance while the 15-second poll refetched from another where the alert was never dismissed; moved the data store onto `globalThis` behind a singleton accessor so all route handlers share the same state (same pattern Next.js docs recommend for Prisma clients)
- added operator dashboard to the thoughts section in FeatureHub with a card linking to `/thoughts/operator-dashboard`, and added `thoughtsHref` to the operator feature card so it gets an "About" link like the other features
- bumped version to 0.10.40

## 2026-07-02 - version 0.10.39

- fixed all stores showing "Offline" connection quality and sensor offline callouts -- `lastPing` timestamps in the factory were generated 0-2 hours in the past at module load time and never refreshed, so they always drifted past the 10-minute offline threshold; store accessors now recompute `lastPing` relative to `Date.now()` on every read (online stores get 0-60s old pings, degraded store gets 7-minute old ping), and the factory default was tightened from `Math.random() * 2` hours to `Math.random() / 60` hours
- bumped version to 0.10.39

## 2026-07-02 - version 0.10.38

- updated operator dashboard thoughts page to cover the full self-review pass -- added a new "The self-review" section explaining the audit process (correctness, performance, UX, code quality, testing) with specifics on what was found and fixed, updated the tradeoffs section to reflect that the fan-out query pattern and unmemoized chart transforms have been resolved, and added a matching conversation thread to the chat view
- bumped version to 0.10.38

## 2026-07-02 - version 0.10.37

- strengthened `useRestockStore` rollback test to close a mutation testing gap -- previously the test only asserted the final state (`currentStock === 3`), which a mutant that removes the `onMutate` optimistic update could survive (stock never changes from 3, so it trivially passes); now the test adds a 300ms delay to the 500 response and asserts the optimistic update fires first (`currentStock === 10`) before verifying the rollback reverts it
- bumped version to 0.10.37

## 2026-07-02 - version 0.10.36

- added test for `RefreshBar` "last refreshed" display -- verifies the component reads `dataUpdatedAt` timestamps from the operator query cache and renders the correct relative time via `formatDistanceToNow`, picks the most recent entry when multiple operator queries exist, and falls back to "less than a minute ago" when no queries are cached
- bumped version to 0.10.36

## 2026-07-02 - version 0.10.35

- added component-level tests for error and empty states across all four store detail tabs (InventoryTab, AlertsTab, ActivityTab, PlanogramTab) -- previously only utility function tests existed; new tests use MSW to return 500s and empty arrays, verifying each tab renders the correct error message on fetch failure and the appropriate empty state when no data exists
- bumped version to 0.10.35

## 2026-07-02 - version 0.10.34

- added integration test for `OperatorDashboard` render with MSW -- verifies store cards appear for every store in the fleet, checks worst-first sort order (offline > degraded with alerts > online), asserts per-card alert count and inventory health from fleet summary, and confirms fleet stats bar renders
- bumped version to 0.10.34

## 2026-07-02 - version 0.10.33

- added `/api/operator/fleet-summary` endpoint that returns aggregated alert counts, inventory health, fleet stats, and alert trend data per store in a single request -- the dashboard previously fanned out 2N parallel queries (alerts + inventory per store, each polling independently), which doesn't scale past ~20 stores; now the fleet overview makes 1 request every 15s regardless of fleet size
- refactored `OperatorDashboard` to replace the two `useQueries` fan-outs with a single `useQuery` to `/api/operator/fleet-summary`, cutting per-store `alertsByStore`/`inventoryByStore` maps in favor of a flat `StoreSummary[]` lookup
- updated `FleetAnalytics`, `AlertTrendChart`, and `InventoryComparisonChart` to accept pre-computed data from the server instead of raw alert/inventory arrays
- bumped version to 0.10.33

## 2026-07-02 - version 0.10.32

- moved `allAlerts` flat-array computation from `FleetAnalytics` up to `OperatorDashboard` -- `FleetAnalytics` was receiving `alertsByStore` only to flatten it via `useMemo`, but the parent already has all alert data; now `OperatorDashboard` computes the flat array once and passes it down as an `allAlerts` prop, removing the redundant transform from the child
- bumped version to 0.10.32

## 2026-07-02 - version 0.10.31

- unified duplicate `STATUS_CONFIG` objects from `StoreCard` and `StoreHeader` into a single export in `operator-detail.ts` -- the two copies had different shapes (`border` vs `bg` fields), now one config carries all fields both components need
- bumped version to 0.10.31

## 2026-07-02 - version 0.10.30

- added per-item restock feedback in `InventoryTab` and `InventoryRow` — previously `isRestocking` was a single global boolean so all rows showed "Restocking..." at once and there was no success indicator; now tracks in-flight and recently-restocked item IDs via sets, each row shows its own "Restocking..." state, and a green checkmark "Restocked" badge appears for 2 seconds after success
- bumped version to 0.10.30

## 2026-07-02 - version 0.10.29

- added expand/collapse animation to `FleetAnalytics` — the chart section previously toggled instantly via conditional render; wrapped in `AnimatePresence` + `motion.div` with height and opacity animation (0.25s easeInOut) for a smooth transition
- bumped version to 0.10.29

## 2026-07-02 - version 0.10.28

- fixed alert banner filter callbacks in `OperatorDashboard` — `onFilterCritical` and `onFilterWarning` both set `statusFilter("degraded")` which is wrong (store status !== alert severity); replaced with a new `severityFilter` state that narrows visible stores to only those with unacknowledged alerts of the selected severity; shows a dismissible chip when active; "Clear filters" resets it too
- bumped version to 0.10.28

## 2026-07-02 - version 0.10.27

- added "Back to fleet" link above `StoreHeader` in `StoreDetail` — store detail page had no way to navigate back to the fleet dashboard without using browser back; now shows a subtle link at the top pointing to `/operator`
- bumped version to 0.10.27

## 2026-07-02 - version 0.10.26

- fixed unreadable tooltip text in dark mode across all three fleet analytics charts (`InventoryComparisonChart`, `FleetHealthChart`, `AlertTrendChart`) — `contentStyle.color` alone doesn't reach Recharts' inner text elements; replaced with `labelStyle` and `itemStyle` using `var(--color-foreground)` so both the tooltip title and value lines are readable in dark mode
- bumped version to 0.10.26

## 2026-07-02 - version 0.10.24

- fixed silent error swallowing in `InventoryTab.handleRestock` — the `restockStore` promise had no `.catch()`, so a failed restock would optimistically roll back the UI but give the user no feedback; now catches the rejection and shows an error toast via `useToast`
- bumped version to 0.10.24

## 2026-07-02 - version 0.10.23

- added "Clear filters" button to the empty store grid state in `OperatorDashboard` — resets both `statusFilter` and `search` to defaults; only renders when filters are actually active so it doesn't appear when the fleet is genuinely empty
- bumped version to 0.10.23

## 2026-07-02 - version 0.10.22

- surfaced per-store sub-query failures in `OperatorDashboard` — the `useQueries` `combine` callbacks now track `isError` alongside `data`; a `storeQueryErrors` set identifies stores whose alert or inventory fetches failed, and `StoreCard` shows a subtle "Data error" indicator with a warning icon in the footer when `hasQueryError` is true
- bumped version to 0.10.22

## 2026-07-02 - version 0.10.21

- added "Retry" button to the stores fetch error state in `OperatorDashboard` — previously a failed fetch showed only the error message with no way to recover; now calls `queryClient.invalidateQueries` on the stores query key so the user can re-trigger the fetch without refreshing the page
- bumped version to 0.10.21

## 2026-07-02 - version 0.10.20

- wrapped chart transform calls in `useMemo` inside `FleetHealthChart`, `AlertTrendChart`, and `InventoryComparisonChart` — `toFleetHealthData`, `toAlertTrendData`, and `toInventoryComparisonData` were called inline on every render; now memoized on their respective props so they only recompute when the underlying data changes
- bumped version to 0.10.20

## 2026-07-02 - version 0.10.19

- fixed unstable `useMemo` deps in `OperatorDashboard` caused by `useQueries` returning a new array reference on every render — added `combine` callbacks that select just the `.data` arrays from each query result, so TanStack Query's `replaceEqualDeep` structural sharing keeps the reference stable between renders when no query data has actually changed; this stops the cascade where `alertsByStore` → `alertCounts` → `fleetStats` → `inventoryHealthByStore` → `visibleStores` all recalculated on every render
- bumped version to 0.10.19

## 2026-07-02 - version 0.10.18

- extracted inline SVG icons scattered across operator components into shared `src/components/operator/icons.tsx` — deduplicated WarningTriangle (was in StoreCard, SensorOfflineCallout, AlertSummaryBanner), RefreshIcon (was in QuickActions, RefreshBar); consolidated RestockIcon, CheckmarkIcon, CheckCircleIcon, ChevronDownIcon, OfflineXIcon, SignalBarsIcon as named exports with `size` and `className` props for flexible reuse
- bumped version to 0.10.18

## 2026-07-02 - version 0.10.17

- extracted shared `Bone` skeleton component to `src/components/operator/Bone.tsx` — was duplicated identically across 8 files (OperatorDashboard, StoreDetail, operator/loading, stores/[storeId]/loading, InventoryTab, AlertsTab, ActivityTab, PlanogramTab); all now import from the single source
- bumped version to 0.10.17

## 2026-07-02 - version 0.10.16

- fixed direct object mutation in `operator-data.ts` — `dismissAlert()` and `restockItems()` were mutating in-memory objects directly (`alert.acknowledged = true`, `item.currentStock = item.capacity`), which violates immutability and can cause stale reference bugs with React's diffing; both now return new objects via spread and replace entries in their respective maps/arrays
- fixed shared `isDismissing` state in `AlertsTab` — previously a single boolean from `useDismissAlert()` was passed to every `AlertRow`, so dismissing one alert disabled all dismiss buttons; now tracks in-flight alert IDs via a `Set<string>` so only the specific row being dismissed shows "Dismissing..." and disables its button
- fixed ARIA tab pattern in `StoreTabs` — tab buttons now have `id="tab-{id}"` and the tab panel's `aria-labelledby` references it, completing the `aria-controls`/`aria-labelledby` relationship
- made `toAlertTrendData` deterministic — added optional `now: Date` parameter (defaults to `new Date()`) so tests can pass a fixed date instead of depending on wall-clock time
- made `getConnectionQuality` deterministic — added optional `now: number` parameter (defaults to `Date.now()`) matching the pattern in `operator-freshness.ts`
- bumped version to 0.10.16

## 2026-07-01 - version 0.10.14

- added operator dashboard thoughts page at `/thoughts/operator-dashboard` — design write-up covering tiered polling rationale (15s alerts, 30s stores, 60s inventory), optimistic update lifecycle, severity-first sorting UX, data freshness system (three-tier thresholds with deterministic `now` parameter), fleet analytics collapsible section, toast notification architecture (framework-agnostic `createToastStore` with `useSyncExternalStore` bridge), store detail tabs (inventory/alerts/activity/planogram with `?tab=` URL sync), and tradeoffs (in-memory data, per-store fan-out at scale, chart transform recomputation); includes future improvement discussion — WebSocket/SSE for sub-second alert delivery, push notifications for off-screen operators, historical anomaly detection, role-based multi-tenant auth, mobile-first field technician view, and geographic map overlay; both summary and iMessage chat views
- updated README.md with Operator Dashboard feature section, architecture-map.md with thoughts route, and context INDEX.md with feature entry
- bumped version to 0.10.14

## 2026-07-01 - version 0.10.13

- polished operator dashboard for accessibility, responsive design, and motion — added `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` to all interactive elements across 13 operator components (AlertSummaryBanner filter buttons, StoreCard links, StoreFilters status pills, RefreshBar button, FleetAnalytics toggle, StoreTabs tab buttons, InventoryRow restock button, AlertsTab severity filters, AlertRow dismiss button, ActivityTab load-more button, QuickActions action buttons, ConfirmModal cancel/confirm buttons); FleetStatsBar now uses CSS grid `grid-cols-2 sm:grid-cols-4` so stats wrap into a 2x2 grid on mobile instead of a cramped single row; StoreTabs scrolls horizontally on mobile with hidden scrollbar (`overflow-x-auto`, `scrollbarWidth: none`) and `whitespace-nowrap` on tab buttons; FleetAnalytics charts stack full-width on mobile (`grid-cols-1 md:grid-cols-3`); PlanogramTab grid is responsive (`grid-cols-2 sm:grid-cols-4`) instead of hardcoded 4-column; added Framer Motion `fadeInUp` entrance animation with `spring.smooth` transition to both OperatorDashboard and StoreDetail page content

## 2026-07-01 - version 0.10.12

- integrated operator dashboard into app navigation and feature hub — added "Operator Dashboard" card to `FeatureHub.tsx` with a mini-preview showing store status dots, inventory health bars, and health percentages; added `--color-feature-operator` design token (`#c4b5fd`, violet-300) to `tokens.css`; added "Operator" link with control-panel icon to `HeaderMenu.tsx` dropdown (visible on all pages, not gated behind auth); added "Fleet Operator" card with monitor icon to the landing page `FeaturesSection.tsx` grid
- upgraded store detail breadcrumb from generic "Operator > Store" to "Dashboard > {Store Name}" by calling `getStore(storeId)` server-side in the page component; store detail metadata is now dynamic via `generateMetadata` — page title shows the actual store name (e.g. "Lobby Fridge - Building A — Operator") and description references it; OG URL now includes the specific storeId

## 2026-07-01 - version 0.10.11

- added Fleet Analytics collapsible section to the operator fleet overview — three Recharts visualizations placed between the stats bar and store filters: (1) fleet health donut chart showing distribution of store statuses (online/degraded/offline) with color-coded slices and inline legend, (2) alert trend area chart bucketing all alerts across stores into 24 one-hour slots so operators can see whether alert frequency is rising or falling, (3) inventory comparison horizontal bar chart showing per-store inventory health percentage with color-coded bars (green >= 60%, amber >= 30%, red < 30%) for quick identification of which store needs restocking most; section collapses/expands via a toggle button with chevron animation, collapse state persisted in localStorage so operators who prefer the compact view don't re-collapse every visit (defaults to collapsed); pure data transform functions (`toFleetHealthData`, `toAlertTrendData`, `toInventoryComparisonData`) in new `src/lib/operator-chart-transforms.ts` handle all data shaping — status counting, hourly alert bucketing with 24h cutoff, and per-store health averaging with zero-capacity safety and name truncation; 18 TDD tests covering status distribution, zero-store edge cases, alert bucketing accuracy, 24h cutoff, chronological ordering, health computation, zero-capacity division safety, and input immutability

## 2026-07-01 - version 0.10.10

- added quick action buttons to the store detail page — row of three actions below the store header: "Mark All Restocked" (resets all low/critical/out-of-stock items to full capacity via batch `restockStore` mutation), "Acknowledge All Alerts" (dismisses all non-critical unacknowledged alerts via parallel `dismissAlert` mutations), and "Force Sensor Refresh" (simulates a sensor re-sync with 2-second spinner then invalidates the store query); bulk actions (restock, dismiss) show a `ConfirmModal` before executing since they affect multiple records; all actions use optimistic updates and show toast notifications on completion ("Restocked 4 items", "Dismissed 3 alerts", "Sensor refresh complete"); toast system built as a framework-agnostic `createToastStore` in `src/lib/operator-toast.ts` with `useSyncExternalStore` bridge via `ToastContext`; toasts auto-dismiss after 3 seconds, render as animated bars at bottom-right via `ToastNotification`; pure helper functions `getLowStockItemIds` and `getDismissableAlerts` added to `src/lib/operator-detail.ts`; 22 TDD tests covering toast state management (add, remove, auto-dismiss timing, subscriber notifications) and quick action item selection logic (low stock filtering, dismissable alert filtering, boundary conditions)

## 2026-07-01 - version 0.10.9

- added data freshness visual system across the operator dashboard — `FreshnessLabel` now shows green text with pulsing dot for data under 2 minutes old, amber for 2-10 minutes, red for over 10 minutes; `RefreshBar` component at the top of the fleet overview shows "last refreshed X ago" (derived from TanStack Query cache timestamps) with a manual refresh button that invalidates all operator queries; `StoreCard` gains an amber border-2 treatment when sensor data is older than 10 minutes; `ConnectionQuality` expanded from 3 tiers to 4 — strong (3 bars), weak (2 bars), poor (1 bar), offline (X icon) — with thresholds at 2, 5, and 10 minutes; `SensorOfflineCallout` warning banner appears on the inventory tab when sensors haven't reported in 30+ minutes, showing offline duration and last reading timestamp; pure threshold functions (`getFreshnessLevel`, `isStaleData`, `isSensorOffline`) in new `src/lib/operator-freshness.ts` with deterministic `now` parameter for testing; 26 TDD tests covering all freshness and connection quality threshold boundaries

## 2026-07-01 - version 0.10.8

- added Activity tab to the store detail page — chronological feed of recent events (restocks, maintenance, alert dismissals, status changes, price updates) sorted newest-first with alternating row backgrounds, color-coded type icons and labels, actor email, and relative timestamps; shows 50 events at a time with "Load more" button; full data pipeline: `getActivity` accessor in `operator-data.ts`, `GET /api/operator/stores/[storeId]/activity` API route, `useOperatorActivity` hook with refetch-on-focus, `activity` query key, and MSW handler seeding 15 events per store
- added Planogram tab to the store detail page — CSS grid layout representing store shelves, each slot showing product name, category, stock level dot (green/amber/red), fill percentage, and sensor match status; mismatched slots highlight with amber border and "Mismatch" label; legend bar with stock level key and mismatch count; grid generated from inventory data via `generatePlanogramGrid` with deterministic sensor match derived from item ID hash
- pure helper functions added to `src/lib/operator-detail.ts`: `getActivityTypeConfig` (maps activity type to label + color), `ACTIVITY_TYPE_CONFIGS` constant, `generatePlanogramGrid` (chunks inventory into shelf rows with simulated sensor match); 16 TDD tests covering type config completeness, distinct colors, grid chunking, shelf width, slot data integrity, deterministic sensor match, and mismatch distribution
- all four store detail tabs (Inventory, Alerts, Activity, Planogram) are now fully wired up with no remaining placeholders

## 2026-06-30 - version 0.10.7

- added Alerts tab to the store detail page — alerts sorted by severity (critical first, then warning, then info) with category icons (sensor-offline, low-stock, temperature, door-ajar, power-issue), severity badges (red/amber/blue), message text, "X ago" timestamps, and per-alert dismiss button; dismiss uses `useDismissAlert` mutation with optimistic update (alert vanishes immediately, rolls back on failure); severity filter pills (All/Critical/Warning/Info) narrow the visible alerts; only unacknowledged alerts are shown; "All clear" empty state with checkmark when no active alerts remain; live alert count badge on the Alerts tab label updates via the 15-second polling hook; loading skeleton matching real layout; pure helper functions (`sortAlertsBySeverity`, `filterAlertsBySeverity`, `countActiveAlerts`) added to `src/lib/operator-detail.ts` with 24 TDD tests covering severity ordering, stable sort, filter composition, dismiss pipeline, and count badge behavior

## 2026-06-30 - version 0.10.6

- added Inventory tab to the store detail page at `/operator/stores/[storeId]` — summary bar showing total items, items needing restock, and average fill percentage; inventory rows with product name, category, stock bar (color-coded green/amber/red by fill ratio), status badge (Healthy/Low/Critical/Out of Stock), 7-day simulated stock trend sparkline via Recharts, "last restocked" timestamp, and per-item "Mark Restocked" button; critical and out-of-stock items highlighted with red left border accent; restock button uses `useRestockStore` mutation with optimistic update (stock jumps to capacity immediately, rolls back on failure); restock disabled for healthy items; loading skeleton matching real layout; pure helper functions (`categorizeStock`, `computeInventorySummary`, `generateSparklineData`) added to `src/lib/operator-detail.ts` with 34 TDD tests covering categorization thresholds, boundary conditions, summary aggregation, sparkline determinism, restock eligibility, and urgent border treatment

## 2026-06-30 - version 0.10.5

- added store detail page at `/operator/stores/[storeId]` — header showing store name, address, status badge (online/degraded/offline), uptime percentage, sensor connection quality indicator (strong/weak/offline with signal bars icon), and "last reading X ago" freshness timestamp; tab bar with Inventory, Alerts, Activity, and Planogram tabs synced to `?tab=` URL search param via `router.replace` so the active tab survives page refresh and back/forward navigation (defaults to Inventory when param is missing or invalid); tab panels render placeholders for now; loading skeleton matching the real layout for both the Next.js route `loading.tsx` and the client-side fetch state; pure helper functions in `src/lib/operator-detail.ts` (`parseTab`, `getConnectionQuality`, `TABS` constant) with 13 TDD tests including boundary conditions at the 2-minute and 5-minute thresholds

## 2026-06-30 - version 0.10.4

- added operator fleet overview page at `/operator` — alert summary banner with fleet-wide critical/warning counts (clickable to filter), stats bar showing total stores, stores needing attention, low-stock items, and average inventory health %; responsive grid of store cards sorted worst-first (offline > degraded with alerts > degraded > online) with status badges, alert counts, inventory health bars, and freshness timestamps via `formatDistanceToNow`; status filter pills and name search box; loading skeleton matching page layout; page metadata for SEO/OG; pure utility functions (`sortStores`, `filterStores`, `computeFleetStats`) in `src/lib/operator-utils.ts` with 20 TDD tests covering sorting priority, filtering, stats computation, and edge cases; store cards link to `/operator/stores/[storeId]`; dashboard fans out parallel `useQueries` for alerts (15s poll) and inventory (60s poll) per store to power sorting, stats, and card data without waterfall requests

## 2026-06-30 - version 0.10.3

- added TanStack Query hooks for operator dashboard data layer — `useOperatorStores` (fleet list, polls every 30s), `useOperatorStore` (single store detail), `useOperatorInventory` (store inventory, polls every 60s), `useOperatorAlerts` (store alerts, polls every 15s); all hooks use `staleTime: 0` and `refetchOnWindowFocus: true`; added `useDismissAlert` and `useRestockStore` mutations with optimistic updates (cache updated immediately, rolled back on server error, invalidated on settle); added operator keys to the centralized query key factory (`src/lib/queryKeys.ts`); 15 hook tests covering data fetching, error handling, optimistic update verification, and rollback on failure

## 2026-06-30 - version 0.10.2

- added Next.js API routes for operator dashboard following the BFF pattern (`src/app/api/operator/`) — 6 endpoints: `GET /stores` (fleet list), `GET /stores/:id` (detail), `GET /stores/:id/inventory`, `GET /stores/:id/alerts`, `PATCH /alerts/:id/dismiss`, `POST /stores/:id/restock`; routes use shared in-memory data store (`src/lib/operator-data.ts`) seeded from factory functions for demo mode (no real backend needed); restock route validates request body via `parseBody` + new `restockBodySchema`; 12 route handler tests call exported functions directly with mock `NextRequest` objects

## 2026-06-29 - version 0.10.1

- added MSW mock API handlers for operator dashboard (`src/test/handlers/operator.ts`) — 6 endpoints: fleet list, store detail, inventory, alerts, alert dismiss, and restock; handlers use factory functions to seed realistic data, include 100-300ms simulated latency, and one store is always seeded as degraded with elevated temperature and reduced uptime; registered handlers as defaults in MSW server (`src/test/server.ts`); 17 handler response tests validate schema compliance, 404s, mutation side-effects, and degraded store presence

## 2026-06-29 - version 0.10.0

- added smart mini-retail operator dashboard domain layer — Zod schemas (`src/lib/operator-schemas.ts`) for stores, inventory items, alerts, and activity events; TypeScript types derived from schemas via `z.infer` (`src/types/operator.ts`); factory functions (`src/test/factories/operator.ts`) that generate realistic mock data with store names, product catalogs, and contextual alert messages; 38 schema validation and factory integration tests

## 2026-05-17 - version 0.9.20

- fixed calendar weekly view arrow navigation bug — clicking backward (and sometimes forward) would flash the correct header then revert, or show the wrong week grid; root cause was stale scroll events from accumulated periods, IntersectionObserver prepends, and layout compensation overriding `currentDate` after programmatic scroll; replaced the unreliable boolean scroll-suppression flag with a nav-target guard that rejects stale scroll handler updates within a settling window, and changed `scrollToPeriod` to always reset to a clean 3-period window so scroll state is predictable regardless of navigation history

## 2026-05-01 - version 0.9.19

- fixed dark theme mode for some surfaces

## 2026-04-30 - version 0.9.18

- fixed bug where not correctly settting calendar event height. Tooltip wrapper was not taking the full height it should.

## 2026-04-20 - version 0.9.17

- anonymous bracket users now display their Auth0 name instead of "Anonymous" — the frontend sends `displayName: meQuery.data?.name` on every save (auto-save and submit); the backend stores it in the new `nba_playoff_brackets.display_name` column and uses it as a fallback in the leaderboard (chain: profile display_name → profile username → bracket display_name → "Anonymous")
- public bracket viewing now works for users without a profile — leaderboard rows for non-profiled users link via bracket UUID (`?view=<uuid>`); the picks API route detects UUID vs username and forwards the correct query param to the backend
- added `portfolio_api/migrations/007_bracket_display_name.sql` — `ALTER TABLE nba_playoff_brackets ADD COLUMN IF NOT EXISTS display_name TEXT`; needs to be run on Railway DB via dashboard Query tab or CLI
- fixed share URL security — bracket share links for profiled users now use username instead of Auth0 sub (which exposed the OAuth provider); anonymous users share via bracket UUID
- updated `src/app/api/nba/playoffs/picks/[sub]/route.ts` — identifier is now treated as UUID or username, not Auth0 sub; UUID pattern detected via regex, username forwarded as `?username=` query param

## 2026-04-20 - version 0.9.16

- added public bracket viewing — leaderboard rows link to `?view=<sub>` so any user's bracket can be opened in read-only mode; viewed user's row highlights in blue, own row stays orange; hover arrow reveals a direct link
- added `src/app/api/nba/playoffs/picks/[sub]/route.ts` — fetches picks for any user by Auth0 sub, used by the public view mode
- added `src/lib/nbaTeamColors.ts` — team color and logo URL lookup; series and Finals cards now render team logos alongside abbreviations
- added share button to the bracket header — copies a direct bracket link to the clipboard with a "Copied!" confirmation
- added animations throughout the bracket page — stagger enter on bracket cards and leaderboard rows, spring-physics score bars, animated save indicator with enter/exit transitions (framer-motion)
- fixed `src/components/HeaderMenu.tsx` — menu now invalidates the `/api/me` query on every route change via `usePathname` + `invalidateQueries`; the root layout never remounts in Next.js App Router so the QueryClient persisted stale `{ sub: null }` data across navigations, including the return from Auth0's login redirect which stays in the same tab and never fires a window focus event; also added `refetchOnWindowFocus: "always"` as a secondary guard for session expiry
- updated `.env.example` — added `NEXT_PUBLIC_SITE_URL` (used for OG image URLs in `src/lib/site.ts`); removed stale `APP_BASE_URL` which was not referenced anywhere in source

## 2026-04-20 - version 0.9.14

- fixed `src/components/HeaderMenu.tsx` — auth button now auto-detects login state via `/api/me` instead of always rendering "Log out"; unauthenticated users on public pages (e.g. `/fantasy/nba/playoffs` opened from Facebook Messenger) now correctly see "Log in" rather than "Log out", which was making them think they were logged in; button is hidden while the fetch is in flight to prevent any flash of the wrong state
- removed `showLogin` prop from `HeaderMenu` — replaced by auto-detect; `showLogout={false}` still hides the auth button entirely for pages where it is irrelevant (thoughts pages)
- updated `src/app/landing/HeroSection.tsx` — removed explicit `showLogout={false} showLogin` now that `HeaderMenu` handles auth state automatically

## 2026-04-19 - version 0.9.13

- fixed `src/app/page.tsx` — added `export const dynamic = "force-dynamic"` so Next.js never serves a cached HTML response at the edge; without this, a logged-in user's FeatureHub render could be cached and served to unauthenticated visitors opening the site from Facebook Messenger's in-app browser
- fixed `src/proxy.ts` — root `/` route now calls `auth0.middleware(request)` when a session cookie is present; previously the route skipped middleware entirely, meaning `auth0.getSession()` in `page.tsx` read the session cookie without validating the underlying Auth0 token — expired sessions appeared valid and FeatureHub rendered for users whose actual token was revoked or expired
- fixed `src/app/FeatureHub.tsx` — email line in the hub header is now always rendered; previously it was hidden when `userEmail` was null/undefined, which meant users who authenticated via a provider that didn't supply an email (Facebook, Apple, etc.) saw the hub with no identity information at all; now renders "no email on file" as a fallback so the header always shows something
- added `/thoughts/messenger-auth` — write-up covering the two root causes and the diagnosis

## 2026-04-18 - version 0.9.12

- updated landing page to fully respect light/dark theme — removed all hard-coded `data-theme="dark"` overrides from `Section.tsx`, `GraphQLSection.tsx`, `FooterSection.tsx`; `HeroSection.tsx` now uses `useTheme()` to conditionally apply dark vignette vs. light veil, theme-aware text shadow, and globe wireframe color (`#1a1a2e` dark → `#c8d8f0` light blue-gray)
- updated `LandingContent.tsx` — `bg-black` → `bg-background` so wrapper adapts to theme
- updated `Section.tsx` — veil changed from `bg-black/52` to `dark:bg-black/52 bg-background/95` so light mode covers the dark weather canvas
- updated all landing section components (`AuthSection`, `CalendarSection`, `DesignSection`, `FeaturesSection`, `GraphQLSection`, `KetsupSection`, `NbaSection`, `TcgSection`, `VitalsSection`, `FooterSection`) — replaced `text-white` with `text-foreground`, `bg-white/N` with `bg-foreground/N`, `border-white/N` with `border-foreground/N`; CTA buttons get `dark:text-X-300 text-X-700` for accessible contrast on light backgrounds
- updated `src/app/globals.css` — hotspot dots gain `box-shadow: 0 0 0 1.5px rgba(0,0,0,0.35)` outline for legibility on light backgrounds; pulse ring gets a darker amber tint in light mode via `[data-theme="light"] .hotspot-ring`
- updated `VitalsSection.tsx` — `RATING_TEXT` uses `dark:text-X-300 text-X-700` so green/yellow/red values pass contrast on white
- updated `GlobeModel.tsx` — wireframe color adapts to theme via `useTheme()`

## 2026-04-17 - version 0.9.11

- added `src/app/landing/models/sections/NodeClusterModel.tsx` — procedural GraphQL logo: regular hexagon outer ring (6 tube edges, radius 0.038) + equilateral inner triangle connecting alternating vertices at 12/4/8 o'clock + 6 sphere nodes in GraphQL brand pink (`#e535ab`); slow Y-axis rotation via `useFrame` at 0.22 rad/s; no hotspots (decorative background canvas)
- added `src/app/landing/models/sections/SpeedometerModel.tsx` — loads `speedometer.glb?v=3`; `Box3` auto-fit in `useEffect` computes bounding box of cloned scene and sets `scale = TARGET_SIZE / maxDimension` + `position = -center * scale` so the model centers at the origin regardless of native coordinate values; needle traversal tries common name keywords (`needle`, `pointer`, etc.), falls back to second scene child; needle lerps from `NEEDLE_REST` to `NEEDLE_GOOD` on `inView` via `useFrame`; 3 `HotspotDot` components
- added `src/app/landing/models/GraphQLSectionCanvas.tsx` — bare R3F Canvas (`frameloop="always"`, `alpha: true`, `opacity: 0.3`, `pointer-events: none`) wrapping `NodeClusterModel`; full-bleed at z-[2] between the dark veil and glow so the cluster reads as atmospheric depth behind section text
- added `src/app/landing/models/VitalsSectionCanvas.tsx` — bare R3F Canvas (`frameloop="always"`) with `OrbitControls` (no zoom/pan) + `SpeedometerModel`; accepts `inView: boolean` and `prefersReduced: boolean` props to drive needle animation
- updated `src/app/landing/GraphQLSection.tsx` — replaced `<Section>` with a raw `<section>` element; canvas at z-[2], dark veil at z-[1], glow at z-[3], content at z-[4]; `ModelLazyMount` wraps canvas as `absolute inset-0 pointer-events-none`; removed `Section` import, added `dynamic` + `ModelLazyMount` imports
- updated `src/app/landing/VitalsSection.tsx` — replaced mock dashboard (5-metric cards + by-page table) with speedometer `ModelLazyMount` (360px, max-width 520px, centered) followed by 3 stat cards (LCP/INP/CLS) in a `grid-cols-3` row; removed `MOCK_METRICS` and `MOCK_ROWS` constants; adjusted highlight and CTA animation delays; added `VitalsSectionCanvas` dynamic import
- fixed `public/models/speedometer.glb` — reprocessed from raw with `gltf-transform optimize --compress false`; previous optimize run applied Draco by default (55KB → 5.5KB), which the default `GLTFLoader` cannot decode without a WASM decoder; new file is 45KB with no extensions required
- updated `SpeedometerModel.tsx` — bumped GLB URL from `?v=2` to `?v=3` to bust `THREE.Cache` and browser HTTP cache of the Draco-compressed file
- updated `context/architecture-map.md` — added `GraphQLSectionCanvas`, `VitalsSectionCanvas`, `NodeClusterModel`, `SpeedometerModel` to component tables
- bumped `package.json` version 0.9.10 → 0.9.11

## 2026-04-17 - version 0.9.10

- added `src/app/landing/models/sections/GlobeModel.tsx` — procedural wireframe icosahedron (`icosahedronGeometry` radius 2, detail 4), slow Y-axis rotation via `useFrame` at 0.12 rad/s; no GLB, no hotspots
- added `src/app/landing/models/HeroGlobeCanvas.tsx` — bare R3F Canvas (`frameloop="always"`, `alpha: true`, camera `[0,0,2.5]` fov 60) wrapping `GlobeModel`; sits absolute inset-0 with `pointer-events: none`; dynamically imported with `ssr: false`
- updated `src/app/landing/HeroSection.tsx` — inserted `HeroGlobeCanvas` behind the vignette as hero ambient depth layer; bumped vignette from `z-[1]` to `z-[2]` to maintain correct stack order (background → globe → vignette → text)
- updated `context/architecture-map.md` — added `HeroGlobeCanvas` and `GlobeModel` to component tables; added decision #14 documenting always-on hero canvas pattern

## 2026-04-17 - version 0.9.9

- fixed `CalendarSection.tsx` clock canvas — switched from `height: 400px` to `aspect-square` with `height: 100%` so the container is always square; clock no longer appears octagonal from asymmetric clipping
- fixed `CalendarSection.tsx` clock canvas — added `zIndex: 10` to the absolute wrapper so `Html` tooltips from the clock face render above section highlight cards that follow in DOM order
- fixed `CalendarSectionCanvas.tsx` — removed `<group scale={1.2}>` wrapper; square canvas no longer needs compensating scale, clock fits naturally
- fixed `CardModel.tsx` — added `label` and `description` to cards at indices 1 (`URL-Synced State`) and 3 (`Server / Client Split`) so all five cards show a tooltip on hover
- fixed `CardModel.tsx` — adjacent cards at `|i - hoveredIndex| === 1` now duck down by 0.18 units when a neighbor is hovered, preventing overlap with the lifted card

## 2026-04-17 - version 0.9.8

- fixed `CalendarModel.tsx` — replaced `circleGeometry`/`ringGeometry` (single-sided, invisible from behind) with `cylinderGeometry` (body), `torusGeometry` (rim), and `sphereGeometry` (hour markers, center pin); model now renders correctly from all viewing angles when OrbitControls rotates past 90°
- fixed `CalendarSection.tsx` canvas — changed canvas from `inset-y-0` (tall portrait aspect that clipped clock heavily from sides) to `top-1/2 -translate-y-1/2 h-[400px]` (near-square canvas where clock fits and only the rim bleeds past the edges)
- fixed `CardModel.tsx` — added `Z_STACK = [-0.12, -0.06, 0, -0.06, -0.12]` z-depth offsets per card on the rotation group; center card renders in front, prevents z-fighting at overlap regions
- fixed `CardModel.tsx` — added `e.stopPropagation()` to `onPointerEnter`/`onPointerLeave` so raycaster does not fire on cards behind the frontmost hit
- updated `CardModel.tsx` — card geometry from 0.55×0.82 to 0.68×0.98, `FAN_RADIUS` 1.4→1.5 for wider spread, `LIFT` 0.38→0.42
- updated `TcgSectionCanvas.tsx` — camera position `[0, 0.4, 3.5]` → `[0, 0.2, 2.4]` to bring cards closer and fill the canvas
- updated `TcgSection.tsx` — canvas `maxWidth: 580px, margin: 0 auto` so the fan isn't tiny inside the full-width 1000px section

## 2026-04-17 - version 0.9.7

- added `src/app/landing/models/sections/CalendarModel.tsx` — procedural clock face: `circleGeometry` face, `ringGeometry` rim with teal emissive, 12 hour markers (major ticks at 0/3/6/9 in teal, minor in gray), hour and minute hand groups rotated via `useFrame` driven by `Date.now()`, center amber pin, 3 `HotspotDot` components on the face (Custom Calendar Engine, Google Calendar Sync, Optimistic Updates); wrapped in `<Float speed={0.9}>` for gentle idle bob
- added `src/app/landing/models/CalendarSectionCanvas.tsx` — wraps `SectionModelScene` with `autoRotate={false}` and `camera={{ position: [0,0,2.5], fov: 50 }}`; clock group scaled 1.2× so the rim bleeds slightly past the canvas edges for the cropped effect
- updated `src/app/landing/CalendarSection.tsx` — left-crop layout: outer `div ref={ref}` gains `relative md:pl-[45%]`; clock canvas is `position: absolute left-0 inset-y-0` at 43% width, hidden on mobile; heading and description switch to `md:text-left` and `md:mx-0`; dynamically imports `CalendarSectionCanvas` with `ssr: false`
- added `src/app/landing/models/sections/CardModel.tsx` — 5 playing cards in a fanned arc: fan rotations `[0.45, 0.22, 0, -0.22, -0.45]` rad around Z, pivot group at `[0, -FAN_RADIUS, 0]`, per-card lift group lerped via `useFrame` on hover (LIFT=0.38 units, speed delta×12); 3 featured cards (indices 0, 2, 4) show `Html` tooltip above card on hover using existing `.hotspot-tooltip` CSS; cursor set to pointer on hover, cleaned up on unmount
- added `src/app/landing/models/TcgSectionCanvas.tsx` — wraps `SectionModelScene` with `autoRotate={false}` and `camera={{ position: [0,0.4,3.5], fov: 50 }}`
- updated `src/app/landing/TcgSection.tsx` — replaced mock browser UI (filter bar + dealing card grid) with the 3D card fan canvas in a 300px `ModelLazyMount`; removed `MOCK_CARDS`, `TYPE_PILLS`, and `CARD_DEAL_OFFSET` constants; adjusted highlight and link animation delays

## 2026-04-17 - version 0.9.6

- added `?v=2` cache-bust suffix to both GLB URLs in `BasketballModel.tsx` and `LockModel.tsx` — Three.js loader cache retained stale failed entries (from earlier Draco-decode attempts) under the plain URL; versioned URL forces a fresh cache key
- fixed `LockModel.tsx` orientation — `lock.glb` is only 0.09 units wide along X (camera-facing axis); added `rotation={[0, Math.PI/2, 0]}` and `position={[0, 0.05, 0]}` to the inner group to show the wider Z face and center the bounding box vertically

## 2026-04-16 - version 0.9.5

- stripped Draco compression from `basketball.glb` and `lock.glb` using `@gltf-transform/core` + `draco3d`; Draco WASM requires `'wasm-unsafe-eval'` in CSP, blob: URL access, and a runtime decoder — eliminated the entire dependency by keeping GLBs uncompressed
- removed `/draco/` decoder path arguments from `useGLTF` and `useGLTF.preload` calls in both model components (no longer needed)
- removed `public/draco/` Draco decoder files (no longer needed)
- added `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/cli` as devDependencies (asset prep tooling)

## 2026-04-16 - version 0.9.4

- fixed GLB texture loading — added `blob:` to `img-src` and `connect-src` in `src/proxy.ts`; Three.js GLTFLoader creates blob: URLs for embedded textures and loads them via `<img>` / ImageBitmap fetch, both of which are blocked without `blob:` in the CSP
- fixed scene sharing — added `useMemo(() => scene.clone(), [scene])` in both `BasketballModel.tsx` and `LockModel.tsx`; `useGLTF` returns a cached singleton and `<primitive object={scene} />` without cloning can corrupt the scene graph on remount

## 2026-04-16 - version 0.9.3

- fixed CSP blocking Draco WASM — added `'wasm-unsafe-eval'` to `script-src` in `src/proxy.ts`; `WebAssembly.instantiate()` requires this directive when instantiating the Draco mesh decoder
- fixed `BasketballModel.tsx` — `basketball.glb` is also Draco-compressed; updated `useGLTF.preload` and `useGLTF` calls to pass `"/draco/"` as the `useDraco` argument

## 2026-04-16 - version 0.9.2

- fixed `LockModel.tsx` — `lock.glb` is Draco-compressed (`KHR_draco_mesh_compression`); `useGLTF` without a decoder config silently fell back to `ModelFallback` (pulsing sphere), making the auth section appear identical to the NBA section
- copied Draco WASM decoder files from `three/examples/jsm/libs/draco/gltf/` to `public/draco/` so no external CDN is needed
- updated `useGLTF` and `useGLTF.preload` calls in `LockModel.tsx` to pass `"/draco/"` as the `useDraco` argument — required to activate DRACOLoader; passing `false`/undefined disables it regardless of `setDecoderPath`
- added architecture-map decision #13 documenting the Draco decoder pattern

## 2026-04-16 - version 0.9.1

- added `src/app/landing/models/sections/BasketballModel.tsx` — loads `basketball.glb`, wraps in `<Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>`, 3 hotspot dots anchored inside Float (Live Player Stats, Fantasy Scoring, Zero-latency UI); `useGLTF.preload` called at module scope
- added `src/app/landing/models/sections/LockModel.tsx` — loads `lock.glb`, pendulum oscillation via `useFrame` (`±0.45rad` around Y axis at 0.35 Hz), gentle vertical float with `rotationIntensity={0}`, 3 hotspot dots inside Float (BFF Pattern, Rate Limiting, CSP Headers)
- added `src/app/landing/models/AuthSectionCanvas.tsx` — wraps `SectionModelScene` with `autoRotate={false}` + `LockModel`; OrbitControls stays active for manual drag
- updated `src/app/landing/models/SectionModelScene.tsx` — added `autoRotate` (default `true`) and `autoRotateSpeed` (default `0.8`) props so each section can opt out of continuous camera rotation
- updated `src/app/landing/models/NbaSectionCanvas.tsx` — replaced placeholder sphere with `BasketballModel`
- updated `src/app/landing/AuthSection.tsx` — added centered-bottom padlock canvas below existing 2-col layout; `mt-14 flex justify-center` wrapper, `ModelLazyMount` at `maxWidth: 560px, height: 420px`, dynamically imports `AuthSectionCanvas` with `ssr: false`

## 2026-04-16 - version 0.9.0

- added `src/app/landing/models/` — shared R3F infrastructure for section 3D scenes
  - `SectionModelScene.tsx` — Canvas with `frameloop="demand"`, `dpr=[1,1.5]`, explicit lights (ambient + two directionals), OrbitControls with autoRotate; `pointerEvents: "auto"` on Canvas so OrbitControls gets events despite the wrapper being `pointer-events-none`
  - `HotspotDot.tsx` — R3F `Html` overlay (retained for potential future use; not wired up in current sections)
  - `ModelFallback.tsx` — pulsing sphere mesh shown via Suspense while a model loads
  - `ModelLazyMount.tsx` — IntersectionObserver-based canvas mount deferral (200px rootMargin, accepts `style` prop)
  - `NbaSectionCanvas.tsx` — NBA-specific canvas: rotating basketball placeholder sphere
- updated `NbaSection.tsx` — bleed layout: content div uses `md:w-[52%]` (not padding) so it doesn't extend into the canvas hit area; R3F canvas right-aligned with `style={{ left: "52%", right: "-20vw" }}` so the ball bleeds off the right viewport edge; dynamically imports `NbaSectionCanvas` with `ssr: false`
- added hotspot CSS utility classes to `globals.css` (`.hotspot-root`, `.hotspot-dot`, `.hotspot-ring`, `.hotspot-tooltip`, `.hotspot-tooltip-label`, `.hotspot-tooltip-desc`, `@keyframes hotspot-pulse`)
- revised `NbaSection.tsx` — replaced static highlights grid with a feature carousel: three slides (Live API Proxy, Fantasy Matchups, Court Vision) driven by pill-style dot indicators; active card transitions via `AnimatePresence`; dots are plain HTML (not R3F `Html`) so they stay fixed on screen
- revised `NbaSectionCanvas.tsx` — removed `HotspotDot` usage; R3F `Html` overlays orbit with the camera and conflict with the carousel interaction model
- fixed `SectionModelScene.tsx` — removed `Environment preset="city"` (fetched a remote HDR file, failing in dev/offline); replaced with `ambientLight` + two `directionalLight` primitives
- fixed `NbaSection.tsx` pointer-events — changed left content from `md:pr-[48%]` to `md:w-[52%]`; padding-based layout left a full-width element over the canvas area, causing text selection when starting a drag on the ball's left side; `md:w-[52%]` ends the element at the canvas boundary

## 2026-04-16 - version 0.8.10

- fixed TCG search E2E test still failing after page.route mock was added
  - root cause: `BrowseContent` passed `initialData` (unfiltered server cards) to all React Query keys, including filtered ones like `{ q: "Pikachu" }`; React Query seeded the "Pikachu" cache entry with the wrong data and considered it fresh within the 30s `staleTime`, so no fetch was issued and the mock never fired
  - fix: `initialData` and matching `staleTime` are now only applied when `!debouncedSearch && !type` — i.e., the unfiltered key that matches what the server actually rendered
- removed unused `initialHrefs` variable from `e2e/public/tcg.spec.ts` (leftover from Attempt 2 — no longer needed after the assertion changed to `toContainEqual`)
- updated `/thoughts/ci-e2e` with Attempt 4 section covering the React Query initialData root cause

## 2026-04-16 - version 0.8.9

- added explicit Submit Bracket button to `PlayoffBracketContent`
  - `submitStatus` state (`idle | submitting | submitted`) drives button label and disabled state
  - on success, clears any pending `saveStatus` to `idle` so "Saving..." doesn't persist after the request settles
- added auto-save checkbox (default off); submit button is disabled while auto-save is on — the two modes are mutually exclusive
- leaderboard now always renders even before official results exist
  - backend returns 0-score entries for all submitted brackets when no results are in
  - entries tied at 0 are ordered by submission date ascending (earlier = higher rank)
  - BFF route adds a `toLeaderboardEntry` transform to map portfolio API field names (`userSub`, `maxPossible`, flat `breakdown`) to frontend types (`sub`, `maxScore`, `roundBreakdown` array)
- added Rules & Scoring section at the bottom of the bracket page (point table + bonus rows)
- fixed CI E2E job (`e2e-accessibility`)
  - Auth0 `Auth0Client` is constructed at module load time; unset GitHub Actions secrets resolve to empty strings and caused the SDK to throw during init, crashing all middleware routes with 500; fixed with `|| 'placeholder'` fallbacks in `ci.yml` and a try-catch around `auth0.middleware()` in `proxy.ts` so `/auth/*` errors fall through instead of crashing
  - TCG search E2E test now mocks `GET /api/tcg/cards*` via `page.route` — eliminates the dependency on TCGdex external API speed in CI; poll assertion changed from `not.toEqual(initialHrefs)` (false-positive on transient empty state) to `toContainEqual` on a specific known href from the mock payload
- updated `PlayoffBracketContent` Vitest tests to cover submit button, auto-save toggle, and submit-clears-saving behavior
- updated `/thoughts/playoffs` with new sections: Submit vs. auto-save, Leaderboard before results
- added `/thoughts/ci-e2e` page covering the Auth0 module-level initialization problem, the three TCG search test attempts (waitForResponse race, expect.poll false-positive on empty state, page.route mock), and the general rule about mocking at your own API boundary
- added NBA Playoffs Bracket feature card to the FeatureHub grid (with `thoughtsHref` linking to `/thoughts/playoffs`)
- added CI E2E Reliability card to the FeatureHub thoughts grid

## 2026-04-15 - version 0.8.8

- fix case where a change in picks in lower round cascades to later rounds

## 2026-04-15 - version 0.8.7

- added NBA Playoffs bracket picker at `/fantasy/nba/playoffs`
  - `PlayoffBracketContent.tsx` — client component; fetches bracket structure (ESPN via BFF proxy) and saved picks in parallel via TanStack Query; merges server picks with local edits using `useMemo` to avoid effect-based state initialization and satisfy `react-hooks/set-state-in-effect`
  - `SeriesPickCard.tsx` — pick a winner (two `aria-pressed` team buttons) and a series length (4-0 through 4-3 select); disabled when either team slot is still TBD
  - `FinalsCard.tsx` — extends SeriesPickCard with combined last-game score (number input) and Finals MVP (text input); both use local state for accumulating keystrokes
  - TBD resolution: a static `PRECEDING` map + `resolveTeam` function walks pick history to display the live team abbreviation in later-round slots rather than "TBD"; unresolved slots are disabled
  - debounced PUT saves (800ms); `userHasPickedRef` guards against spurious saves on initial server data load; `SaveIndicator` shows Saving/Saved state
  - responsive layout: three-column CSS grid at `lg:` (East | Finals | West); horizontal-scroll rows with negative-margin bleed on mobile; `lg:flex-row-reverse` on West column to mirror round order at wide viewports
  - `GET /api/nba/playoffs/bracket` — ESPN bracket proxy (already existed)
  - `GET /api/nba/playoffs/picks`, `PUT /api/nba/playoffs/picks` — authenticated BFF to portfolio API (already existed)
  - `GET /api/nba/playoffs/leaderboard` — public BFF; `Cache-Control: public, s-maxage=300`; proxies to portfolio API scoring endpoint
  - `PlayoffLeaderboard.tsx` — rank medals for top 3, score chip + progress bar, per-round breakdown badges, current user row highlight (orange), empty state, skeleton; receives `currentUserSub` from `/api/me` query
  - added `sub` to `/api/me` response
  - added `playoffBracket`, `playoffPicks`, `playoffLeaderboard` keys to `queryKeys.ts`
  - added `LeaderboardRoundBreakdown`, `LeaderboardEntry`, `PlayoffLeaderboardResponse` to `src/types/nba.ts`
  - 15 Vitest tests across SeriesPickCard (5), FinalsCard (6), PlayoffLeaderboard (4)
- added `/thoughts/playoffs` write-up page (summary + chat views) covering derived state pattern, TBD resolution, debounced save guard, responsive layout, and testing approach
- added Playoffs tab to fantasy nav
- updated `context/architecture-map.md` with new route and API endpoints
- bumped version from 0.8.6 to 0.8.7

## 2026-04-08 - version 0.8.6

- WCAG 2.1 AA accessibility compliance + axe-core enforcement in CI
  - installed `@axe-core/playwright`; added `e2e/helpers/axe.ts` with shared `checkA11y()` helper — runs axe with `wcag2a/wcag2aa/wcag21aa` tags and fails the test with a structured diff of every violation
  - added visually-hidden skip link to root layout (`Skip to content` → `#main-content`); wrapped `{children}` in `<div id="main-content" tabIndex={-1}>`
  - added `suppressHydrationWarning` to `<html>` — the anti-FOUC script writes `data-theme` to the element before React hydrates, which was producing a hydration mismatch warning; this tells React the element is intentionally owned by the inline script
  - fixed four contrast/accessibility violations surfaced by axe:
    - `FeaturesSection` animated `<h2>` was missing `text-white` — axe traced the foreground token up through the DOM past the dark section overlay (a sibling, not a parent) to the white page background and flagged the mismatch
    - `NbaSection` `overflow-x-auto` table wrapper was missing `tabIndex={0}` (`scrollable-region-focusable` violation)
    - TCG type badge colors across `BrowseContent`, `card/[cardId]/page`, and `src/lib/tcg.ts` used translucent `/20` or `/15` backgrounds with light `/300` text — borderline on white; replaced with solid `-100` backgrounds and `-900` text, with `dark:` counterparts using `-950`/`-200`
    - card detail ability type badge hardcoded `text-purple-400 bg-purple-500/15` — same fix: `bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200`
  - vitals dashboard: added `aria-label` to the by-page `<table>`, `scope="col"` to all column headers, `scope="row"` on page-name cells, and an `aria-live="polite" aria-atomic="true"` status paragraph that announces the selected version to screen readers on soft navigation
  - added axe scans to all Playwright specs: landing page (smoke), TCG browse page, TCG card detail page, calendar month view (authenticated)
  - fixed pre-existing race condition in TCG card detail test — card detail spec now navigates directly via `page.goto(href)` instead of clicking the link, avoiding a race between `router.replace` (URL sync effect) and the `Link` navigation
  - added `e2e-accessibility` CI job: runs after `quality` passes, installs Chromium, runs `playwright test --project=public` — a WCAG violation blocks the merge
- updated `/thoughts/e2e`: description, "The three suites" section, new "Accessibility scanning in CI" section, "What this improves" paragraph, and chat view covering axe rationale and the four violations found
- updated `/thoughts/testing`: CI section updated to mention the e2e-accessibility job; "what would you add next" answer updated (Playwright is done; component tests and mutation testing are next)

## 2026-04-07 - version 0.8.5

- slight CLS fix for `/fantasy/nba/player/stats`, improved skeleton

## 2026-04-07 - version 0.8.4

- eliminated dark-mode flash (FOUC) — inline `<script>` in `layout.tsx` reads `theme-preference` from localStorage and sets `data-theme` on `<html>` synchronously before any CSS or hydration
- lazy-loaded all below-fold landing page sections via `next/dynamic` — `HeroSection` (the LCP element) stays eager; everything else ships in async chunks to reduce initial JS bundle size
- seeded `FeatureHub` user data from the Auth0 session in `page.tsx` so the user name renders on first paint without a client-side `/api/me` round-trip; query still runs in background and refreshes after 5 minutes
- throttled `WeatherCanvas` animation loop to 30fps (halves main-thread load) and added `scheduler.isInputPending` yield so the browser flushes pointer/keyboard events before canvas work claims the frame — key INP win
- added `Cache-Control: private, max-age=300` to the `/api/geo` route so geo lookups are cached client-side for a session without sharing between users via CDN
- fixed a `BrowseContent` bug where the URL-sync `useEffect` would call `router.replace` during navigation away from `/tcg/pokemon`, canceling the in-progress Link transition — now guarded by `usePathname`
- added `/thoughts/perf` page documenting the above changes with reasoning and tradeoffs
- added "Performance Improvements" card to the FeatureHub thoughts grid

## 2026-04-07 - version 0.8.3

- added Playwright E2E test suite
  - `playwright.config.ts` with two projects: `public` (no auth) and `authenticated` (session cookie)
  - `e2e/global-setup.ts` — logs into Auth0 once via real browser, saves `storageState`, creates `[E2E] Test Calendar` via API
  - `e2e/global-teardown.ts` — deletes the test calendar after the suite finishes
  - `e2e/public/smoke.spec.ts` — root page loads
  - `e2e/public/auth.spec.ts` — `/calendar`, `/vitals`, `/settings` redirect unauthenticated users
  - `e2e/public/tcg.spec.ts` — search filters card grid, scroll-to-sentinel loads next page, clicking a card opens its detail page
  - `e2e/authenticated/calendar.spec.ts` — create event via UI and verify in grid, delete via UI; create via API and verify in week view
  - calendar tests self-skip when `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` are absent
  - added `test:e2e`, `test:e2e:ui`, `test:e2e:report` scripts to `package.json`
- added `/thoughts/e2e` page with summary and chat views covering the why, how, and tradeoffs

## 2026-04-04 - version 0.8.2

- moved changelog from ~/changelog/changelog.md to ~/CHANGELOG.md
- updated CI workflow: added lint step, PR trigger now covers `develop`, job renamed to `quality`
- added CI badge to README
- update readme
  - added "Key Technical Decisions" section (BFF auth, no-Apollo GraphQL, custom calendar, RUM pipeline, optimistic update testing)
  - added section for whats public vs what needs auth
  - replaced "Getting started" with a "Run locally" section

## 2026-04-04 - version 0.8.1

- added `vercel.json`
- update readme to indicate our live demo

## 2026-04-03 - version 0.8.0

- added testing infrastructure (108 tests in 7 files)
  - vitest, jsdom, Testing Library, MSW node server
  - `npm test`, `npm run test:watch`, `npm run test:coverage`
    - `src/lib/__tests__/rateLimit.test.ts` — fixed-window rate limiter: allow/block/reset, IP isolation, bucket isolation
    - `src/lib/__tests__/calendar.test.ts` — calendar pure functions: `eventsForDay`, `allDayEventsForDay`, `spanningEventsForDay`, `singleDayTimedEventsForDay`, `layoutDayEvents` (overlap algorithm), `formatHeading`, `formatHour`
    - `src/lib/__tests__/vitals.test.ts` — `formatValue` (ms/s/CLS decimal), `getRatingColor` (all three thresholds across all five metrics)
    - `src/lib/__tests__/tcg.test.ts` — `typeStyle` (known/unknown/case-sensitive), `toPlain` (strips circular SDK refs)
    - `src/lib/__tests__/proxy.test.ts` — rate-limit rule matching, first-match-wins ordering, fallback bucket
    - `src/hooks/__tests__/useCalendarEvents.test.tsx` — fetch, SSR seed, error state, create/update/delete with optimistic updates and rollback
    - `src/hooks/__tests__/useCountdowns.test.tsx` — pagination flattening, hasNextPage, fetchNextPage, create/update/delete with optimistic updates and rollback
- optimistic update tests use MSW delay() on server response, then assert cache change appears before network responds, proving optimistic state
- CI workflow `.github/workflows/ci.yml` that runs typecheck and full test suite on every push to `main` or `develop` branches. Fails block Vercel deployment

## 2026-03-31 - version 0.7.7

- add `useCountUp` hook with ease-out cubic easing via RAF, respects `prefers-reduced-motion`
- matchup card scores now animate up from zero when data loads
- add fantasy points column to the Player Stats table
- rediction table scrolls horizontally on mobile, FantasyNav scrolls instead of wrapping, week arrows and nav links meet 44px touch targets
- accessibility update so that theres `aria-live="polite"` on main content areas, `aria-label` on compare toggle and nav, `role` attributes on nav
- add Fantasy Matchups and Court Vision cards to the feature hub with mini preview components

## 2026-03-31 - version 0.7.6

- add Predictions Panel below the matchup grid with a team selector in the toolbar
- Start/Sit recommendations show each player's real NBA games for the week with per-game and weekly projections derived from ESPN season averages
- injury status (OUT, DTD, Questionable, Doubtful) discounts projections and shows inline badges, OUT players project to 0
- Waiver Wire pulls actual free agents from ESPN (not rostered players), sorted by per-game average with games-this-week count
- Weekly Outlook blends league rank and projected roster totals into a star rating, shows head-to-head projection comparison
- new `/api/nba/schedule` route fetches the NBA game schedule for a date range, `/api/nba/freeagents` returns top unrostered players

## 2026-03-30 - version 0.7.5

- add Court Vision page at `/fantasy/nba/court-vision` with an SVG half-court and shooting zones
- zone colors go cold-to-hot by FG%: blue (<35%), yellow (35-48%), red (>48%), with hover tooltips and a staggered fade-in via Framer Motion
- zone stats table below the court with FG%, FGM, FGA, and attempts per game

## 2026-03-30 - version 0.7.4

- add player comparison radar chart on the Player Stats page. two-player selector with a recharts RadarChart, normalized to 0-100 against league averages and a raw stat comparison table

## 2026-03-30 - version 0.7.3

- add ESPN fantasy matchup page at `/fantasy/nba/matchups` with head-to-head weekly view
- playoff weeks are derived from `matchupPeriodCount` in ESPN schedule settings and labeled in the dropdown and as a badge above the grid
- proxy route at `/api/nba/scoreboard/[season]` calls ESPN scoreboard API with 1hr CDN cache
- add shared `FantasyNav` tab bar across all three ESPN fantasy pages (Matchups, League History, Player Stats)
- replace plain text loading state in League History with a skeleton card grid matching the loaded layout

## 2026-03-30 - version 0.7.1

- add live landing page weather background that detects location via IP and renders a canvas effects (rain, clear, storm, snow, partly cloudy, fog). geo lookups go through the backend and are cached per IP
- menu shows current city and conditions, with a toggle to disable effects and a manual weather override
- weather canvas pauses its RAF loop when off-screen via IntersectionObserver to save CPU
- snow and cloud effects pre-render sprites at init instead of allocating gradients per frame
- fixed localStorage hydration flash for weather toggle with lazy useState initializers
- wave simulation in waveSim.ts used by both WaterRipple and rain effect

## 2026-03-26 - version 0.7.0

- error shape is now consistent across all routes: `{ error: string }` with an appropriate HTTP status, never 200 with empty data masking a failure

## 2026-03-26 - version 0.6.9

- validate `season` dynamic route param in `/api/nba/league/[season]`
- validate `origin` query param in `/api/google/auth/url`, reject non-URLs and anything that isn't http/https so it can't be used for open redirect
- validate `cursor` query param in `/api/calendar/countdowns` — rejects strings that don't look like a cursor token

## 2026-03-26 - version 0.6.8

- add helper that combines Content-Length header check, JSON parsing with error handling, post-parse byte check for chunked encoding, and Zod schema validation into one call
- all 10 calendar POST/PUT routes now respond to oversized bodies get with 413 before auth work or backend calls happen
- `/api/graphql` and `/api/vitals` routes get inline size guards, capping at at 4 KB (tiny metric payloads), graphql at 64 KB

## 2026-03-26 - version 0.6.7

- added thoughts page for improvements
- added in-memory fixed-window rate limiter, mspped by route and IP, prunes stale entries every 60 seconds
- add the rate limiting into `src/proxy.ts` before auth and session checks
- blocked requests return 429 with `Retry-After` and `X-RateLimit-*` headers

## 2026-03-26 - version 0.6.6

- fixed 11 pre-existing lint errors

## 2026-03-24 - version 0.6.5

- validate api/graphql responses with response schemas
- fetches api helpers now use Zod response schemas
- invalid requests return more detailed error details, with backend responses validated at runtime

## 2026-03-24 - version 0.6.5

- added CTAs to all public landing page sections linking to their respective routes (NBA Stats, Pokémon TCG, GraphQL Pokédex, Ketsup); auth-required sections (Calendar, Web Vitals) show "Log in to view →" instead
- `FeaturesSection` cards are now clickable links for all public features; auth-required cards redirect to `/calendar` or `/auth/login` and the middleware handles the bounce
- `/calendar` added to protected routes in `src/proxy.ts` — unauthenticated requests redirect to `/auth/login?returnTo=/calendar`
- `FeaturesSection.FeatureCard` updated to handle `/auth/` paths with full-page `<a>` navigation instead of Next.js `<Link>`
- all cards in the "What I Built" section are now equal height via `h-full` on the card and link wrappers
- landing page `HeaderMenu` now uses `showLogin` prop instead of `ThemeToggle`

## 2026-03-24 - version 0.6.4

- added Ketsup as a feature across the app:
  - `src/app/landing/KetsupSection.tsx` — new landing page section with mock UI and CTA linking to ketsup.paulsumido.com
  - `src/app/FeatureHub.tsx` — added `ketsup` to `FEATURES` (external href, thoughtsHref), `KetsupPreview` mini-preview component, `FEATURE_TOKEN`, `PREVIEW_MAP`, and `THOUGHTS`
  - `src/app/thoughts/ketsup/page.tsx` + `KetsupContent.tsx` — new thoughts page with summary and chat views
  - `src/styles/tokens.css` — added `--color-feature-ketsup: #f9a8d4`
  - `FeatureCard` in `FeatureHub.tsx` now opens external hrefs in a new tab via `<a target="_blank">` instead of Next.js `<Link>`
- added `KetsupSection` to `LandingContent.tsx`

## 2026-03-24 - version 0.6.3

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
