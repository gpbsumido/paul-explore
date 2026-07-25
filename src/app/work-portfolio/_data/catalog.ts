import type { WorkProject, WorkFeature } from "./types";

// Everything here is anonymized on purpose. These were real production apps,
// but employer and client names stay out of the public bundle. A unit test
// scans this directory for a banned-name list so a slip can't ship.

export const PROJECTS: WorkProject[] = [
  {
    id: "content-engine",
    name: "Content Engine",
    blurb:
      "A content creation and scheduling app for game communities: campaigns, post queues, and community analytics in one place.",
    stack: "Next.js 15, MUI, Redux Toolkit",
    accent: { accent: "#e879f9", surface: "rgba(232,121,249,0.08)", font: "sans" },
    cutFeatures: ["notification settings", "chat-platform connection guide"],
  },
  {
    id: "analytics-suite",
    name: "Analytics Suite",
    blurb:
      "The analytics frontend for a gaming data platform, with a large reusable chart library and embedded BI dashboards.",
    stack: "Next.js 15, ECharts, BI embeds, Redux",
    accent: { accent: "#38bdf8", surface: "rgba(56,189,248,0.08)", font: "mono" },
    cutFeatures: ["sandbox analytics", "custom analytics builder"],
  },
  {
    id: "driver-onboarding",
    name: "Driver Onboarding",
    blurb:
      "A take-home project: gig-driver signup with campaign attribution plus a live campaign analytics dashboard.",
    stack: "Next.js 16, Recharts, Tailwind",
    accent: { accent: "#34d399", surface: "rgba(52,211,153,0.08)", font: "sans" },
    cutFeatures: [],
  },
  {
    id: "portal-v1",
    name: "Analytics Portal v1",
    blurb:
      "First generation of a web3 game analytics portal: per-title dashboards for studios plus economy and financial views.",
    stack: "Next.js 13 (pages router), MUI 5, ECharts",
    accent: { accent: "#818cf8", surface: "rgba(129,140,248,0.08)", font: "mono" },
    cutFeatures: ["custom data extracts", "DAO views", "admin tools"],
  },
  {
    id: "platform-console",
    name: "Platform Console",
    blurb:
      "The platform shell around the analytics products: org administration, API keys, user management, and an AI content module.",
    stack: "Next.js 15, MUI 7, Redux",
    accent: { accent: "#f472b6", surface: "rgba(244,114,182,0.08)", font: "sans" },
    cutFeatures: ["cache administration", "email verification gate"],
  },
  {
    id: "game-demo",
    name: "Conference Game Demo",
    blurb:
      "A small game built in a game engine for a conference booth, later embedded in the analytics portal as a web demo.",
    stack: "Unity, WebGL embed wrapper",
    accent: { accent: "#22d3ee", surface: "rgba(34,211,238,0.08)", font: "mono" },
    cutFeatures: [],
  },
  {
    id: "public-dashboards",
    name: "Public Dashboards",
    blurb:
      "Publicly shareable game dashboards driven entirely by slug config, one catch-all route rendering many dashboards.",
    stack: "Next.js 13, MUI 5, Redux",
    accent: { accent: "#a3e635", surface: "rgba(163,230,53,0.08)", font: "sans" },
    cutFeatures: [],
  },
  {
    id: "gamer-hub",
    name: "Web3 Gamer Hub",
    blurb:
      "A gamer-facing app for a web3 gaming ecosystem: wallet login, on-chain asset inventory, and player profiles.",
    stack: "CRA, ethers.js, wallet connect, GraphQL, Tailwind",
    accent: { accent: "#c084fc", surface: "rgba(192,132,252,0.08)", font: "sans" },
    cutFeatures: ["player search", "profile editing"],
  },
  {
    id: "ua-referrals",
    name: "UA & Referrals",
    blurb:
      "User-acquisition tooling: referral campaigns, affiliate links, public landing pages, and identity-provider auth flows.",
    stack: "CRA, MUI, ECharts + chart.js, ethers.js, hosted-identity auth",
    accent: { accent: "#fb7185", surface: "rgba(251,113,133,0.08)", font: "sans" },
    cutFeatures: ["admin dashboard", "SDK integration page", "early access gate"],
  },
  {
    id: "portal-v2",
    name: "Analytics Portal v2",
    blurb:
      "Second generation of the analytics portal, grown into a full product suite: dashboard designer, wallet lookup, marketing tools, workflow editors, and an LLM assistant.",
    stack:
      "React, MUI + data-grid pro, TanStack Query, ECharts, node-graph editor, code editor",
    accent: { accent: "#60a5fa", surface: "rgba(96,165,250,0.08)", font: "sans" },
    cutFeatures: [
      "redemption codes",
      "offer wall",
      "points system",
      "support tickets",
      "social and announcement management",
      "style guide",
    ],
  },
];

