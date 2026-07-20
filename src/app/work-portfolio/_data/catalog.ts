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
    id: "ops-console",
    name: "Ops Console",
    blurb:
      "An internal operations console for the data pipeline: streaming topics, consumer groups, scripts, and company metrics.",
    stack: "React, react-router 7, MUI 6, ECharts",
    accent: { accent: "#f59e0b", surface: "rgba(245,158,11,0.08)", font: "mono" },
    cutFeatures: ["theme toggle", "avatar menu"],
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
      did: "Create, edit, and track content campaigns with dedicated create and edit routes and a campaign detail view.",
      stack: "Next.js app router, MUI forms, Redux store",
      mocked: "The list and forms are real UI; persistence is an in-memory mock store.",
    },
  },
  {
    slug: "post-queue",
    projectId: "content-engine",
    title: "Post Queue & Calendar",
    tagline: "Scheduled content pipeline",
    icon: "🗓️",
    explainer: {
      did: "A queue of scheduled posts with a calendar view, so teams could see and reorder what ships when.",
      stack: "Next.js, MUI date pickers, Redux",
      mocked: "Drag-to-reorder works; the schedule data is static mock content.",
    },
  },
  {
    slug: "community-mode",
    projectId: "content-engine",
    title: "Community Mode",
    tagline: "Posts, replies, community analytics",
    icon: "💬",
    explainer: {
      did: "A community feed with per-post pages, settings, and a small analytics view for engagement.",
      stack: "Next.js dynamic routes, MUI",
      mocked: "Feed and detail views are real; engagement numbers are generated.",
    },
  },
  {
    slug: "character-sheets",
    projectId: "content-engine",
    title: "Character Sheets",
    tagline: "Game character profiles",
    icon: "🎭",
    explainer: {
      did: "Editable character sheets for game characters used in content, with a dedicated sheet editor route.",
      stack: "Next.js, MUI form components",
      mocked: "Edits apply locally to a mock character.",
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
      did: "A documented library of 17 chart components: cohort retention, conversion funnel, gauge, Pareto, word cloud, ranked table, time series with KPI, and more.",
      stack: "ECharts wrapped in typed React components, one markdown doc per chart",
      mocked: "Charts are rebuilt on this site's chart stack with generated data; the originals used ECharts.",
    },
  },
  {
    slug: "standard-analytics",
    projectId: "analytics-suite",
    title: "Standard Analytics",
    tagline: "Game, web, and on-chain sections",
    icon: "📈",
    explainer: {
      did: "Prebuilt analytics sections split by domain: game, web, on-chain, and a sandbox area.",
      stack: "Next.js route groups, embedded BI dashboards",
      mocked: "Tabs and KPIs are real UI; the BI embeds are replaced with local charts.",
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
      did: "A multi-step driver signup keyed by driver id, carrying campaign attribution from the landing link through completion.",
      stack: "Next.js 16, Tailwind, route handlers",
      mocked: "Validation and steps are real; submissions land in memory, not an API.",
    },
  },
  {
    slug: "realtime-metrics",
    projectId: "driver-onboarding",
    title: "Real-time Dashboard",
    tagline: "Live campaign analytics",
    icon: "⚡",
    explainer: {
      did: "A campaign analytics dashboard that refreshed live as signups came in.",
      stack: "Next.js, Recharts, polling API route",
      mocked: "The tick is a local interval instead of a polling API; the chart is real.",
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
      did: "Dedicated analytics pages per client game title, each with its own layout and metrics.",
      stack: "Next.js pages router, ECharts, MUI",
      mocked: "Titles are renamed to Game A, B, C; the switcher reskins one dashboard.",
    },
  },
  {
    slug: "economy-health",
    projectId: "portal-v1",
    title: "Economy & Financial Health",
    tagline: "Token economy KPI views",
    icon: "💹",
    explainer: {
      did: "Economy, payments, financial health, and comparative analytics pages for game economies.",
      stack: "Next.js, ECharts, MUI",
      mocked: "KPI values and comparisons are generated series.",
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
      did: "Administration for organizations, users, analytics configs, custom dashboards, API keys, and cache.",
      stack: "Next.js 15, MUI 7, Redux",
      mocked: "Tables and the key reveal/copy flow are real; the data is fixture content.",
    },
  },
  {
    slug: "ai-content-engine",
    projectId: "platform-console",
    title: "AI Content Module",
    tagline: "Assisted content generation",
    icon: "✨",
    explainer: {
      did: "An AI-assisted content generation module inside the platform shell.",
      stack: "Next.js, streaming responses",
      mocked: "Responses are canned and streamed locally, no model behind it.",
    },
  },
  // Ops Console
  {
    slug: "streaming-ops",
    projectId: "ops-console",
    title: "Streaming Ops",
    tagline: "Topics, consumers, scripts",
    icon: "🖥️",
    explainer: {
      did: "Managed streaming topics and consumer groups, ran maintenance scripts, and charted company metrics.",
      stack: "React, react-router, ECharts",
      mocked: "Topic lag and script output are simulated.",
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
      did: "A small game built for a conference booth, later wrapped as a web embed inside the analytics portal.",
      stack: "Unity project, WebGL embed wrapper page",
      mocked: "This is a faux frame showing the embed pattern; the real build is not shipped here.",
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
      did: "One catch-all route rendered many public game dashboards purely from slug config.",
      stack: "Next.js catch-all routes, config-driven rendering",
      mocked: "The slug picker reshapes one local dashboard from JSON config.",
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
      did: "Wallet connect plus an inventory of on-chain game assets with metadata from a GraphQL indexer.",
      stack: "ethers.js, wallet-connect modal, GraphQL",
      mocked: "The wallet is fake and the assets are fixtures; no chain calls.",
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
      did: "Create and edit user-acquisition campaigns with configurable reward and targeting fields.",
      stack: "CRA, MUI forms",
      mocked: "The live preview card is real; saving is local.",
    },
  },
  {
    slug: "referral-links",
    projectId: "ua-referrals",
    title: "Referral Links",
    tagline: "Affiliate links and tracking",
    icon: "🔁",
    explainer: {
      did: "Public referral landing links and affiliate registration, with click tracking into campaigns.",
      stack: "CRA, public routes, tracking endpoints",
      mocked: "Link generation and the copy flow are real; the click counter is simulated.",
    },
  },
  {
    slug: "auth-flows",
    projectId: "ua-referrals",
    title: "Auth Flows",
    tagline: "Login, recovery, verification",
    icon: "🪪",
    explainer: {
      did: "Full identity flows against a hosted identity provider: login, registration, recovery, verification, plus a wallet-passport login option.",
      stack: "Hosted-identity SDK, CRA public routes",
      mocked: "Presented as a stepper walkthrough of the screens; nothing authenticates.",
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
      did: "A drag-and-drop dashboard builder with a widget grid and a visual chart designer.",
      stack: "Gridstack layout engine, ECharts, MUI",
      mocked: "The grid is rebuilt with CSS grid and framer-motion instead of the layout engine.",
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
      did: "Look up any wallet address and browse an overview, NFT holdings, and transaction history in tabs.",
      stack: "TanStack Query, data-grid tables, chain data API",
      mocked: "Addresses resolve to fixture wallets; loading and empty states are real.",
    },
  },
  {
    slug: "email-campaigns",
    projectId: "portal-v2",
    title: "Email Studio",
    tagline: "Template builder and campaigns",
    icon: "✉️",
    explainer: {
      did: "Marketing tooling: a block-based email template builder, campaign tables, audiences, and message-of-the-day campaigns.",
      stack: "React, MUI, block editor",
      mocked: "The composer preview is real; sending and audiences are fixtures.",
    },
  },
  {
    slug: "workflow-editor",
    projectId: "portal-v2",
    title: "Workflow Editor",
    tagline: "Hooks as a node graph",
    icon: "🕸️",
    explainer: {
      did: "Project automation: hooks and workflows edited in a node-graph editor with an embedded code editor.",
      stack: "Node-graph library, embedded code editor, React",
      mocked: "The graph is a hand-built SVG mock and the code pane is read-only.",
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
      did: "An LLM chat demo and an agents portal inside the analytics product.",
      stack: "React chat UI, streaming backend",
      mocked: "Responses are canned and streamed locally, tool-call rows included.",
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
