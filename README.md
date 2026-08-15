# paul-explore

[![CI](https://github.com/gpbsumido/paul-explore/actions/workflows/ci.yml/badge.svg)](https://github.com/gpbsumido/paul-explore/actions/workflows/ci.yml)

A personal playground and portfolio — somewhere between a sandbox and a showcase. Built to explore ideas, try patterns I find interesting, and have something real to point at when talking to people about how I work.

**[Live site → paulsumido.com](https://paulsumido.com)** · **[Write-ups → /thoughts](https://paulsumido.com/thoughts)**

Every feature has a `/thoughts` write-up covering the architecture decisions behind it. The site is the source of truth for what everything does and why — this README covers how to run it and how it's put together.

---

## Features

Public (no login). Listed most-to-least prominent, matching the apps order across the site:

- [Landing](https://paulsumido.com/) — the case for hiring me as a front-end lead: the craft matrix and its evidence, six featured apps, and the write-ups behind them
- [Discover](https://paulsumido.com/discover) — a three-reel slot machine over every feature and write-up, plus every landing page this site has had: the v4 slot machine and the v3 node graph are still live at `/discover?version=v4` and `?version=v3`, with v2 and v1 alongside them
- [Explore Toronto](https://paulsumido.com/world) — a walkable 3D low-poly downtown Toronto at night; WASD past the CN Tower and City Hall to exhibits that open the rest of the site
- [Work Portfolio](https://paulsumido.com/work-portfolio) — anonymized reconstructions of features from past projects
- [Design System](https://paulsumido.com/design-system) — live gallery of the shared `@paul-portfolio` primitives, tokens, and a props playground, plus this app's own motion primitives. The palette is Verdigris & Ember: a teal-green primary against an apricot secondary on warm neutrals, with theme-aware feature accents and Bricolage Grotesque on page titles
- [Research Explorer](https://paulsumido.com/research) — a tool for picking a vascular surgery research project: curated topics scored live against PubMed and Europe PMC, recent papers with links, demographic filters that show which populations the literature actually enrolled, and topics auto-derived from what the field is publishing now
- [Feature Flags](https://paulsumido.com/flags) — flag console where you describe a user and watch every flag decide what they see, live; targeting rules, sticky percentage rollouts, and an audit log over a deterministic engine
- [Fleet Operator](https://paulsumido.com/operator) — unattended-retail operator dashboard over a real Postgres-backed API; slot-by-slot auditable restocking with expiry and shrinkage reasons, scheduled promotions that report back against the period before them, per-store sales and tax, an interactive planogram, and every time bucket resolved in the store's own timezone
- [Learn](https://paulsumido.com/learn) — 14 interactive algorithm & frontend-pattern deep-dives
- [Craft](https://paulsumido.com/craft) — lead front-end traits, each expandable to the real work here that proves it
- [Pokémon](https://paulsumido.com/pokemon) — one hub for the [TCG browser](https://paulsumido.com/tcg/pokemon), [TCG Pocket](https://paulsumido.com/tcg/pocket) expansions, and the [GraphQL Pokédex](https://paulsumido.com/graphql)
- Fantasy NBA — [playoffs bracket](https://paulsumido.com/fantasy/nba/playoffs) (public leaderboard), [player stats](https://paulsumido.com/fantasy/nba/player/stats), [league history](https://paulsumido.com/fantasy/nba/league-history), [court vision](https://paulsumido.com/fantasy/nba/court-vision), [matchups](https://paulsumido.com/fantasy/nba/matchups)
- [Particle Lab](https://paulsumido.com/lab/particles) · [Motion Lab](https://paulsumido.com/lab/motion) — R3F and Framer Motion experiments
- [Gallery Wall](https://paulsumido.com/gallery-wall) — arrange framed prints on a wall to scale, save the layout, and get the hanging measurements out
- [Résumé](https://paulsumido.com/resume) — the CV, as a page rather than a PDF download
- [Thoughts](https://paulsumido.com/thoughts) — write-ups on design decisions
- [Web Vitals](https://paulsumido.com/vitals) — real-user Core Web Vitals dashboard; site-wide, non-personal aggregate data, public (no login)

Requires login (redirected to Auth0 by `src/proxy.ts`):

- [Calendar](https://paulsumido.com/calendar) — personal calendar (per-user) with Google Calendar sync; includes events and countdowns
- [Settings](https://paulsumido.com/settings)

Requires login **and** being on the admin allowlist:

- `/to-do` — what is still outstanding across both repos, with quick add, soft
  delete, and a per-item panel holding its revision history and comments.
  Reverting restores an earlier revision as a *new* one rather than discarding
  what came after, so the history only ever grows. Not linked from anywhere and
  it 404s rather than 403s for anyone else, because a 403 confirms a page
  exists. The rows live in the database rather than in either repo on purpose:
  both are public, and a list of what has not been fixed yet is not something to
  publish.

---

## Tech stack

| Layer         | Choice                                              |
| ------------- | --------------------------------------------------- |
| Framework     | Next.js 16 (App Router)                             |
| Language      | TypeScript                                          |
| Styling       | Tailwind CSS v4 + custom CSS tokens                 |
| Auth          | Auth0 (`@auth0/nextjs-auth0`)                       |
| Runtime       | React 19                                            |
| Animation     | Framer Motion (`framer-motion`)                     |
| 3D / WebGL    | Three.js + React Three Fiber (`@react-three/fiber`) |
| Data fetching | TanStack Query v5                                   |
| Charts        | Recharts (`recharts`)                               |
| Monitoring    | Vercel Speed Insights                               |
| Linting       | ESLint (Next.js config)                             |
| Bundle        | `@next/bundle-analyzer` (`pnpm analyze`)            |

---

## Run locally

Requires Node.js 22+ and pnpm. If you don't have pnpm, run `corepack enable pnpm` (ships with Node.js) or install it globally via `npm install -g pnpm`.

**1. Clone and install**

```bash
git clone https://github.com/gpbsumido/paul-explore.git
cd paul-explore
pnpm install
```

**2. Set up environment variables**

```bash
cp .env.example .env.local
```

**3. Fill in `.env.local`**

`.env.example` is the complete annotated list, and it is the source of truth —
every variable there carries a comment explaining what breaks without it. This
section deliberately does not repeat them, because two lists is how one
of them ends up wrong.

The minimum to boot and log in:

```env
AUTH0_SECRET=            # openssl rand -hex 32
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=         # from Auth0 application settings
AUTH0_CLIENT_SECRET=     # from Auth0 application settings
AUTH0_AUDIENCE=https://portfolio-api
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Everything else is optional, and each one turns a feature off rather than
breaking the app:

| Unset | What goes dark |
| ----- | -------------- |
| `OPERATOR_SERVICE_TOKEN` | Operator reads still work; every write 401s. Must match the API's — set on one side only and it looks like a partial outage rather than a config mistake |
| `FLAGS_SERVICE_TOKEN` | Open-tier flag writes reach only the in-memory store and spring back on the next read |
| `FLAG_ADMIN_ALLOWED_EMAILS` | Nobody can write admin-tier flags, and `/to-do` 404s for everyone |
| `RESEARCH_ASK_ALLOWED_EMAILS` | The ask box on `/research` is closed to everyone. Unset means nobody, not everybody |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | The ask box has nothing to ask |
| `ABLY_KEY` | `/world` presence falls back to a same-browser local transport |
| `NEXT_PUBLIC_MEDIA_ORIGIN` | Saved gallery walls render blank — the origin is on the CSP `img-src`, so the photos are blocked |
| `NEXT_PUBLIC_SITE_URL` | OG image URLs fall back to the production domain |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Wallet connection is unavailable |

**The admin allowlist has two different names.** It is
`FLAG_ADMIN_ALLOWED_EMAILS` here and `ADMIN_ALLOWED_EMAILS` in `portfolio_api`,
and both need the same addresses. Set one and not the other and `/to-do` renders
for you while every tick 403s at the API, which reads like a bug in the page.

**4. Start the dev server**

```bash
pnpm dev
```

**5. Open [http://localhost:3000](http://localhost:3000)**

TCG browser, Pokédex, Web Vitals, and the lab pages work immediately. Calendar and Settings require a valid Auth0 session.

The operator dashboard works without an account by design, and reads fall back to
seeded data when the API is unreachable so it stays usable offline. Writes need
`OPERATOR_SERVICE_TOKEN` to match the API's — a mismatch fails the write loudly
rather than falling back, since a restock that silently persists nothing is worse
than an error. The app-wide `visitor_id` cookie the proxy already mints is forwarded to the API
for per-visitor rate limiting and to attribute restock sessions; nothing about
the person goes into it, and signing in is optional.

---

## Deployment

| Layer       | Platform                | URL                        |
| ----------- | ----------------------- | -------------------------- |
| Frontend    | Vercel + Cloudflare CDN | paulsumido.com             |
| Frontend    | Vercel (`develop`)      | develop.paulsumido.com     |
| Backend API | Railway                 | api.paulsumido.com         |
| Auth        | Auth0                   | (managed)                  |
| Database    | PostgreSQL on Railway   | (internal)                 |

`main` deploys to `paulsumido.com`, `develop` to `develop.paulsumido.com`.

**Both point at the same production API.** There is no staging API, so anything
exercised on `develop.paulsumido.com` is acting on live data. That is fine for
reads and for a single-owner to-do list, and worth remembering before testing
anything destructive there.

CI runs on GitHub Actions as five jobs, each on the cadence its cost justifies,
not all of them on every push:

| Job | When |
| --- | ---- |
| Lint, Typecheck & Test | every push and PR |
| Integration tests | every push and PR, plus nightly |
| E2E smoke (public) | every push and PR |
| E2E & Accessibility full | nightly, or on demand before a release |
| Operator E2E against a real backend | builds `portfolio_api` from source, migrates it, and drives the operator flow against it |

A failing check blocks the Vercel deploy.

---

## Project structure

```
src/
├── proxy.ts             # The edge entry point. Next 16's renamed middleware:
│                        # Auth0 /auth/* delegation, session enforcement on
│                        # protected routes, per-route rate limiting, the
│                        # visitor cookie, and CSP headers on every response
├── app/
│   ├── api/             # BFF routes, 14 areas: ably, calendar, flags, geo,
│   │                    # google, graphql, me, nba, operator, research, tcg,
│   │                    # todos, vitals, walls
│   ├── _shared/         # Feature and thoughts registries shared by the hubs
│   ├── calendar/        # Calendar page, events list + detail, countdowns
│   ├── craft/           # Lead front-end traits, each linked to real work here
│   ├── design-system/   # Live gallery of the shared primitives and tokens
│   ├── dev/             # Skeleton previews, not linked from the site
│   ├── discover/        # The landing history, every version behind ?version=
│   ├── fantasy/         # NBA league history, player stats, playoffs bracket
│   ├── flags/           # Feature-flag console
│   ├── gallery-wall/    # Frame layout planner with hanging measurements
│   ├── graphql/         # GraphQL Pokédex
│   ├── lab/             # Interactive experiments (particles, motion)
│   ├── landing/         # Landing implementations behind ?version=
│   ├── learn/           # Algorithm & frontend-pattern deep-dives
│   ├── operator/        # Operator dashboard (fleet, finance, loss, planner…)
│   ├── pokemon/         # Hub over the TCG browser, Pocket, and the Pokédex
│   ├── research/        # Research Explorer
│   ├── resume/          # The CV as a page
│   ├── settings/        # Account settings (auth required)
│   ├── tcg/             # Pokémon TCG browser and Pocket expansions
│   ├── thoughts/        # Write-ups on design decisions
│   ├── to-do/           # Admin-only outstanding-work list
│   ├── v2/ v3/ v4/      # Earlier site designs, kept reachable
│   ├── vitals/          # Real-user Core Web Vitals dashboard
│   ├── work-portfolio/  # Anonymized feature reconstructions
│   └── world/           # Walkable 3D Toronto
├── components/          # Shared UI primitives + feature components
├── contexts/            # React contexts
├── hooks/               # useCalendarEvents, useCalendars, useDebounce, …
├── lib/                 # Shared utilities (auth0 client, backendFetch, schemas)
├── styles/              # Design tokens
└── types/               # TypeScript types
```

---

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for a running log of changes/additions.