export const FEATURES: WorkFeature[] = [
  // Content Engine
  {
    slug: "campaign-manager",
    projectId: "content-engine",
    title: "Campaign Manager",
    tagline: "CRUD flows for content campaigns",
    icon: "📣",
    explainer: {
      did: "The content team's home base: create, edit, and track marketing campaigns. I rebuilt the create flow as a progressive-disclosure wizard (basics, then schedule and targeting, then review) so a dense form never hits you all at once, and added a live store inspector that shows the Redux-style state and dispatched actions updating in real time as you work.",
      stack: "Next.js app router, MUI forms, Redux Toolkit store",
      mocked: "The multi-step create modal and the live action/state inspector are fully real; persistence is an in-memory store instead of the production API.",
    },
  },
  {
    slug: "post-queue",
    projectId: "content-engine",
    title: "Post Queue & Calendar",
    tagline: "Scheduled content pipeline",
    icon: "🗓️",
    explainer: {
      did: "A pipeline for scheduled posts. I rebuilt it as a kanban board (backlog, scheduled, published) with real drag-and-drop between columns and a click-to-edit modal, while the week strip recomputes its per-day counts as cards move. The interesting part was keeping drag state, column state, and the calendar counts in sync.",
      stack: "Next.js, MUI date pickers, Redux",
      mocked: "The dnd-kit board and the edit modal are real; the seed posts are static fixture content.",
    },
  },
  {
    slug: "community-mode",
    projectId: "content-engine",
    title: "Community Mode",
    tagline: "Posts, replies, community analytics",
    icon: "💬",
    explainer: {
      did: "A community feed with per-post threads. You can open a compose modal to add a post, reply inline so replies nest under their parent, watch likes tick up in real time, and open an analytics modal that derives engagement over time from the post's own numbers.",
      stack: "Next.js dynamic routes, MUI",
      mocked: "Posting, replying, the live like counter, and the analytics modal are real; the underlying engagement figures are generated.",
    },
  },
  {
    slug: "character-sheets",
    projectId: "content-engine",
    title: "Character Sheets",
    tagline: "Game character profiles",
    icon: "🎭",
    explainer: {
      did: "Editable profiles for the game characters that show up in content. The rework is a stepped create flow (identity, class, then a stat-budget allocator) where the budget logic caps how many points you can spend, so you can't build an illegal character. New sheets append to a roster.",
      stack: "Next.js, MUI form components",
      mocked: "The stepper, the enforced stat budget, and the roster are real; everything lives in local state.",
    },
  },
  // Analytics Suite
  {
    slug: "chart-library",
    projectId: "analytics-suite",
    title: "Chart Library",
    tagline: "17 reusable analytics charts",
    icon: "📊",
    flagship: true,
    explainer: {
      did: "A documented library of 17 chart types (cohort retention, conversion funnel, gauge, Pareto, word cloud, ranked table, time series with KPI, and more). Here they all render off one shared seed with a reroll, each chart opens a settings modal to change type, series, palette, and options live, and a fixed focus mode pages through them full-size. The skill on show is a consistent, configurable chart API across very different chart shapes.",
      stack: "ECharts wrapped in typed React components, one markdown doc per chart",
      mocked: "All 17 charts, the per-chart settings, the custom tooltip, and focus-mode paging are real, rebuilt on this site's chart stack with generated data; the originals used ECharts.",
    },
  },
  {
    slug: "standard-analytics",
    projectId: "analytics-suite",
    title: "Standard Analytics",
    tagline: "Game, web, and on-chain sections",
    icon: "📈",
    explainer: {
      did: "Prebuilt analytics split by domain (game, web, on-chain). I replaced the static sections with interactive charts plus date-range and segment filters that actually recompute the series, so the page responds to the questions you ask of it rather than just displaying a snapshot.",
      stack: "Next.js route groups, embedded BI dashboards",
      mocked: "The charts and filters are real and recompute locally; the production BI embeds are replaced with local charts.",
    },
  },
  // Driver Onboarding
  {
    slug: "signup-flow",
    projectId: "driver-onboarding",
    title: "Driver Signup Flow",
    tagline: "Multi-step signup with attribution",
    icon: "🚗",
    flagship: true,
    explainer: {
      did: "A take-home built into a multi-step gig-driver signup, keyed by driver id, that carries campaign attribution from the landing link all the way through completion. Each step validates before you advance, and the attribution chip persists across the whole flow.",
      stack: "Next.js 16, Tailwind, route handlers",
      mocked: "Per-step validation and the attribution carry-through are real; submissions land in memory, not an API.",
    },
  },
  {
    slug: "realtime-metrics",
    projectId: "driver-onboarding",
    title: "Real-time Dashboard",
    tagline: "Live campaign analytics",
    icon: "⚡",
    explainer: {
      did: "The companion dashboard for the signup take-home: campaign analytics that refresh live as new signups land, so you can watch acquisition move in near real time.",
      stack: "Next.js, Recharts, polling API route",
      mocked: "The chart is real; the live tick is a local interval instead of a polling API.",
    },
  },
  // Portal v1
  {
    slug: "per-game-analytics",
    projectId: "portal-v1",
    title: "Per-title Dashboards",
    tagline: "One dashboard per game",
    icon: "🎮",
    explainer: {
      did: "Per-title analytics for studios. I reworked it into a config-driven multi-title view with a compare mode that diffs two titles' KPIs side by side and shows the derived deltas. The point it demonstrates is one reusable config shaping many dashboards, rather than a hand-built page per game.",
      stack: "Next.js pages router, ECharts, MUI",
      mocked: "The compare mode and delta math are real and config-driven; titles are anonymized to Game A, B, C.",
    },
  },
  // Platform Console
  {
    slug: "admin-suite",
    projectId: "platform-console",
    title: "Admin Suite",
    tagline: "Orgs, users, API keys, configs",
    icon: "🔐",
    explainer: {
      did: "The platform's back office: organizations, users, analytics configs, API keys. I rebuilt it as a small CRUD console where you create each entity through a modal and wire up the relations between them (users to orgs, keys to owners, configs to orgs), with the tables and a local store staying in sync on both sides of each assignment.",
      stack: "Next.js 15, MUI 7, Redux",
      mocked: "Create flows, the assignment relations, and the key reveal/copy are real and persist locally; the seed data is fixture content.",
    },
  },
  {
    slug: "ai-content-engine",
    projectId: "platform-console",
    title: "AI Content Module",
    tagline: "Assisted content generation",
    icon: "✨",
    explainer: {
      did: "An AI-assisted content module in the platform shell. It generates copy with a streamed, token-by-token response, and a post-to-social action opens a confirm modal where you pick a character voice (hype announcer, grumpy veteran, lore keeper, meme lord) and the copy comes back restyled in that voice.",
      stack: "Next.js, streaming responses",
      mocked: "The streaming UI, confirm gate, and voice branching are real; the copy is canned, there is no model behind it.",
    },
  },
  // Conference Game Demo
  {
    slug: "game-demo",
    projectId: "game-demo",
    title: "Playable Game Demo",
    tagline: "Engine build embedded on the web",
    icon: "🕹️",
    explainer: {
      did: "A booth game later wrapped as a web embed in the analytics portal. Here the build screen actually loads to completion and drops into a small self-contained reflex minigame (tap the targets) with a timed round, a game-over screen, and a locally-saved best score, standing in for the original engine build.",
      stack: "Unity project, WebGL embed wrapper page",
      mocked: "The loading-to-playable flow and the canvas minigame are real; the original engine build is not shipped here.",
    },
  },
  // Public Dashboards
  {
    slug: "slug-dashboards",
    projectId: "public-dashboards",
    title: "Slug-driven Dashboards",
    tagline: "Config in, dashboard out",
    icon: "🔗",
    explainer: {
      did: "One catch-all route that rendered many public game dashboards purely from slug config. To make the idea legible I show the JSON config each slug renders from next to the result, and gave each slug its own tiles, chart type, and metric formatting, so switching slugs reshapes the whole dashboard rather than just recoloring it.",
      stack: "Next.js catch-all routes, config-driven rendering",
      mocked: "The slug picker, the read-only config panel, and the distinct per-slug layouts are real; the numbers are generated locally.",
    },
  },
  // Gamer Hub
  {
    slug: "nft-inventory",
    projectId: "gamer-hub",
    title: "Wallet & NFT Inventory",
    tagline: "On-chain assets in a grid",
    icon: "👛",
    explainer: {
      did: "Wallet login plus an on-chain asset inventory. This uses a real wallet connect (wagmi and RainbowKit): connect a browser wallet and it reads your actual address, ENS, and balance. Click an asset for a detail modal with attributes and a provenance timeline, or flip on transfer mode to drag NFTs between two wallet panes.",
      stack: "ethers.js and a wallet-connect modal originally; rebuilt on wagmi + viem + RainbowKit",
      mocked: "The wallet connect and the balance/ENS reads are real; the NFT grid is fixture data and the drag transfer is a visualization, not a chain transaction.",
    },
  },
  // UA & Referrals
  {
    slug: "ua-campaign-builder",
    projectId: "ua-referrals",
    title: "Campaign Builder",
    tagline: "Create and edit UA campaigns",
    icon: "🛠️",
    explainer: {
      did: "The builder for user-acquisition campaigns. I turned it into a stepped, disclosed flow (basics, targeting, review) gated on having a name, with a live preview card that persists and updates across every step so you always see the campaign taking shape.",
      stack: "CRA, MUI forms",
      mocked: "The stepped flow and the persisting live preview are real; saving is local.",
    },
  },
  {
    slug: "referral-links",
    projectId: "ua-referrals",
    title: "Referral Links",
    tagline: "Affiliate links and tracking",
    icon: "🔁",
    explainer: {
      did: "Referral links feeding campaign attribution. This one is genuinely wired to a small Express + Postgres service I built alongside the site: you create real links to paulsumido.com with server-side slug uniqueness, then see real click stats polled back with loading and empty states. A taken slug comes back as a friendly error.",
      stack: "CRA and public routes originally; here a typed client + react-query against a portfolio_api referrals service",
      mocked: "Link creation and click tracking are real HTTP calls; if the service is unreachable the demo degrades gracefully instead of breaking.",
    },
  },
  {
    slug: "auth-flows",
    projectId: "ua-referrals",
    title: "Auth Flows",
    tagline: "Login, recovery, verification",
    icon: "🪪",
    explainer: {
      did: "The full identity surface against a hosted provider: login, registration, recovery, verification, and a wallet-passport option. The fields are actually typeable with inline validation (email format, password length, matching confirm, six-digit code), presented as a walkthrough of the screens.",
      stack: "Hosted-identity SDK, CRA public routes",
      mocked: "The typeable fields and validation are real; nothing actually authenticates.",
    },
  },
  // Portal v2
  {
    slug: "dashboard-designer",
    projectId: "portal-v2",
    title: "Dashboard Designer",
    tagline: "Drag-and-drop dashboards",
    icon: "🧩",
    flagship: true,
    explainer: {
      did: "A drag-and-drop dashboard builder: compose a widget grid from a palette, then reorder and resize. I reworked the drag-drop on dnd-kit so a widget drops reliably into empty cells and earlier slots (the original gridstack behavior that was awkward to reproduce), and kept keyboard move and resize on buttons for accessibility.",
      stack: "Gridstack layout engine, ECharts, MUI",
      mocked: "The dnd-kit grid, reorder, and resize are real; the widget contents are generated.",
    },
  },
  {
    slug: "wallet-lookup",
    projectId: "portal-v2",
    title: "Wallet Lookup",
    tagline: "Overview, NFTs, transactions",
    icon: "🔎",
    flagship: true,
    explainer: {
      did: "Look up any wallet address and browse an overview, NFT holdings, and transaction history across tabs. The interesting work was the data-fetching shell: query keys per tab, and honest loading and empty states for a surface where any tab can be sparse.",
      stack: "TanStack Query, data-grid tables, chain data API",
      mocked: "The tabbed UI plus the loading and empty states are real; addresses resolve to fixture wallets.",
    },
  },
  {
    slug: "email-campaigns",
    projectId: "portal-v2",
    title: "Email Studio",
    tagline: "Template builder and campaigns",
    icon: "✉️",
    explainer: {
      did: "Marketing tooling built around a block-based email template builder next to a campaign table. The blocks are editable in place (heading, body, and button text type right in the preview) and image blocks import a local file straight to a data URL, so you compose a real template without a server round-trip.",
      stack: "React, MUI, block editor",
      mocked: "Inline block editing and local image import are real; the campaign table and audiences are fixtures.",
    },
  },
  {
    slug: "workflow-editor",
    projectId: "portal-v2",
    title: "Workflow Editor",
    tagline: "Hooks as a node graph",
    icon: "🕸️",
    explainer: {
      did: "Project automation edited as a node graph. It's an editable, hand-built SVG graph: drag nodes around, edit a node's label and config in place, and add or remove the connections between nodes. Building the drag and the edge model directly on SVG, rather than reaching for a graph library, was the fun constraint.",
      stack: "Node-graph library, embedded code editor, React",
      mocked: "Node dragging, in-place config editing, and add/remove edges are real; the starting graph is fixture data.",
    },
  },
  {
    slug: "llm-assistant",
    projectId: "portal-v2",
    title: "LLM Assistant",
    tagline: "Chat and agent portal",
    icon: "🤖",
    flagship: true,
    explainer: {
      did: "A chat and agents surface in the analytics product. It implements the full set of agent-UI patterns: an agent/chat mode toggle, a plan of steps that ticks off, a tool-call row that runs then completes, tokens that stream in, citation chips, and stop/retry controls. The value is the UI vocabulary for showing an agent's work, not any single answer.",
      stack: "React chat UI, streaming backend",
      mocked: "Every pattern is real UI; the responses are canned and streamed locally, there is no model.",
    },
  },
];

/** Look up a project by id. Catalog data is static so this can throw on a typo. */
export function projectFor(feature: WorkFeature): WorkProject {
  const project = PROJECTS.find((p) => p.id === feature.projectId);
  if (!project) throw new Error(`unknown projectId: ${feature.projectId}`);
  return project;
}

/** Find a feature index by slug, or null when the slug is unknown. */
export function featureIndexBySlug(slug: string): number | null {
  const i = FEATURES.findIndex((f) => f.slug === slug);
  return i === -1 ? null : i;
}
