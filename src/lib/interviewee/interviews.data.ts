import type { Interview, IntervieweeTopic } from "./types";

/**
 * The deck, organised by job interview. This is the file to edit when I add an
 * interview or paste a fresh batch of prep notes: keep the shape, swap the
 * content. See TOPICS_TEMPLATE.md for the markdown format these transform from.
 *
 * Related ids resolve within an interview, so the same topic slug can mean
 * different things across two interviews.
 */

/** General, role-agnostic practice — the warm-up deck. */
const GENERAL_TOPICS: IntervieweeTopic[] = [
  {
    id: "system-design",
    title: "System Design",
    summary: "Reasoning about scale, storage, and the trade-offs I'd name out loud.",
    entries: [
      {
        question: "Walk me through designing a URL shortener.",
        points: [
          "Clarify scale first: reads dominate writes by orders of magnitude, so optimise the read path.",
          "Generate a short key (base62 of an id, or a hash) and store key to long URL.",
          "Put a cache in front of the lookup; the long URL for a key never changes, so it caches forever.",
        ],
        details: [
          "The write path is a single append: reserve an id, encode it, store the mapping. The read path is a cache hit that only falls through to the store on a cold key.",
        ],
      },
      {
        question: "How do you decide between SQL and a document store?",
        points: [
          "Start from the access patterns, not the data: how is it read, how is it written, what has to be transactional.",
          "Relational when the shape is stable and I need joins and constraints; document when the shape varies per record and reads are by a single key.",
        ],
      },
      {
        question: "When do you introduce a queue?",
        points: [
          "When producer and consumer run at different rates, or the work can be done later without the caller waiting.",
          "It buys back-pressure and retries, at the cost of eventual consistency I now have to reason about.",
        ],
      },
    ],
    related: ["apis", "frontend", "behavioral"],
  },
  {
    id: "frontend",
    title: "Frontend and React",
    summary: "Rendering, state, and the performance questions that follow.",
    entries: [
      {
        question: "How do you keep a large React app from re-rendering too much?",
        points: [
          "Measure first with the profiler; don't memoise on a hunch.",
          "Lift state only as high as it needs to go, and split contexts so a change wakes the fewest consumers.",
          "Reach for memo/useMemo/useCallback at real, measured boundaries, not everywhere.",
        ],
        details: [
          "The common cause isn't a slow component, it's a new object or function passed as a prop every render, which defeats memoisation one level down. Stabilise the reference before reaching for React.memo.",
        ],
      },
      {
        question: "Server components vs client components — how do you split?",
        points: [
          "Default to server; drop to a client component only where there's interactivity or browser-only state.",
          "Keep the client boundary as low in the tree as possible so less JavaScript ships.",
        ],
      },
      {
        question: "How do you make an interface accessible by default?",
        points: [
          "Semantic HTML first, ARIA only to fill gaps semantics can't.",
          "Every control keyboard-operable with a visible focus state; colour is never the only signal.",
        ],
      },
    ],
    related: ["system-design", "testing", "behavioral"],
  },
  {
    id: "apis",
    title: "APIs and Backend",
    summary: "Designing endpoints, versioning, and drawing the auth boundary.",
    entries: [
      {
        question: "REST or GraphQL for a new service?",
        points: [
          "REST when the resources and access patterns are stable and cacheable; GraphQL when clients need to shape wildly different queries.",
          "GraphQL moves the cost to the server (resolvers, N+1, depth limits) — I'd only take that on when the flexibility earns it.",
        ],
      },
      {
        question: "How do you evolve an API without breaking clients?",
        points: [
          "Add, don't change: new fields are safe, removing or retyping is not.",
          "Version at the edge when a breaking change is unavoidable, and give clients a deprecation window.",
        ],
      },
      {
        question: "Where does authorization actually live?",
        points: [
          "At every boundary that can be reached directly, not just the UI — the database and the API each enforce their own.",
          "An allowlist in the app layer means nothing to the datastore behind it; the check has to sit where the request lands.",
        ],
      },
    ],
    related: ["system-design", "testing"],
  },
  {
    id: "testing",
    title: "Testing and TDD",
    summary: "Test-first, behaviour over implementation, and what coverage really buys.",
    entries: [
      {
        question: "How do you decide what to test?",
        points: [
          "Test behaviour through the public API, not the internals — the test should survive a refactor that keeps behaviour.",
          "One failing test per new behaviour, written first; the implementation is whatever makes it pass.",
        ],
        details: [
          "Coverage is a floor, not a goal. A test that asserts an implementation detail is worse than no test, because it fails on a safe refactor and trains people to delete tests to move on.",
        ],
      },
      {
        question: "What does TDD actually change day to day?",
        points: [
          "It forces me to state the observable success criteria before writing code, so the diff stays the smallest thing that meets them.",
          "Red, green, refactor keeps the codebase in a working state the whole way through.",
        ],
      },
    ],
    related: ["frontend", "apis"],
  },
  {
    id: "behavioral",
    title: "Behavioral",
    summary: "The stories, kept concrete: situation, what I did, what it changed.",
    entries: [
      {
        question: "Tell me about a hard technical decision you made.",
        points: [
          "Name the fork and the constraint that made it hard, not just the choice.",
          "Say what I optimised for and what I traded away — a decision with no cost is a decision I didn't really make.",
        ],
      },
      {
        question: "Tell me about a time you disagreed with someone.",
        points: [
          "Frame it around the shared goal, not who was right.",
          "End with the outcome and what I'd carry forward, not a re-litigation.",
        ],
      },
    ],
    related: ["system-design", "frontend"],
  },
];

