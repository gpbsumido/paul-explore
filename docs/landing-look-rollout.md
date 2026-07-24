# Plan: Roll the v3 landing look out to the rest of the app

## Goal

Make the whole app feel like it belongs to the same product as the v3 landing
page. Right now the landing (`/`) has a distinct, considered visual language —
ambient aurora background, glassy tinted cards, per-feature accent colours,
staggered motion — while the feature pages (calendar, operator, tcg, learn,
fantasy, vitals, thoughts) are comparatively flat and utilitarian. The goal is a
consistent look without a rewrite: extract the landing's visual language into a
small set of reusable primitives and tokens, then adopt them page by page.

## Context

What the landing look actually is, in code:

- **Ambient backdrop** — `src/app/v3/graph/GraphBackground.tsx`: a faint dotted
  grid plus two slow drifting aurora blobs, `pointer-events-none`, reduced-motion
  aware. This is what makes the landing feel "alive" behind the content.
- **Glassy tinted cards** — `FeatureCard` in `src/app/_shared/featureData.tsx`:
  `background: color-mix(in srgb, var(--color-feature-x) 6%, rgba(255,255,255,0.04))`,
  `backdrop-filter: blur(16px)`, a token-tinted 1px border, `rounded-2xl`. Each
  card is keyed to a per-feature accent token (`--color-feature-*` in
  `src/styles/tokens.css`).
- **Motion** — `reveal()` / `staggerContainer` / `cardFlipIn` (see
  `src/lib/animations.ts` and `src/app/landing/Section.tsx`): scroll/enter
  reveals with a small stagger, all gated by `useReducedMotion`.
- **Chrome** — the sticky `PageHeader` (breadcrumbs), and the v3 graph shell's
  glass pills for legend/hint/nav.
- **Tokens** — colour/spacing/radius come from `@paul-portfolio/tokens` +
  `src/styles/tokens.css`; dark mode via `data-theme`.

