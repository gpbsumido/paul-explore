# paul-explore

A personal playground and portfolio — somewhere between a sandbox and a showcase. Built to explore ideas, try patterns I find interesting, and have something real to point at when talking to people about how I work.

**[Live demo →](http://localhost:3000)** _(spin it up locally — instructions below)_

---

## What's inside

### 🔐 Auth & Security

Auth0 integration wired into a custom Next.js middleware proxy. Protected routes redirect unauthenticated users to login. CSP headers are generated per-request with nonces so inline scripts stay locked down without breaking `next/script`. The `/api/` paths are explicitly set to be public so API routes don't trigger auth redirect.

### 🎨 Design System

Started from scratch with a token-driven palette in `src/styles/tokens.css`. Tailwind v4's `@theme` block bridges those tokens into utility classes so both systems share a single source of truth. Dark mode using custom `ThemeProvider` and `useSyncExternalStore` — defaults to OS preference, persists manual overrides to localStorage, no flash on load. A few reusable primatives are used.

### 🏀 NBA Stats

Live player stats pulled through a Next.js API proxy (`/api/nba/...`) that keeps the CSP `connect-src 'self'` intact. Stats load in batches with skeleton rows so the table feels alive while data comes in. Each player row handles its own error state independently — if a fetch fails (NBA API rate limits are real), the row shows an error state.

### 🏆 Fantasy League History

ESPN fantasy league data by season. Teams sort by final standings, expand to show their full roster with positions. Season selector spans back to the league's first year. Glassmorphism card design because I wanted to try it and the gradient background made it work.

---

## Tech stack

| Layer     | Choice                              |
| --------- | ----------------------------------- |
| Framework | Next.js 16 (App Router)             |
| Language  | TypeScript                          |
| Styling   | Tailwind CSS v4 + custom CSS tokens |
| Auth      | Auth0 (`@auth0/nextjs-auth0`)       |
| Runtime   | React 19                            |
| Linting   | ESLint (Next.js config)             |

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
│   ├── api/nba/          # API proxy routes (currently only utlizes NBA calls from portfolio_api)
│   ├── fantasy/nba/      # Fantasy league history + player stats pages
│   ├── landing/          # Landing page with preview
│   ├── protected/        # Auth-gated hub page
│   └── thoughts/         # Write-ups on design decisions (styling, search, landing)
├── components/           # Shared layout + UI primitives (Button, Input, Modal)
├── lib/                  # utils
├── styles/               # Design tokens
└── types/                # TypeScript types
```

---

## Things I learned / found interesting

- Tailwind v4's `@theme` block is actually a clean way to bridge CSS custom properties into utility classes — one token file, two systems
- `useSyncExternalStore` is underused for things like theme preference — avoids the hydration mismatch that `useState` + `useEffect` creates
- Next.js middleware for auth is straightforward until CSP nonces get involved — the nonce has to flow from the middleware through to the layout server component via request headers
- Per-row error states in a data table feel much better UX-wise than a single top-level error banner that wipes the whole table

---

## Changelog

See [`src/changelog/changelog.md`](src/changelog/changelog.md) for a running log of changes/additions.
