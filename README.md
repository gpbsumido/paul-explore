# paul-explore

[![CI](https://github.com/gpbsumido/paul-explore/actions/workflows/ci.yml/badge.svg)](https://github.com/gpbsumido/paul-explore/actions/workflows/ci.yml)

A personal playground and portfolio — somewhere between a sandbox and a showcase. Built to explore ideas, try patterns I find interesting, and have something real to point at when talking to people about how I work.

**[Live site → paulsumido.com](https://paulsumido.com)** · **[Write-ups → /thoughts](https://paulsumido.com/thoughts)**

Every feature has a `/thoughts` write-up covering the architecture decisions behind it. The site is the source of truth for what everything does and why — this README covers how to run it and how it's put together.

---

## Features

Public (no login). Listed most-to-least prominent, matching the apps order across the site:

- [Landing](https://paulsumido.com/) — a three-reel slot machine over every feature and write-up (the v3 node-graph is still at `/?version=v3`)
- [Explore Toronto](https://paulsumido.com/world) — a walkable 3D low-poly downtown Toronto at night; WASD past the CN Tower and City Hall to exhibits that open every feature on this site
- [Work Portfolio](https://paulsumido.com/work-portfolio) — anonymized reconstructions of features from past projects
- [Design System](https://paulsumido.com/design-system) — live gallery of the shared `@paul-portfolio` primitives, tokens, and a props playground
- [Feature Flags](https://paulsumido.com/flags) — flag console where you describe a user and watch every flag decide what they see, live; targeting rules, sticky percentage rollouts, and an audit log over a deterministic engine
- [Fleet Operator](https://paulsumido.com/operator) — unattended-retail operator dashboard over a real Postgres-backed API; slot-by-slot auditable restocking with expiry and shrinkage reasons, scheduled promotions that report back against the period before them, per-store sales and tax, an interactive planogram, and every time bucket resolved in the store's own timezone
- [Learn](https://paulsumido.com/learn) — 14 interactive algorithm & frontend-pattern deep-dives
- [Craft](https://paulsumido.com/craft) — lead front-end traits, each expandable to the real work here that proves it
- [Pokémon](https://paulsumido.com/pokemon) — one hub for the [TCG browser](https://paulsumido.com/tcg/pokemon), [TCG Pocket](https://paulsumido.com/tcg/pocket) expansions, and the [GraphQL Pokédex](https://paulsumido.com/graphql)
- Fantasy NBA — [playoffs bracket](https://paulsumido.com/fantasy/nba/playoffs) (public leaderboard), [player stats](https://paulsumido.com/fantasy/nba/player/stats), [league history](https://paulsumido.com/fantasy/nba/league-history), [court vision](https://paulsumido.com/fantasy/nba/court-vision), [matchups](https://paulsumido.com/fantasy/nba/matchups)
- [Particle Lab](https://paulsumido.com/lab/particles) · [Motion Lab](https://paulsumido.com/lab/motion) — R3F and Framer Motion experiments
- [Thoughts](https://paulsumido.com/thoughts) — write-ups on design decisions
- [Web Vitals](https://paulsumido.com/vitals) — real-user Core Web Vitals dashboard; site-wide, non-personal aggregate data, public (no login)

Requires login (redirected to Auth0 by the middleware):

- [Calendar](https://paulsumido.com/calendar) — personal calendar (per-user) with Google Calendar sync; includes events and countdowns
- [Settings](https://paulsumido.com/settings)

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
| Charts        | unovis (`@unovis/react`)                            |
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

```env
AUTH0_SECRET=            # openssl rand -hex 32
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=         # from Auth0 application settings
AUTH0_CLIENT_SECRET=     # from Auth0 application settings
AUTH0_AUDIENCE=https://portfolio-api
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Operator dashboard writes. Must match OPERATOR_SERVICE_TOKEN in portfolio_api.
# Server-side only, deliberately not NEXT_PUBLIC_ -- the browser never sees it,
# because the BFF calls the API on the visitor's behalf. Generate with:
#   openssl rand -hex 32
# Unset on both sides is fine locally. Set on one side only and every restock
# 401s while reads carry on, which looks like a partial outage rather than a
# config mistake, so set both or neither.
OPERATOR_SERVICE_TOKEN=
```

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

| Layer       | Platform                | URL                |
| ----------- | ----------------------- | ------------------ |
| Frontend    | Vercel + Cloudflare CDN | paulsumido.com     |
| Backend API | Railway                 | api.paulsumido.com |
| Auth        | Auth0                   | (managed)          |
| Database    | PostgreSQL on Railway   | (internal)         |

CI runs on GitHub Actions — lint, typecheck, and full test suite on every push to `main`/`develop` and on PRs. A failing check blocks the Vercel deploy.

---

## Project structure

```
src/
├── app/
│   ├── api/             # BFF proxy routes (calendar, nba, tcg, vitals, flags)
│   ├── calendar/        # Calendar page, events list + detail, countdowns
│   ├── fantasy/nba/     # League history, player stats, playoffs bracket
│   ├── flags/           # Feature-flag console (test a user, live per-flag verdicts)
│   ├── lab/             # Interactive experiments (particles, motion)
│   ├── learn/           # Algorithm & frontend-pattern deep-dives
│   ├── operator/        # Operator dashboard (fleet overview + store detail tabs)
│   ├── tcg/             # Pokémon TCG browser
│   ├── work-portfolio/  # Anonymized feature reconstructions
│   └── thoughts/        # Write-ups on design decisions
├── components/          # Shared UI primitives + calendar components
├── hooks/               # useCalendarEvents, useCalendars, useCountdowns, useDebounce, …
├── lib/                 # Shared utilities (calendar/TCG helpers, auth0 client, backendFetch)
├── styles/              # Design tokens
└── types/               # TypeScript types
```

---

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for a running log of changes/additions.
