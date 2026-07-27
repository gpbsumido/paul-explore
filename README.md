# paul-explore

[![CI](https://github.com/gpbsumido/paul-explore/actions/workflows/ci.yml/badge.svg)](https://github.com/gpbsumido/paul-explore/actions/workflows/ci.yml)

A personal playground and portfolio — somewhere between a sandbox and a showcase. Built to explore ideas, try patterns I find interesting, and have something real to point at when talking to people about how I work.

**[Live site → paulsumido.com](https://paulsumido.com)** · **[Write-ups → /thoughts](https://paulsumido.com/thoughts)**

Every feature has a `/thoughts` write-up covering the architecture decisions behind it. The site is the source of truth for what everything does and why — this README covers how to run it and how it's put together.

---

## Features

Public (no login):

- [Landing](https://paulsumido.com/) — a three-reel slot machine over every feature and write-up (the v3 node-graph is still at `/?version=v3`)
- [Fleet Operator](https://paulsumido.com/operator) — real-time fleet monitoring dashboard
- [Learn](https://paulsumido.com/learn) — 14 interactive algorithm & frontend-pattern deep-dives
- [Work Portfolio](https://paulsumido.com/work-portfolio) — anonymized reconstructions of features from past projects
- [Particle Lab](https://paulsumido.com/lab/particles) · [Motion Lab](https://paulsumido.com/lab/motion) — R3F and Framer Motion experiments
- [Pokémon TCG Browser](https://paulsumido.com/tcg/pokemon) · [GraphQL Pokédex](https://paulsumido.com/graphql)
- Fantasy NBA — [playoffs bracket](https://paulsumido.com/fantasy/nba/playoffs) (public leaderboard), [player stats](https://paulsumido.com/fantasy/nba/player/stats), [league history](https://paulsumido.com/fantasy/nba/league-history), [court vision](https://paulsumido.com/fantasy/nba/court-vision), [matchups](https://paulsumido.com/fantasy/nba/matchups)
- [Thoughts](https://paulsumido.com/thoughts) — write-ups on design decisions

Requires login (redirected to Auth0 by the middleware):

- [Calendar](https://paulsumido.com/calendar) — personal calendar (per-user) with Google Calendar sync; includes events and countdowns
- [Web Vitals](https://paulsumido.com/vitals) — real-user Core Web Vitals dashboard (site-wide data, visible to any signed-in user)
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
```

**4. Start the dev server**

```bash
pnpm dev
```

**5. Open [http://localhost:3000](http://localhost:3000)**

TCG browser, Pokédex, and the lab pages work immediately. Calendar and Vitals require a valid Auth0 session.

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
│   ├── api/             # BFF proxy routes (calendar, nba, tcg, vitals)
│   ├── calendar/        # Calendar page, events list + detail, countdowns
│   ├── fantasy/nba/     # League history, player stats, playoffs bracket
│   ├── lab/             # Interactive experiments (particles, motion)
│   ├── learn/           # Algorithm & frontend-pattern deep-dives
│   ├── operator/        # Fleet monitoring dashboard (overview + store detail)
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