/**
 * Sardine, round 2 (hiring manager). Transformed from my prep notes: each topic
 * is a headline achievement or theme, each entry a question they'll pull on.
 * Points are the senior answer; details carry the "junior" plain version and
 * the honest "could've done better" retrospective I volunteer unprompted.
 */
const SARDINE_TOPICS: IntervieweeTopic[] = [
  {
    id: "fit-map",
    title: "The Sardine fit map",
    summary: "What the JD asks for, mapped to my strongest evidence. Read first.",
    entries: [
      {
        question: "Why are you a fit for this role?",
        points: [
          "Expert React/TS at scale: the Helika portal (enterprise SaaS, 20+ viz dashboards), a design system (WCAG, 82 test files), and a real-user Core Web Vitals pipeline (P75 by route and release).",
          "AI/agentic fluency (they name Claude explicitly): I don't just use the tools, I built the harness around them — that's the deepest differentiator.",
          "Set direction and mentor: a charting library and query layer are standards-as-architecture; a public SDK with 84 merged PRs and external contributors is my reviewable mentoring surface.",
          "Fraud/risk-adjacent: web3 gaming analytics is device/event analytics — I authored a client-side device/event SDK, the same species as their device-intelligence consortium.",
        ],
        details: [
          "The role is 'senior' in title but written as a lead: 'set the standard for how we build on the frontend, mentor the engineers around you' — that's my exact pitch.",
        ],
      },
      {
        question: "Three Sardine-specific things to weave in naturally",
        points: [
          "Their product is dashboards and real-time risk data for analyst users — my whole career is data-dense interfaces for analytical users.",
          "Their consortium pitch (6B devices) is powered by client-side instrumentation — I've authored a public device/event analytics SDK, so I know both ends: emitting the signal and visualising it.",
          "Their CTO wrote 'Reimagining Technical Interviews in the Age of AI' — AI-assisted development is their operating model, and my engineered workflow is the proof I already work that way.",
        ],
      },
    ],
    related: ["helika-ai", "ai-assisted-dev", "motivations"],
  },
  {
    id: "helika-ai",
    title: "Helika AI (the centerpiece)",
    summary: "Conversational analytics: chat answers rendered as live interactive artifacts.",
    entries: [
      {
        question: "Walk me through the architecture.",
        points: [
          "The chat UI never talks to the backend directly. A controller/state machine sits between them: the UI renders states, the controller owns the conversation lifecycle (pending, streaming, tool-result, error, retry).",
          "Messages aren't just text — the response schema distinguishes artifact types, each mapping to a renderer (chart, table, dashboard config). A new artifact type is a new renderer plus a schema entry, with no change to the chat flow.",
          "Responses stream token-by-token; artifacts hydrate when their payload completes, with partial and failed streams handled explicitly.",
        ],
        details: [
          "Junior: three boxes. A dumb chat window that just draws the state it's given, a controller in the middle that knows what phase the conversation is in, and the backend. The window never calls the backend, so when the backend changes only the middle box cares.",
        ],
      },
      {
        question: "Why a state machine? Isn't that overengineering for a chat window?",
        points: [
          "Chat looks simple but has brutal state: cancel mid-stream, error mid-artifact, retries, session expiry, out-of-order responses. Ad-hoc useState/useEffect for that becomes unmaintainable.",
          "The concrete payoff: the backend swapped a single chat endpoint for a session-scoped multi-agent system, and the UI wasn't rewritten — only the controller changed. In 2023 AI backends were guaranteed to churn, so I isolated the UI from the thing most likely to change.",
        ],
        details: [
          "Junior: with boolean flags you get isLoading && !isError && hasPartial combos nobody can reason about. A state machine says you're in exactly one named state with only legal moves, so bugs become 'that transition shouldn't exist,' which you can test.",
          "Could've done better: I hand-rolled the machine as a typed reducer. A statechart library (XState) would have bought generated diagrams, model-based test generation, and first-class nested/parallel states (streaming WHILE hydrating). Right for v1; I stayed hand-rolled past the point the tooling would have paid off.",
        ],
      },
      {
        question: "What was the hardest problem in it?",
        points: [
          "Streaming plus artifact hydration: text streams token-by-token but an artifact is only renderable once complete, so one response could be part-streamed-text and part-pending-chart, and the stream could fail or cancel anywhere in between.",
          "Getting every combination to a sane UI state — partial text kept, artifact slot degrading gracefully, retry not duplicating the message — is what forced the explicit state machine.",
        ],
        details: [
          "Junior: a message that's half a sentence plus a chart still downloading, and the user hits cancel. What stays on screen? The text you have, a 'chart unavailable' slot, and a retry that doesn't post the question twice. Each is a state handled on purpose.",
        ],
      },
      {
        question: "How did you validate the AI's output before rendering it?",
        points: [
          "Model output that drives UI is untrusted input: schema validation with Zod, a safe fallback rendering when the payload doesn't validate, and never eval-ing or blindly trusting config from the model.",
          "Two floors, not one: shape (is it the right structure?) and sanity (a capped series count, finite numbers, sane ranges). Concretely: the model once returned a chart with 10,000 series and a negative axis — valid JSON, unrenderable — so the schema caps the series array and checks the numbers are finite before anything renders.",
        ],
        details: [
          "Junior: treat the AI like a user typing into a form — check the value against a strict shape first, and if it doesn't match, show a safe plain-text version instead of crashing.",
          "Could've done better: the Zod schemas were hand-written mirrors of the backend payload — two sources of truth that drifted. Generate them from one shared contract so a backend change breaks the frontend build, not its runtime; and fuzz the validators with property-based tests.",
        ],
      },
      {
        question: "How did you version the schema when the backend added artifact types?",
        points: [
          "Unknown types render a safe fallback card; the UI never crashes on a type it doesn't know. Forward-compatible by design, because frontend and backend deploy at different times.",
        ],
        details: [
          "Junior: the frontend will meet artifact types it's never heard of, so plan for it — an unknown type renders a generic 'not supported yet' card instead of white-screening.",
        ],
      },
      {
        question: "Why not use the Vercel AI SDK or a chat framework?",
        points: [
          "Timing (2023, the options were immature) and the fact that the artifact rendering surface WAS the product — not a commodity to outsource.",
          "Frameworks earn their weight on the part of your app that's the same as everyone else's; our differentiator was the structured-artifact rendering the framework didn't do.",
        ],
      },
      {
        question: "How did you measure whether it was any good?",
        points: [
          "Instrumented the artifact interactions, not just question counts: a chart that gets filtered, expanded, or pinned was a useful answer; one ignored wasn't.",
          "The blunt qualitative bar: it was demoed live to investors and customers, so 'survives a live demo' was a real recurring test.",
        ],
      },
    ],
    related: ["charting-library", "ai-assisted-dev", "testing-philosophy", "forensic-method"],
  },
  {
    id: "charting-library",
    title: "The charting library",
    summary: "15 components, 20+ visualizations per dashboard, wrapping ECharts and ag-Grid.",
    entries: [
      {
        question: "Why build a library instead of using ECharts everywhere directly?",
        points: [
          "We did use ECharts and ag-Grid underneath — the library is the wrapper: consistent theming, data contracts, loading/empty/error states, and responsiveness handled once instead of 20 times per dashboard.",
          "Three dashboard surfaces (game, web, on-chain) were duplicating and drifting; the library made the correct path the fast path.",
        ],
        details: [
          "Junior: ECharts is powerful but low-level — every chart is ~50 lines of config plus spinners, empty states, theme colours. The wrapper writes that once, so a new chart is 5 lines, not 50.",
          "Could've done better: extract earlier (the second duplicate chart was the signal; I waited for the tenth), and split a headless core from the ECharts adapter so a renderer swap wouldn't touch all 15 components. Plus visual regression tests in CI instead of a manual Storybook eyeball.",
        ],
      },
      {
        question: "How did you design the API for it?",
        points: [
          "Data contract first: components take normalized series data, not raw API responses — the query layer normalizes.",
          "That separation is exactly why the later API/query refactor didn't touch chart code — the seam was already in the right place.",
        ],
        details: [
          "Junior: charts only ever accept one standard shape (a list of series with a name and points). Something else translates API responses into that shape, so an API change fixes one translator, not 15 charts.",
        ],
      },
      {
        question: "How do you handle performance with 20+ charts on one page?",
        points: [
          "Profile to find the real bottleneck — chart init, data transforms, or re-render storms from shared state — because each has a different fix.",
          "Render charts as they scroll into view, memoize expensive series transforms so they only recompute when inputs change, and give each chart its own query subscription so one chart's update never wakes the other 19.",
        ],
        details: [
          "Junior: don't render what the user can't see yet, don't redo expensive math every render, and don't let one chart's update re-render all of them.",
        ],
      },
      {
        question: "ECharts is imperative, React is declarative — how did you bridge that?",
        points: [
          "One ref-based wrapper: mount calls init, a prop change calls setOption, unmount disposes. All the imperative mess lives in that file; the rest of the app stays declarative.",
          "Resizing is a ResizeObserver to chart.resize(), debounced, because a gridstack drag fires dozens of size events a second.",
        ],
      },
      {
        question: "Why ECharts over Recharts, Visx, or D3?",
        points: [
          "Canvas performance at high point counts, breadth of chart types, and theming. SVG charts (Recharts) make one DOM node per point — fine at 12 points, not at 50,000.",
          "Named trade-off, not preference: an analytics dashboard has big series so canvas wins; a marketing sparkline would choose differently.",
        ],
      },
    ],
    related: ["helika-ai", "performance-refactor", "design-system"],
  },
  {
    id: "performance-refactor",
    title: "The performance refactor",
    summary: "15% net code reduction: N copies of a fetch replaced by a shared query layer.",
    entries: [
      {
        question: "What was actually wrong, and how did you know?",
        points: [
          "The modules endpoint (nav/permissions every screen needs) was fetched independently from 11 files, and 95 component files called the raw fetch helpers directly inside useEffect — no caching, no dedup, a refetch every mount.",
          "Two literal copy-pasted hooks differed only by a revalidateOnFocus:false someone added to one and not the other — the perfect proof that copy-paste data fetching rots.",
          "Three fetching generations coexisted on one page — raw fetch-in-useEffect, SWR, and TanStack Query — three cache behaviors at once.",
          "I measured before proposing: network waterfalls showing the duplicate calls, component-level profiling. The refactor was argued with data, not taste.",
        ],
        details: [
          "Junior: open DevTools Network on a dashboard and the same modules request fired several times per load, because eleven components each fetched it. A waterfall screenshot convinces everyone; 'this feels bad' convinces nobody.",
        ],
      },
      {
        question: "How did you de-risk a portal-wide rewrite?",
        points: [
          "Incremental: sliced by dashboard area, proved the pattern on one slice, then rolled it through, with old and new paths coexisting during migration.",
          "15% NET code reduction while adding capability — the point isn't the deletion, it's the shared query layer replacing N copies of the same logic. This doubles as my disagreement story: teammates pushed back on risk mid-fundraise, and the sliced proof plus measurements won it.",
        ],
        details: [
          "Junior: never rewrite everything at once — convert one section, ship it, prove nothing broke and it got faster, repeat. Renovate the house one room at a time while people still live in it.",
          "Could've done better: ship a lint rule banning raw fetch imports outside the data layer with slice one, so the disease can't regrow; codemod the 95 mechanical call sites instead of hand-migrating; and finish the consolidation instead of leaving two old generations alive.",
        ],
      },
      {
        question: "What's the cache-busting system — walk me through the mechanism?",
        points: [
          "Scoped server-side cache flushing driven from admin UI: bust functions for per-user, per-org, per-API-key, and whole-service flush endpoints on the core API and the Explore data service.",
          "Granularity is the feature: 'clear everything' is easy but makes every customer's next load slow, so scoped busting fixes one customer without cooling everyone's cache. The newest module's react-query keys also carry a version param so client entries are version-scoped.",
        ],
        details: [
          "Junior: the servers cache expensive analytics so dashboards feel fast; when data changes, scoped buttons say 'forget what you know about THIS user/org' instead of one giant clear-everything.",
          "Could've done better: it was reactive and human-triggered. Invert it — the data pipeline emits a completion event that triggers the flush automatically, with per-dataset version stamps so clients invalidate precisely. The admin buttons should be the fallback, not the mechanism.",
        ],
      },
      {
        question: "How did you design the query keys?",
        points: [
          "Keys mirror the data hierarchy: [domain, dataset, params]. The bug class was a key missing a filter param, so two views with different date ranges shared a cache entry and flashed each other's data.",
          "The fix was structural: derive keys from the full serialized param object so a new filter can never be forgotten.",
        ],
        details: [
          "Could've done better: a key factory — one module owning every key shape — so keys can't be hand-built wrong and invalidation targets come from the same source. I converged on it one bug later than I should have.",
        ],
      },
      {
        question: "Did anything get slower or worse because of the refactor?",
        points: [
          "Something always does — the near-miss was the coexistence window: a component on the old path and one on the new could briefly show different values for the same metric. Caught in slice verification, fixed by cutting over whole dashboard areas atomically.",
          "Saying 'nothing got worse' reads as not measuring; naming the cost and why it was worth it reads as senior.",
        ],
      },
    ],
    related: ["charting-library", "portfolio", "testing-philosophy"],
  },
  {
    id: "web-sdk",
    title: "helika-web-sdk (public npm)",
    summary: "84 merged PRs, external contributors, and privacy as an API-level decision.",
    entries: [
      {
        question: "What does designing a public SDK teach you that app work doesn't?",
        points: [
          "You can't break users: semver discipline, deprecation paths, backwards compatibility — every public API is a promise you keep for years.",
          "Docs and reference integrations ARE the product — I wrote sdk-demo-react and sdk-demo-nextjs, because an SDK without a working example doesn't get adopted.",
          "Reviewing external and teammate contributions to a public artifact is my clearest reviewable-evidence mentoring surface.",
        ],
        details: [
          "Junior: in your own app, renaming a function fixes the three callers. In a published SDK the callers are other companies' codebases you can't see, so changes are additive, versioned, and deprecated slowly.",
          "Could've done better: no offline queue or sendBeacon flush on tab close (analytics dropping at session end is silent data loss), no bundle-size budget in CI, and stringly-typed events instead of a generated typed event catalog.",
        ],
      },
      {
        question: "How did events get delivered — what happens when the user closes the tab mid-batch?",
        points: [
          "Direct HTTP sends, with session id, expiry, and a hashed anonymous id persisted in localStorage so identity and session survive reloads.",
          "Honest gap: there was no offline queue or sendBeacon flush, so events in flight at tab close could drop — the first thing I'd add. Knowing the gap and its fix is a better senior answer than pretending it wasn't there.",
        ],
        details: [
          "Junior: a normal fetch dies when the tab closes; sendBeacon is built to deliver a small payload as you leave. Queue events, flush on visibilitychange with sendBeacon.",
        ],
      },
      {
        question: "Fingerprinting and attribution — how did you think about privacy and consent?",
        points: [
          "Consent was API surface, not a docs paragraph: a piiTracking flag (constructor param plus a runtime setPIITracking toggle) and a hashed anonymous id rather than raw identifiers.",
          "Directly conversant with Sardine's world: device intelligence with an explicit PII boundary. The default is anon-ID so studios could integrate before their consent flow was sorted, then upgrade to identified tracking explicitly.",
        ],
        details: [
          "Junior: privacy in an SDK is code, not prose — the integrator turns PII off with one call, and the default identity is an anonymous hash, not an email.",
        ],
      },
      {
        question: "How did you test an SDK you don't control the host app of?",
        points: [
          "The two reference integrations doubled as integration testbeds — the SDK was continuously exercised in the two host shapes that mattered — plus unit tests on the core and strict semver, because downstream breakage is the failure you can't hotfix.",
        ],
        details: [
          "Junior: you can't test inside customers' apps, so you build miniature versions of them; if a change breaks the demos it would have broken customers. The demos are the canary.",
        ],
      },
    ],
    related: ["evidence-bank", "design-system", "testing-philosophy"],
  },
  {
    id: "design-system",
    title: "Paul Design System",
    summary: "Framework-agnostic tokens: 33 React and 33 Angular components, 11 charts, no chart lib.",
    entries: [
      {
        question: "Why no charting library in your own system when you used ECharts at work?",
        points: [
          "At work ECharts was the right call — battle-tested, fast to ship, team-familiar. At home the goal was zero dependencies and owning the geometry layer.",
          "Same engineer, different constraints, different decision — tool choice follows context, not preference. That IS the lead-level answer.",
        ],
        details: [
          "Junior: at work, shipping this quarter beats owning every line, so use the proven library; in a zero-dependency design system one npm package breaks the whole promise. Neither is 'better' — knowing which constraint you're under is the skill.",
        ],
      },
      {
        question: "Two design systems — what did you do differently the second time?",
        points: [
          "Tokens first, not bolted on: the token layer is the foundation everything compiles from, not documentation added alongside MUI components.",
          "Framework-agnostic core: a pure geometry/logic layer with thin React AND Angular bindings, so the expensive part is written once.",
          "Zero runtime dependencies: living on MUI's major-version treadmill taught me what a dependency costs a library's consumers.",
        ],
        details: [
          "Junior: decide your visual language as data (tokens) first, then generate everything from it. Bolting tokens on later is like adding a foundation under a built house.",
        ],
      },
      {
        question: "How do you version a component library consumed by five apps without breaking them?",
        points: [
          "Semver as the contract: patch fixes, minor adds, major warns and documents. Never remove in the same release you deprecate — mark it deprecated (warns but works), give a version to migrate, remove a major later.",
          "The social part matters: announce, don't just publish.",
        ],
      },
      {
        question: "A product team wants a one-off variant that violates the system. What do you do?",
        points: [
          "A sanctioned escape hatch with a paper trail — e.g. a style-override prop plus an exceptions list I review monthly — then decide whether the exception is a missing feature or a real one-off; never a flat no (they'll fork it) and never a silent fork.",
          "Three teams making the same exception means the system is missing a feature.",
        ],
      },
    ],
    related: ["charting-library", "web-sdk", "testing-philosophy"],
  },
  {
    id: "portfolio",
    title: "paulsumido.com (full-stack range)",
    summary: "106 routes, 62 API routes, BFF auth, a real-user Core Web Vitals pipeline.",
    entries: [
      {
        question: "What's the standout in your portfolio?",
        points: [
          "The RUM pipeline: I don't trust lab numbers — I watch P75 per route per release on real users. Almost no candidate walks in with their own production RUM pipeline.",
          "BFF auth: the browser only ever holds a session cookie; my server holds the real tokens and makes the API calls, so the secret never enters the environment I can't trust.",
        ],
        details: [
          "Junior (BFF): normally a SPA keeps an access token in the browser where any injected script can steal it. A Backend-For-Frontend keeps the tokens server-side and hands the browser only a session cookie.",
          "Could've done better: 106 routes and 62 API routes is past where one Next.js app is the clean answer — the CWV pipeline and GraphQL gateway deserve their own deploy cadence. It grew feature-by-feature because it's a portfolio; at work I'd have split it.",
        ],
      },
      {
        question: "Walk me through the RUM pipeline: browser event to dashboard.",
        points: [
          "The web-vitals library measures each real user's LCP/INP/CLS, beacons it home with the route and release, the server stores it, and the dashboard shows P75 per route per release — so a slow release shows up as a step in the graph, attributable to a deploy.",
          "P75 because average hides the tail (fast and slow users cancel out) and P99 is noise at low traffic.",
        ],
      },
      {
        question: "A customer says the dashboard is slow and nothing changed in the frontend deploy. Go.",
        points: [
          "Systematic triage, not guessing: everyone or just them (their data/network vs our code), every page or one (global vs specific), network slow or render slow (backend vs frontend) — each split halves the search space.",
          "'Nothing changed in the frontend' is a clue, not an alibi — their data may have grown past a threshold. Reproduce with their data volume, then RUM/Sentry for scope, then the network tab, then the profiler.",
        ],
      },
    ],
    related: ["performance-refactor", "ai-assisted-dev", "testing-philosophy"],
  },
  {
    id: "ai-assisted-dev",
    title: "AI-assisted / agentic development",
    summary: "The JD names Claude twice — I build the harness around the tools, not just use them.",
    entries: [
      {
        question: "How do you actually use AI, and what makes it more than 'I use Copilot'?",
        points: [
          "My workflow is engineered, not ad-hoc: a custom TypeScript agentic harness around Claude that enforces plan-first (visual plans reviewed before code), TDD (failing tests are the first commit), accessibility checks, and git-flow discipline. The tool moves fast; the harness keeps it honest.",
          "Verification discipline: AI's failure mode is confident wrongness, so I verify the true signal — run the built artifact, hit the live endpoint, read the exit code — never the assistant's own summary of success.",
          "I've shipped AI product, not just used AI tools: Helika AI. I know building WITH agents and building agent-powered UX — which is Sardine's own product surface.",
        ],
        details: [
          "Junior: the AI is a very fast junior with no memory of yesterday and total confidence always. You give it a plan, make it write the failing test first, and check its work by RUNNING the result — the process around the tool is what makes it safe to go fast.",
          "Could've done better: my throughput evidence is mostly anecdotal. Instrument the workflow — cycle time per feature, review rounds per PR, defect escape rate, before vs after — so 'AI raised my throughput' is measured, which is exactly what 'establish best practices across the team' needs.",
        ],
      },
      {
        question: "Show me a case where the AI was confidently wrong and you caught it. How?",
        points: [
          "You catch it because the process ALWAYS runs the real thing — the test suite, the build, the endpoint — instead of trusting the AI's summary. People without a verification habit ship these.",
          "AI bugs look correct: a function call that reads perfectly but doesn't exist, an edge case handled with confident nonsense. Example: I've caught it inventing a component prop that didn't exist — the build's type-check flagged it, not my read of code that looked right. So reading isn't enough — run it and spot-check every API it claims exists.",
        ],
      },
      {
        question: "What do you never delegate to the model?",
        points: [
          "Architectural decisions, security-sensitive review, the final read of any diff I ship, and test intent — the model writes the test code, I decide what it must prove (e.g. that a cancel mid-hydration keeps the partial text).",
          "Delegate labor, never judgment: I'll let it draft a migration, a test file, or boilerplate, but I own the rollback plan, what the test has to prove, and the last read of the diff — the calls where being wrong is expensive and fails silently.",
        ],
        details: [
          "Concrete line: the BFF token-handling code I read myself, character by character, because a subtle mistake there leaks tokens and no test would catch it. The renderer boilerplate next to it, I let the model write and just ran.",
        ],
      },
      {
        question: "What's the failure mode of an AI-heavy team, and how do you counter it?",
        points: [
          "Throughput outrunning verification, codebase coherence drifting (every file a different author), and debugging skill atrophy from always regenerating.",
          "The antidotes are process: tests as gatekeepers, shared conventions the AI is given, and humans owning every diff. Concretely, my harness makes the failing test the first commit and feeds the model the repo's lint rules and conventions file, so throughput can't outrun verification and every file comes out in one voice.",
        ],
        details: [
          "Junior: when a human writes slowly, review keeps up; when AI writes fast, review is the bottleneck unless the test defines correct first. Write the failing test yourself (the intent), let the AI make it pass (the labor), and the test referees.",
        ],
      },
      {
        question: "Give me a concrete example of AI raising your throughput.",
        points: [
          "A take-home: a full driver-onboarding flow plus a real-time campaign-analytics dashboard (Next.js, Prisma, Zod, Recharts, with tests) shipped in 2 days, WITH a written plan, a decision log, and the complete prompt log as part of the deliverable.",
          "Solo without AI that's a week-plus; the logs show exactly where the AI produced and where I steered — the part most people can't demonstrate.",
        ],
      },
    ],
    related: ["helika-ai", "testing-philosophy", "fit-map", "motivations"],
  },
  {
    id: "forensic-method",
    title: "The forensic layer",
    summary: "How a good HM verifies a resume: what YOU did, what you rejected, how you knew it worked.",
    entries: [
      {
        question: "The five questions they'll cycle through on every project",
        points: [
          "What specifically did YOU build vs the team — have the boundary ready per project.",
          "Walk me through a decision and its alternatives — a decision with one option isn't a decision; name what you rejected and why.",
          "What were you thinking at the time — what did you know, what were you guessing.",
          "How did you test it / know it worked — the answer is never 'it worked in dev'; name the signal.",
          "What would you do differently now — no self-critique reads as no growth ceiling.",
        ],
        details: [
          "First-person singular and concrete. 'We' answers on your own claimed work read as inflated credit.",
        ],
      },
      {
        question: "Helika AI — what was yours vs the backend/ML team's?",
        points: [
          "Mine: the entire frontend — chat UI, controller/state machine, artifact rendering, streaming, the response-schema contract from the UI side. The backend team owned model/agent orchestration and the API.",
          "The schema contract was negotiated between us; I drove the artifact-type design because the rendering constraints lived on my side.",
        ],
        details: [
          "Junior: they built the brain, I built the face and the nervous system connecting to it — and we negotiated the language the two speak, with me leading that part because I knew what the UI could render.",
        ],
      },
      {
        question: "How did you test a streaming AI chat?",
        points: [
          "Layer by layer: the state machine is pure logic, unit-tested exhaustively including the ugly transitions. Streaming and API edges mocked with MSW, replaying recorded stream fixtures including truncated and malformed ones. Renderers tested against valid and invalid schema fixtures. Playwright on the happy path.",
          "You can't deterministically test the model's answers, so you don't — you test that any payload the schema permits renders and any it doesn't degrades safely. Test the contract, not the model.",
        ],
        details: [
          "Junior: you can't unit-test 'did the AI give a good answer,' but you can test 'whatever comes back, the UI does something sane' — pipe in recorded, cut-off, and garbage responses and assert the screen never breaks.",
        ],
      },
    ],
    related: ["helika-ai", "performance-refactor", "leadership"],
  },
  {
    id: "testing-philosophy",
    title: "Testing philosophy",
    summary: "Fraud UIs are correctness-critical — Sardine will grill this.",
    entries: [
      {
        question: "What do you test first, and what do you deliberately not test?",
        points: [
          "First: pure logic at boundaries — state machines, data transforms, geometry — because it's cheap, fast, and where wrongness hides silently. Then integration at the contract seams with MSW. Then Playwright on the flows that cost money when broken.",
          "Deliberately not: implementation details, pixel-level SVG output, third-party internals. Tests coupled to implementation are a refactoring tax that trains teams to delete tests.",
        ],
        details: [
          "Junior: test behaviour ('clicking export downloads a CSV'), not implementation ('the component set isExporting to true'). Behaviour tests survive refactors; implementation tests break on every cleanup until someone deletes them.",
        ],
      },
      {
        question: "Why mutation testing? Almost nobody uses it.",
        points: [
          "Coverage lies: 90% coverage with weak assertions is theatre. Mutation testing breaks the code (flips a > to >=, deletes a line) and checks whether any test fails — if none do, that test was decoration.",
          "I use it selectively on the logic that matters most — e.g. the Helika AI state-machine reducer and the design-system chart geometry, where flipping a > to >= would silently mis-handle a cancel or misplace an arc and no one would catch it in a demo — not everywhere, because it's slow.",
        ],
        details: [
          "Junior: coverage says 'this line RAN during tests,' not 'a test would notice if this line were wrong.' Mutation testing checks the second thing.",
        ],
      },
      {
        question: "A bug ships to production anyway. Walk me through what you do.",
        points: [
          "Sentry alert, reproduce, the fix ships WITH a test that fails without it — e.g. cancel-during-artifact-hydration shipped once and left the message stuck loading; the fix added the state-machine transition test that now catches it. Then the real question: why did no layer catch it, and which layer should have. Pattern-level fixes, not just instance fixes.",
          "The bug is evidence of a hole in the safety net — add the check at the layer that should have caught it so the whole category can't ship again.",
        ],
      },
      {
        question: "How does AI-assisted development change testing?",
        points: [
          "It raises the stakes: AI writes plausible code faster than humans review it, so tests become the contract that keeps throughput honest.",
          "My harness makes failing-tests-first mandatory for exactly this reason — the test is written by the intent, the code by the tool, and the test arbitrates. This lands hard at Sardine specifically.",
        ],
      },
    ],
    related: ["helika-ai", "ai-assisted-dev", "forensic-method"],
  },
  {
    id: "fundamentals",
    title: "Fundamentals and curveballs",
    summary: "Explain-like-I'm-a-junior checks and the low-probability, high-damage questions.",
    entries: [
      {
        question: "Explain reconciliation, keys, useEffect cleanup, and stale closures like I'm a junior.",
        points: [
          "Reconciliation: React keeps a sketch of the UI, draws a new one on re-render, diffs them, and touches only the real DOM bits that differ — because real DOM changes are the expensive part.",
          "Keys: name tags in a list. Without stable ones React matches by position, so inserting at the top makes it think every row changed. Never use the array index when the list can reorder.",
          "useEffect cleanup: anything you start in an effect (listener, interval, subscription) the cleanup stops. Skip it and every re-run stacks another one — the classic slow leak.",
          "Stale closures: a function remembers variables as they were when created — a photo, not a live feed. Fix with deps or the functional update form (setCount(c => c + 1)).",
        ],
      },
      {
        question: "What's overrated in frontend right now?",
        points: [
          "Name the thing, who it's actually for, and the cost everyone ignores: micro-frontends solve a 200-engineer coordination problem, so a 15-engineer team adopting them buys the tax with none of the payoff.",
          "Strong opinions, loosely held, defended specifically — the trap is having no opinion (no taste) or a rant (no judgment).",
        ],
      },
      {
        question: "If we gave you portal-v2 to build again from scratch today, what's your stack?",
        points: [
          "Next.js App Router or Vite+React, TanStack Query, Zod at every boundary, a tokens-first design system, Playwright — with the WHY per choice.",
          "Each choice traces to a scar: a query layer from day one (retrofitting cost a quarter), schema validation at every boundary (unvalidated data was where bugs came in), tokens before components (bolting them on was the UI SDK's hardest rework).",
        ],
      },
      {
        question: "What's your biggest technical mistake?",
        points: [
          "Early Helika speed became the monolithic components and duplicate calls I later unwound. The lesson wasn't 'be careful' — it was put the guardrail architecture in early so the fast path is the correct path.",
          "The refactor was me paying down my own debt, and I say that plainly.",
        ],
      },
    ],
    related: ["performance-refactor", "ai-assisted-dev", "helika-ai"],
  },
  {
    id: "evidence-bank",
    title: "Deep-cut evidence bank",
    summary: "Material behind the resume, organised by interview value. Confirm my contribution first.",
    entries: [
      {
        question: "Device intelligence — Sardine's core primitive",
        points: [
          "I've shipped it twice: the Helika portal integrated FingerprintJS Pro, and the user-acquisition backend combined FingerprintJS Pro, geoip, wallet-signature validation, and OAuth attribution — a bot/fraud-detection-adjacent attribution engine, the closest thing to Sardine's domain in my history.",
        ],
        details: [
          "Junior (device fingerprinting): identifying a device without asking who the user is — combining browser, screen, timezone, and hardware quirks into a stable id. Fraud teams use it to notice 'this new account is the same device that made 40 others.'",
        ],
      },
      {
        question: "Multi-agent AI systems",
        points: [
          "Claim it exactly: I integrated a 25-agent backend into the product frontend without a UI rewrite — the controller/state machine absorbed the swap from a single chat endpoint to a session-scoped agent system. The backend was a backend team's; 'built the agents' is a fumble waiting to happen.",
          "I also built my own Python multi-agent framework (FastAPI, Dockerized) end-to-end to understand the orchestration side.",
        ],
        details: [
          "Junior: instead of one AI answering everything, a team of specialists (schema, query, analyst) with a router; for the frontend the hard part is that the answer's shape depends on which specialist replied.",
        ],
      },
      {
        question: "Fintech / regulated — the JD says preferred",
        points: [
          "A real card: a Next.js merchant-onboarding flow with Plaid bank linking, Anvil PDF/e-signature, Supabase auth, and GraphQL — KYC-adjacent, compliance-shaped UX.",
          "Web3 work is fraud-adjacent by nature: wallet signature validation, merkle-tree allowlists, on-chain analytics.",
        ],
      },
      {
        question: "The real arc (better than the resume's two-company split)",
        points: [
          "Refmint rebranded into Helika — the npm lineage literally carries over — so 2022 to 2026 is one continuous arc through two pivots: referral platform, web3 UA tooling, gaming analytics, AI products.",
          "I rode a startup through both pivots and stayed top contributor — that's the 'comfort with ambiguity' answer with four years of receipts.",
        ],
      },
    ],
    related: ["web-sdk", "helika-ai", "motivations"],
  },
  {
    id: "leadership",
    title: "Leadership and collaboration",
    summary: "Behavioral follow-ups that come mid-story — credit, disagreement, mentoring.",
    entries: [
      {
        question: "You keep saying 'I' — who else was on this, and what did they own?",
        points: [
          "Being primary author of the frontend apps makes generous, SPECIFIC credit more convincing, not less — e.g. on Helika AI the backend team owned the 25-agent orchestration and the API while I owned the whole frontend and drove the schema contract. Naming who owned what sounds like a lead.",
          "'It was mostly me' sounds like a red flag even when it's true — know the team shape and credit precisely.",
        ],
      },
      {
        question: "What did you do when a teammate consistently shipped low-quality frontend code?",
        points: [
          "Standards-as-tooling before standards-as-conflict: when the same review comments kept repeating (unhandled loading/error states, ad-hoc fetching), I moved the bar into the machine — lint rules, shared hooks and components that make the right way the short way — and paired on the next feature.",
          "The direct conversation happens when the pattern survives the tooling; by then it's about one gap, not 'your code is bad.'",
        ],
        details: [
          "Junior: if you're leaving the same comment three times, the standard lives in your head, not the tooling. Move it into a lint rule or shared component and the argument disappears.",
        ],
      },
      {
        question: "A stakeholder wants it Friday; done right it's two weeks. Your next steps?",
        points: [
          "A menu, not a verdict: 'Friday buys you A without B, with risk C; two weeks buys the full thing; A-then-B costs one extra day.' Their call.",
          "Never silently crunch, never silently cut quality — both write checks the team cashes later.",
        ],
      },
      {
        question: "How do you review a PR from someone much more junior?",
        points: [
          "Label blocking vs preference so they're not overwhelmed, explain the WHY behind one pattern deeply instead of ten shallow flags, and praise something real and specific ('this loading/empty/error handling is exactly right') rather than a generic 'nice work.'",
          "The goal is that their next PR needs fewer comments, not that this PR reaches perfection.",
        ],
      },
    ],
    related: ["forensic-method", "ai-assisted-dev", "motivations"],
  },
  {
    id: "motivations",
    title: "Motivations and trajectory",
    summary: "Will I stay and grow here, and does what I want match the role. Say these plainly.",
    entries: [
      {
        question: "Why Sardine?",
        points: [
          "The problem shape is my career's center of gravity: data-dense, real-time interfaces for analytical users making high-stakes decisions. Fraud analysts triaging risk is the same interface problem as studios triaging player analytics, with higher stakes — which makes the craft matter more.",
          "The AI posture: their CTO redesigned the interview around AI-assisted development, and I want to be somewhere my engineered workflow is an asset, not a thing I do quietly.",
          "The role is written as a lead — 'set the standard, mentor the engineers' — the mandate I've operated under informally and want explicitly.",
        ],
      },
      {
        question: "Where do you want your career to go?",
        points: [
          "Technical leadership — lead toward staff/principal — NOT away from code into pure people management. I multiply through architecture, review, and mentoring and want a hand in the code.",
          "Concretely: owning frontend architecture for a whole product surface, growing 2-3 engineers to senior, being in the room for tradeoffs earlier. Then turn it: 'what does growth from this seat look like, and where did the last person go?'",
        ],
      },
      {
        question: "Why did you leave Helika?",
        points: [
          "Stated plainly, then pivot forward: Helika restructured in early 2026 and my role was cut with a chunk of the team — web3 gaming has been a volatile sector. Never linger, never editorialize about the company.",
        ],
      },
      {
        question: "What would you do in your first 90 days?",
        points: [
          "Listen before touching: learn the codebase, the deploy path, and the team's current pain — the expensive mistake is prescribing the Helika medicine before diagnosing their patient.",
          "Ship something small end-to-end early to learn the real path to production, then find the leverage point and propose it with measurements, the way the query-layer refactor was argued.",
        ],
      },
    ],
    related: ["fit-map", "ai-assisted-dev", "my-questions"],
  },
  {
    id: "my-questions",
    title: "My questions for the hiring manager",
    summary: "Asking nothing kills a second round. These signal seniority and get me trajectory data.",
    entries: [
      {
        question: "The five to ask",
        points: [
          "The JD says this role sets the standard for how the frontend gets built. What does the frontend look like today — one app or several, who owns it, and what's the biggest source of pain?",
          "How far along is the team on AI-assisted development best practices — a shared workflow, or is that part of what this role establishes?",
          "The platform is 'agentic risk' — how much of the roadmap is agent-driven UX in the product itself? That's the frontend problem I most want to work on.",
          "What does growth from this role look like — where did the last person in a role like this go?",
          "What would make you look back in a year and say this hire was a clear win?",
        ],
      },
    ],
    related: ["motivations", "fit-map"],
  },
];

