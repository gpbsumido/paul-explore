import type { IntervieweeTopic } from "./types";

/**
 * The seed deck. This is the file to replace when I paste in a fresh batch of
 * prep notes: keep the shape, swap the content. See TOPICS_TEMPLATE.md for the
 * markdown format these are transformed from.
 */
export const TOPICS: IntervieweeTopic[] = [
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
          "Custom aliases and collision handling are where the interesting follow-ups live: unique constraint on the key, retry on collision for random keys, reject-on-taken for custom ones.",
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
        details: [
          "This is the one I feel strongest about: a credential that works is not evidence it was meant to be used that way. The control has to be the boundary, not the caller's restraint.",
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

/** Find a topic by its id, or undefined if there's no such topic. */
export const topicById = (id: string): IntervieweeTopic | undefined =>
  TOPICS.find((topic) => topic.id === id);

/**
 * Resolve a topic's related ids to real topics, in order, skipping any id that
 * no longer resolves. A card only ever links somewhere real.
 */
export const relatedTopics = (topic: IntervieweeTopic): IntervieweeTopic[] =>
  topic.related
    .map((id) => topicById(id))
    .filter((t): t is IntervieweeTopic => t !== undefined);