What the rest of the app looks like today (audit target): every page already
uses `PageHeader` and the shared tokens, so the *foundation* is consistent. What
differs is **surface treatment** (plain `bg-surface` cards/tables vs. the glass
tint), **no ambient background**, **accent colour usage** (feature pages don't
carry their feature's accent), and **inconsistent motion** (some pages animate,
most don't).

Non-goals: no palette change, no restructuring of page logic, no new
dependencies. This is a surface/coat-of-paint pass, incremental and reversible.

## Approach

1. **Codify, don't copy.** Pull the three landing ingredients — ambient
   background, glass surface, motion — into shared primitives so pages opt in
   with one wrapper/class instead of re-deriving `color-mix` strings. Candidates:
   - `AmbientBackground` (generalised from `GraphBackground`, accepts an accent
     so a page can tint its aurora to its feature colour).
   - A `.glass-card` surface — ideally promoted into `@paul-portfolio/css` as a
     component so it's the same treatment the design system already owns, with
     an app-level fallback if we don't want to cut a package release first.
   - A `PageShell` that composes `AmbientBackground` + `PageHeader` + a
     max-width motion container, so a feature page is `<PageShell accent="…">`.
2. **Pick the per-page accent from the feature's existing token.** `FEATURE_TOKEN`
   already maps each feature id to a `--color-feature-*`; reuse it so a page's
   accent matches its landing card automatically.
3. **Roll out in priority order**, most-visited / most-visual first, verifying
   each in the browser (light + dark, reduced-motion) before moving on.

## Increments

### 1. Audit + screenshots (baseline)
Capture each top-level surface in light and dark: `/`, `/operator`,
`/work-portfolio`, `/learn`, `/fantasy/nba`, `/calendar`, `/tcg/pokemon`,
`/graphql`, `/vitals`, `/thoughts` + a write-up. Note where each diverges from
the landing (surface, background, accent, motion). Output: a short table in this
plan's PR so the target is explicit.

### 2. Extract primitives — **in progress**
- **Done:** `AmbientBackground` (`src/components/AmbientBackground.tsx`) —
  accent-parameterised (`colorA`/`colorB`), reduced-motion aware — extracted from
  `GraphBackground`, which now just wraps it (proving the extraction, identical
  landing output).
- **Done:** the glass surface — `.glass-card` in `globals.css`: semi-transparent
  (so the ambient shows through, blurred), theme-aware via the surface/border
  tokens, and tintable toward an accent via `--glass-accent`. Applied to the
  Pokédex cards (`/graphql`) as the first full ambient + glass example.
- **Next:** an optional `PageShell` that composes background + header + motion
  container so pages are a one-liner, and rolling `.glass-card` onto the other
  pages' card surfaces.

### 3. Showcase pages (highest visual payoff, lowest risk) — **in progress**
`/operator`, `/work-portfolio`, `/learn`, `/fantasy/nba` (the new hub). These are
card/dashboard-heavy and already public, so the glass + ambient treatment lands
cleanly and there's no auth to stand up for verification.
- **Done (ambient):** `/operator` (violet/blue), `/learn` (green, replacing its
  ad-hoc dot grid), `/graphql` (teal), `/tcg/pokemon` (red/amber).
- **Done (glass):** the `/operator` store cards and the `/graphql` Pokédex cards
  now use `.glass-card`, so both have the full ambient + glass treatment.
- **Next:** `/vitals` (auth — verify while logged in), the `/fantasy/nba` hub and
  `/thoughts` (deferred: touched by the #214/#215/#216 stack, do after it merges
  to avoid conflicts), then the careful ones — `/work-portfolio` (full-bleed
  `overflow-hidden` layout) and `/calendar` (dense — ambient + accent chrome
  only, leave the grid/event surfaces alone).

### 4. Content/data pages — **started**
`/tcg/pokemon`, `/graphql`, `/vitals`, `/thoughts` index + write-ups.
- **Done:** `/graphql` (teal aurora, ambient behind the card grid).
- **Next:** `/tcg/pokemon`, `/vitals`, `/thoughts`. Here the
glass treatment applies to headers/cards but **tables and dense data keep plain
surfaces** for legibility — the ambient background + accented header does most of
the work. `ThoughtLayout` is one file, so all write-ups move together.

### 5. App-shell pages (most care)
`/calendar` and `/settings`. Calendar is dense and interaction-heavy; apply the
ambient background + accent chrome but leave the grid/event surfaces largely
alone so nothing regresses in the overlap layout or hit targets. Do this last.

### 6. Consistency pass
Sweep for one-off card styles that didn't go through the primitive, align
`rounded-*`/border/spacing, confirm reduced-motion everywhere, and re-run the
axe a11y e2e (contrast can regress when tinting surfaces).

## Decisions

- **Glass surface as a design-system component vs. app-only.** Preferred: add it
  to `@paul-portfolio/css` so it's shared and versioned like the other
  primitives — but that needs a package release before the app can consume it.
  Fallback: an app-level `.glass` utility now, promote later. Decide in step 2.
- **How far the tint goes on data-dense pages.** Cards/headers get glass; tables,
  calendar cells, and long text keep flat surfaces for contrast. Err toward
  legibility.
- **Accent source.** Reuse `FEATURE_TOKEN` (single source) rather than
  re-declaring accents per page.

## Risks

- **Contrast regressions** from tinting surfaces — mitigate by keeping text on
  flat surfaces where it's dense and re-running the axe scans (WCAG 2.1 AA is a
  standing requirement).
- **`backdrop-filter` GPU cost** stacking many glass cards — the landing already
  watches this; cap the number of simultaneously-blurred surfaces and prefer a
  single ambient blur behind flat cards on heavy pages.
- **Motion overload / reduced-motion** — every reveal must be gated; verify with
  `prefers-reduced-motion`.
- **Scope creep into layout changes** — this is a surface pass; resist
  restructuring page logic. If a page needs real layout work, split it out.