export const INTERVIEWS: Interview[] = [
  {
    id: "sardine-2-hiring-manager",
    title: "Sardine Interview 2: Hiring manager",
    summary:
      "Senior Frontend (agentic risk platform) — deep technical dive plus motivations. They pull threads and ask why three levels deep.",
    topics: SARDINE_TOPICS,
  },
  {
    id: "general",
    title: "General practice",
    summary: "Role-agnostic warm-up: system design, React, APIs, testing, behavioral.",
    topics: GENERAL_TOPICS,
  },
];

/** Find an interview by its id, or undefined if there's no such interview. */
export const interviewById = (id: string): Interview | undefined =>
  INTERVIEWS.find((interview) => interview.id === id);

/** Find a topic within an interview by its id. */
export const topicInInterview = (
  interview: Interview,
  topicId: string,
): IntervieweeTopic | undefined =>
  interview.topics.find((topic) => topic.id === topicId);

/**
 * Resolve a topic's related ids to real topics within the same interview, in
 * order, skipping any id that no longer resolves. A card only links somewhere
 * real.
 */
export const relatedTopicsInInterview = (
  interview: Interview,
  topic: IntervieweeTopic,
): IntervieweeTopic[] =>
  topic.related
    .map((id) => topicInInterview(interview, id))
    .filter((t): t is IntervieweeTopic => t !== undefined);
