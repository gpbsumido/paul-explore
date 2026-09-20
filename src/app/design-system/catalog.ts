/**
 * The catalog behind the /design-system showcase. It's plain data so the page
 * stays declarative and a test can prove every entry lines up with a real
 * export from the shared UI barrel and a real route in the app. Think of it as
 * a hand-written Storybook manifest.
 */

/** A link to a live page in the app where a component actually ships. */
export type UsedOnLink = { label: string; href: string };

/** Stable public ids: they appear in shared URLs (?category=charts). */
export type CategoryId =
  | "ai"
  | "charts"
  | "forms"
  | "feedback"
  | "content"
  | "effects";

export type Category = { id: CategoryId; label: string };

/** Display order for the explorer's category chips. */
export const CATEGORIES: Category[] = [
  { id: "ai", label: "AI & chat" },
  { id: "charts", label: "Charts & data" },
  { id: "forms", label: "Forms & inputs" },
  { id: "feedback", label: "Overlays & feedback" },
  { id: "content", label: "Content & identity" },
  { id: "effects", label: "Motion & effects" },
];

/** One documented primitive from the shared design system. */
export type ComponentDoc = {
  /** Stable kebab id used for anchors and preview lookup. */
  id: string;
  /** Which explorer category the component files under. */
  category: CategoryId;
  /** Display name, e.g. "Button". */
  name: string;
  /** Must match the identifier exported from `@paul-portfolio/react`. */
  importName: string;
  /** One-line summary shown under the name. */
  tagline: string;
  /** How and when to reach for it. Surfaced in the hover InfoTip. */
  usage: string;
  /** Accessibility guarantees the primitive ships with out of the box. */
  a11y: string[];
  /** Real pages in this app that render this component today. May be empty. */
  usedOn: UsedOnLink[];
  /**
   * Where a primitive lives when this app doesn't render it yet. The package is
   * shared across a Next.js app, an Angular app, and Ketsup, so a component can
   * ship and be adopted elsewhere before it lands here. Required when usedOn is
   * empty so a card never claims "used nowhere".
   */
  elsewhere?: string;
};

const AI_ELSEWHERE =
  "Ships in the shared package and is exercised in Storybook; this app has not adopted it yet.";

const EFFECT_ELSEWHERE =
  "A motion or effect primitive rebuilt on the design tokens with no runtime dependency. It ships in the shared package and is rendered in this gallery, but the app hasn't wired it into a product surface yet.";

export const COMPONENTS: ComponentDoc[] = [
  {
    id: "chat-composer",
    category: "ai",
    name: "ChatComposer",
    importName: "ChatComposer",
    tagline: "An auto-growing prompt box that sends on Enter.",
    usage:
      "Use as the input for a chat or AI surface. It grows with the message, sends on Enter and inserts a newline on Shift+Enter, refuses to send an empty message, and locks the whole control while busy so a reply can't be double-sent.",
    a11y: [
      "The message field carries a real label — pass hideLabel to keep it for screen readers while hiding it visually",
      "Enter sends and Shift+Enter adds a line, so the keyboard contract is explicit rather than guessed",
      "busy and disabled lock the field and button together, keeping an accessible name throughout",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "chat-message",
    category: "ai",
    name: "ChatMessage",
    importName: "ChatMessage",
    tagline: "A chat bubble aligned and coloured by role.",
    usage:
      "Use for one turn in a conversation. Set role to user, assistant, or system to align and colour it, pass name and timestamp for the meta line, and set pending while a reply streams to show a typing indicator in place of content.",
    a11y: [
      "Each turn renders as an article, so a screen reader can navigate the conversation turn by turn",
      "The role is baked into the accessible name, so 'Assistant message' reads even when colour and alignment can't",
      "pending swaps in a live typing indicator rather than an empty bubble",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "code-block",
    category: "ai",
    name: "CodeBlock",
    importName: "CodeBlock",
    tagline: "A read-only code panel with a copy button.",
    usage:
      "Use to show a snippet a model returned or a command to run. Pass language and filename for the header, and showLineNumbers when the reader needs to reference a line — the gutter is decorative and hidden from assistive tech.",
    a11y: [
      "The copy button reports success back to assistive tech instead of changing silently",
      "Line numbers are decorative and hidden, so a screen reader reads the code, not the gutter",
      "The code sits in a real pre/code pair, keeping whitespace and structure intact",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "combobox",
    category: "forms",
    name: "Combobox",
    importName: "Combobox",
    tagline: "An accessible autocomplete over a list of options.",
    usage:
      "Use for a model or tool picker where typing to filter beats scrolling a long select. It's controlled via value and onChange; commit an option with Enter or a click.",
    a11y: [
      "Implements the ARIA combobox pattern with aria-expanded on the input",
      "aria-activedescendant announces the active option while focus stays in the field",
      "Fully keyboard operable — arrow to move, Enter to commit, Escape to close",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "command-palette",
    category: "ai",
    name: "CommandPalette",
    importName: "CommandPalette",
    tagline: "A ⌘K-style command menu, filtered as you type.",
    usage:
      "Use for a keyboard-driven action launcher. Pass open/onClose and a list of commands with labels, optional groups, icons, and keywords; type to filter, arrow to move, Enter to run, Escape to close.",
    a11y: [
      "Follows the combobox/listbox pattern — the input owns aria-activedescendant so the active command is announced without moving focus",
      "role=dialog with a required accessible name, opened only when you ask for it",
      "Escape closes it and returns control to where you were",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "rich-text-editor",
    category: "ai",
    name: "RichTextEditor",
    importName: "RichTextEditor",
    tagline: "A small formatting editor with a keyboard-driven toolbar.",
    usage:
      "Use for short rich input — a system prompt, a note, a description. Choose which controls the toolbar shows and in what order; bold, italic, and underline also respond to the usual Cmd/Ctrl shortcuts.",
    a11y: [
      "The editable region carries a required label — pass hideLabel to keep it for screen readers only",
      "Toolbar buttons are real buttons with names, reachable and operable from the keyboard",
      "Formatting shortcuts mirror the toolbar, so the mouse is never required",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "streaming-text",
    category: "ai",
    name: "StreamingText",
    importName: "StreamingText",
    tagline: "Text revealed a few characters at a time, the way a model streams.",
    usage:
      "Use to animate a model response arriving. Tune speed and interval for the pace, show a caret with cursor, and pass onDone to fire once the whole string is out.",
    a11y: [
      "Honours prefers-reduced-motion by showing the whole string at once instead of animating",
      "Announces through a polite live region, so the finished text reaches a screen reader",
      "The caret is decorative and never spoken",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "toast",
    category: "feedback",
    name: "Toast",
    importName: "ToastProvider",
    tagline: "Stacking notifications raised from anywhere via a hook.",
    usage:
      "Wrap the app in ToastProvider and call useToast().toast(...) to raise one. Set variant for tone and duration to control auto-dismiss — pass 0 to keep it until dismissed.",
    a11y: [
      "Toasts stack in a live region so screen readers announce them as they arrive",
      "Errors announce assertively, everything else politely, matching urgency to tone",
      "Each toast auto-dismisses on a timer unless you set duration to 0",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "toaster",
    category: "feedback",
    name: "Toaster",
    importName: "Toaster",
    tagline: "One app-wide notification region driven by an imperative toast().",
    usage:
      "Mount <Toaster /> once near the app root, then call toast.error(msg) (or success/warning/info) from anywhere — even outside React, like a query-client error handler. This app wires it to a global mutation-error handler so no failed write is silent.",
    a11y: [
      "Toasts stack in a labelled live region so screen readers announce them as they arrive",
      "Errors announce assertively, everything else politely, matching urgency to tone",
      "Renders nothing on the server, so it never trips SSR before the portal has a document",
    ],
    usedOn: [{ label: "ZeroProof", href: "/zeroproof" }],
  },
  {
    id: "token-usage-meter",
    category: "ai",
    name: "TokenUsageMeter",
    importName: "TokenUsageMeter",
    tagline: "A budget bar for LLM token usage, prompt and completion split out.",
    usage:
      "Use to show context-window or spend usage. Pass promptTokens, completionTokens, and maxTokens for the two-segment track, costPerMTok for an estimated cost, and warnAt to set where the near-limit tone kicks in.",
    a11y: [
      "Exposes progressbar semantics with aria-valuetext spelling out used-of-budget and percent",
      "Switches to a warning and then an over tone as usage nears and passes the budget — never colour alone",
      "The used total and percent are real text, not just the width of a bar",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "typing-dots",
    category: "ai",
    name: "TypingDots",
    importName: "TypingDots",
    tagline: "A three-dot typing indicator for chat surfaces.",
    usage:
      "Use while an assistant reply is on its way. Pass label to set what a screen reader hears — the dots themselves are pure decoration.",
    a11y: [
      "Renders as a polite status region, so the label announces without stealing focus",
      "The animated dots are decorative and hidden from assistive tech",
      "The label carries all the meaning, so nothing is lost with animation off",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "risk-score",
    category: "charts",
    name: "RiskScore",
    importName: "RiskScore",
    tagline: "A 0–100 risk score with tiered bands.",
    usage:
      "Use to show a fraud or risk score at a glance. Pass value (0–max); the band — low, medium, high, critical — is derived from the value unless you set level. detailed adds a proportional track; compact is the inline pill for a table cell or header.",
    a11y: [
      'Renders as role="meter" with the value exposed to assistive tech via aria-valuenow and a spelled-out aria-valuetext',
      "The number and the band word both show, so the tier never rides on colour alone",
      "Band tints reuse the Badge ramp/label token pairs, which are checked for contrast",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "agent-decision-card",
    category: "ai",
    name: "AgentDecisionCard",
    importName: "AgentDecisionCard",
    tagline: "The shell for an AI-made risk decision.",
    usage:
      "Use to surface an agent's verdict — approve, decline, or review — with its confidence, the signals it fired on, and the actions a reviewer can take. Composes Card, Badge, and Button.",
    a11y: [
      "Exposed as a region landmark whose accessible name carries the decision, so a screen reader can jump between verdicts",
      "The decision is a Badge word, not a bare colour, and the rationale is a real list",
      "Confidence is spelled out as text, not implied by a bar alone",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "timeline",
    category: "content",
    name: "Timeline",
    importName: "Timeline",
    tagline: "A vertical audit rail of events.",
    usage:
      "Use for a session or case history read top to bottom. Pass items with a title, time, status, and description; a status-coloured marker sits on the connecting rail.",
    a11y: [
      "Renders an ordered list, so the sequence is real to assistive tech rather than implied by layout",
      "Any non-default status also emits a screen-reader word, so the state is never carried by colour alone",
      "The marker is decorative and hidden; the title and time carry the content",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "stat-card",
    category: "charts",
    name: "StatCard",
    importName: "StatCard",
    tagline: "A dashboard KPI tile with a delta and trend.",
    usage:
      "Use for a headline metric. Pass value and an optional delta with a direction (up/down/flat); the intent colour defaults from the direction but can be set for cases where down is good. Pass trend for an inline Sparkline.",
    a11y: [
      "The delta pairs an arrow glyph and a screen-reader direction word with the colour, so up/down survives without it",
      'The trend reuses Sparkline\'s role="img" with a required label',
      "The value and label are real text on a neutral surface, not colour-coded",
    ],
    usedOn: [],
    elsewhere: AI_ELSEWHERE,
  },
  {
    id: "sparkline",
    category: "charts",
    name: "Sparkline",
    importName: "Sparkline",
    tagline: "A compact trend line with no axes, sized to sit inline.",
    usage:
      "Reach for it when the shape of a series matters and the exact values do not — inside a table cell or beside a stat. Pass data for one series or series for several. Set variant to area to fill under the line.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "bar-chart",
    category: "charts",
    name: "BarChart",
    importName: "BarChart",
    tagline: "Categorical bars, vertical or horizontal.",
    usage:
      "Use for comparing discrete categories. Pass labels alongside data, and switch orientation to horizontal when the category names are long enough to crowd a vertical axis.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "donut-chart",
    category: "charts",
    name: "DonutChart",
    importName: "DonutChart",
    tagline: "Parts of a whole, with an optional legend.",
    usage:
      "Use for a handful of slices that genuinely sum to something — four or five at most. Each datum carries its own label, value and optional colour; beyond that a BarChart reads better.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "funnel-chart",
    category: "charts",
    name: "FunnelChart",
    importName: "FunnelChart",
    tagline: "Stage-by-stage drop-off through a sequence.",
    usage:
      "Use for ordered stages where each one can only shrink — signup, activation, purchase. Set showDropOff to label the loss between stages rather than leaving the reader to subtract.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "radar-chart",
    category: "charts",
    name: "RadarChart",
    importName: "RadarChart",
    tagline: "Several measures on a shared scale, one shape per series.",
    usage:
      "Use to compare a few entities across the same axes, like a skills profile. Keep axes under about eight; past that the polygon stops being readable and a grouped BarChart wins.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "scatter-plot",
    category: "charts",
    name: "ScatterPlot",
    importName: "ScatterPlot",
    tagline: "Points in two dimensions, grouped into series.",
    usage:
      "Use to show correlation or clustering. Pass domain to pin the axes when comparing several plots side by side, so the eye is not fooled by autoscaling.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "heatmap-chart",
    category: "charts",
    name: "HeatmapChart",
    importName: "HeatmapChart",
    tagline: "A grid of values shaded by magnitude.",
    usage:
      "Use for a matrix where the pattern matters more than any single cell — activity by day and hour, cohort retention. Set showValues when the reader needs the numbers as well as the shading.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "pareto-chart",
    category: "charts",
    name: "ParetoChart",
    importName: "ParetoChart",
    tagline: "Ranked bars with a cumulative line and a threshold.",
    usage:
      "Use when the point is that a few causes dominate. Bars are sorted for you and the cumulative line crosses the threshold, which defaults to the usual 80 percent.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "gauge-chart",
    category: "charts",
    name: "GaugeChart",
    importName: "GaugeChart",
    tagline: "A single value against a range.",
    usage:
      "Use for one number that has a floor and a ceiling — utilisation, a score, capacity. Pass unit so the reading is unambiguous. For a value with no bound, a stat with a Sparkline is more honest.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "word-cloud",
    category: "charts",
    name: "WordCloud",
    importName: "WordCloud",
    tagline: "Terms sized by weight.",
    usage:
      "Use for a rough sense of what dominates a body of text. Cap it with limit — a cloud past about forty terms is decoration rather than information, and the small end becomes unreadable.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "stacked-line-chart",
    category: "charts",
    name: "StackedLineChart",
    importName: "StackedLineChart",
    tagline: "Several series over the same axis, plain or stacked.",
    usage:
      "Use for change over time across a few series. Leave variant unset to overlay them for comparison, or stack it when the total is the story and the parts are the detail.",
    a11y: [
      'Renders as role="img" with a required label, so a screen reader gets one meaningful description instead of a pile of shapes',
      "Pure SVG with no canvas, so the marks stay in the accessibility tree and scale with browser zoom",
      "Colours come from the --paul-chart-* ramp, which is checked for contrast and for deuteranopia separation",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package, drawn from the same dependency-free geometry core as its Angular twin; this app has not adopted it yet.",
  },
  {
    id: "tilt-card",
    category: "effects",
    name: "TiltCard",
    importName: "TiltCard",
    tagline: "A surface that tilts toward the pointer.",
    usage:
      "Use sparingly, for a hero or a feature card where a little depth earns attention. Tune maxTilt down for a subtler effect and enable glare for a specular highlight.",
    a11y: [
      "Honours prefers-reduced-motion and stops tilting entirely rather than easing the amount",
      "The tilt is decorative and marked aria-hidden, so it adds nothing to the accessibility tree",
      "Content inside keeps its own semantics and focus behaviour",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package and is exercised in Storybook; this app has not adopted it yet.",
  },
  {
    id: "spotlight",
    category: "effects",
    name: "Spotlight",
    importName: "Spotlight",
    tagline: "A soft light that follows the pointer across a surface.",
    usage:
      "Use on a dark panel where you want the cursor to feel like it is lighting the surface. Size and colour are tunable; keep contrast in mind since the wash sits under real content.",
    a11y: [
      "Honours prefers-reduced-motion and does not follow the pointer when it is set",
      "Purely decorative and marked aria-hidden, so screen readers never announce it",
      "Pointer-only by design, so it never traps focus or interferes with keyboard use",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package and is exercised in Storybook; this app has not adopted it yet.",
  },
  {
    id: "gradient-background",
    category: "effects",
    name: "GradientBackground",
    importName: "GradientBackground",
    tagline: "An animated multi-stop gradient behind its children.",
    usage:
      "Use as a page or section backdrop. Pass colors to match a theme, angle to set direction, and speed to slow the drift. Set animate to false for a static wash.",
    a11y: [
      "Animation can be switched off outright with the animate prop",
      "Renders behind its children without taking them out of the document flow",
      "Colour is decorative only — nothing depends on it to convey meaning",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package and is exercised in Storybook; this app has not adopted it yet.",
  },
  {
    id: "click-spark",
    category: "effects",
    name: "ClickSpark",
    importName: "ClickSpark",
    tagline: "A ring of rays bursts from the press point.",
    usage:
      "Wrap it around a control to decorate a press with a spark. It doesn't intercept the child's own click — set count to change how many rays fly out.",
    a11y: [
      "Purely decorative, so it adds nothing to the accessibility tree and never intercepts the child's click",
      "Spawns nothing under prefers-reduced-motion",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "blur-reveal",
    category: "effects",
    name: "BlurReveal",
    importName: "BlurReveal",
    tagline: "Content resolves from a soft blur as it rises in.",
    usage:
      "Wrap a heading or a line of copy to have it settle in from a blur. Pass delayMs to stagger several reveals, and as to change the element it renders.",
    a11y: [
      "Under prefers-reduced-motion the animation drops and the content is simply present",
      "The effect is a class on the real element, not a wrapper that hides it from assistive tech",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "star-border",
    category: "effects",
    name: "StarBorder",
    importName: "StarBorder",
    tagline: "A conic gradient sweeps around the border.",
    usage:
      "Wrap a card or a button to give it an animated ring. The ring takes its colour from currentColor, so set the wrapper's text colour to tint it — no prop needed.",
    a11y: [
      "Under prefers-reduced-motion the ring is a static gradient frame that never rotates",
      "Decorative border only; the wrapped content keeps its own semantics",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "shine-sweep",
    category: "effects",
    name: "ShineSweep",
    importName: "ShineSweep",
    tagline: "A specular bar sweeps across the surface.",
    usage:
      "Wrap a button or a badge to send a highlight travelling over it, the way a sheen crosses glossy hardware. Change the rendered element with as.",
    a11y: [
      "The sheen isn't rendered at all under prefers-reduced-motion",
      "Decorative overlay; the wrapped control keeps its label and behaviour",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "liquid-glass",
    category: "effects",
    name: "LiquidGlass",
    importName: "LiquidGlass",
    tagline: "A frosted iOS glass surface with a drifting highlight.",
    usage:
      "Use as a translucent panel over a busy or coloured backdrop. It frosts what's behind it while a specular highlight drifts across; change the rendered element with as.",
    a11y: [
      "Under prefers-reduced-motion the highlight holds still and the frosted surface remains",
      "The frost and sheen are decorative; content on top keeps its own contrast and semantics",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "text-loop",
    category: "effects",
    name: "TextLoop",
    importName: "TextLoop",
    tagline: "Cycles a list of phrases in place, each sliding up.",
    usage:
      "Drop it inline where one word should keep changing — 'built for speed / clarity / delight'. Pass items in order and intervalMs to set the hold.",
    a11y: [
      "Only the active phrase is exposed to assistive tech, so it reads as a single changing word rather than a run-on",
      "Under prefers-reduced-motion the slide is dropped and the phrase simply swaps",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "squish-switch",
    category: "effects",
    name: "SquishSwitch",
    importName: "SquishSwitch",
    tagline: "A toggle whose thumb squishes as it slides.",
    usage:
      "Use as an on/off control where a tactile, springy feel is worth it. Controlled via checked and onChange; label is required for its accessible name.",
    a11y: [
      "A real role=switch button — keyboard operable and announces its on/off state",
      "Under prefers-reduced-motion the squish and slide are dropped; the state still flips",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "rubber-segment",
    category: "effects",
    name: "RubberSegment",
    importName: "RubberSegment",
    tagline: "A segmented control whose indicator rubber-bands.",
    usage:
      "Use to switch between a few mutually exclusive views. The indicator overshoots and settles between segments; controlled via value and onChange.",
    a11y: [
      "A real role=radiogroup of radios, so arrow keys move the selection",
      "Under prefers-reduced-motion the indicator jumps without the elastic travel",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "liquid-carve-button",
    category: "effects",
    name: "LiquidCarveButton",
    importName: "LiquidCarveButton",
    tagline: "A button with a liquid carve that springs to the pointer.",
    usage:
      "Use as a standout call to action. A subtractive SVG mask carves the label out of the fill and independent springs chase the pointer; pass href to render a link or onClick for a button.",
    a11y: [
      "Keyboard activation stays native — it's a real button or link underneath",
      "The springs stop at rest, on disable, and under prefers-reduced-motion",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "lattice-loader",
    category: "effects",
    name: "LatticeLoader",
    importName: "LatticeLoader",
    tagline: "A grid that lights up while working, then resolves to a check or cross.",
    usage:
      "Use as a busy indicator for a discrete task. Drive it with status (working/done/error); it can show an elapsed timer and swap colours per state.",
    a11y: [
      "Renders role=status with an off-screen spoken update, so working/done/failed reaches assistive tech regardless of the animation",
      "That spoken state is what lets the animation stand down under prefers-reduced-motion",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "drift-wall",
    category: "effects",
    name: "DriftWall",
    importName: "DriftWall",
    tagline: "A wall of image tiles drifting in 3D.",
    usage:
      "Use as a lively backdrop or a gallery. Each column scrolls at its own speed, the plane tilts toward the pointer, and the tile under the cursor lifts and brightens. Pass items with image and optional href.",
    a11y: [
      "Tiles with an href are real links, reachable by keyboard, and the focused tile lifts like a hovered one",
      "Under prefers-reduced-motion the columns hold still and only the focus lift remains",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "circular-gallery",
    category: "effects",
    name: "CircularGallery",
    importName: "CircularGallery",
    tagline: "Cards on a rotating 3D cylinder you spin with a drag.",
    usage:
      "Use to show a set of images as a turntable. A drag flings it and it coasts; left alone it turns slowly. A CSS preserve-3d reinterpretation of the WebGL original — no renderer. Pass items with image and optional href.",
    a11y: [
      "Cards are real links inside a labelled role=group",
      "Under prefers-reduced-motion the auto-spin and coast are dropped — it only turns while you drag",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "path-gallery",
    category: "effects",
    name: "PathGallery",
    importName: "PathGallery",
    tagline: "Images gliding evenly along a curved path.",
    usage:
      "Use for a looping strip of imagery that follows a shape. Travel runs on CSS offset-path; pass a closed SVG path in the 600x360 viewBox, and toggle showPath to draw or hide the track.",
    a11y: [
      "Items are real links inside a labelled role=group",
      "Under prefers-reduced-motion the travel stops and the images rest along the path",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "smooth-scroll-slider",
    category: "effects",
    name: "SmoothScrollSlider",
    importName: "SmoothScrollSlider",
    tagline: "A horizontal rail of cards that grow toward centre and coast.",
    usage:
      "Use as a momentum carousel. Wheel, drag and keyboard drive it; a lerp between target and rendered offset gives the coast, and cards scale by distance from the centre. Pass slides with image and optional href; loop wraps it forever.",
    a11y: [
      "Keyboard drives the rail, not just wheel and drag",
      "Under prefers-reduced-motion the coast is removed and the rail tracks input directly, keeping the spatial centre-scaling",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "hover-image-reveal",
    category: "effects",
    name: "HoverImageReveal",
    importName: "HoverImageReveal",
    tagline: "A text menu that reveals an image per row on hover.",
    usage:
      "Use as an index or a nav where each entry has a picture. The image window trails the cursor and swaps to the active row; pass items with label, image and optional href.",
    a11y: [
      "The rows are real links; the trailing images are decorative and hidden from assistive tech",
      "Under prefers-reduced-motion the window stops trailing the pointer while hover and focus still swap the image",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "link-preview",
    category: "effects",
    name: "LinkPreview",
    importName: "LinkPreview",
    tagline: "An inline link that raises a thumbnail on hover.",
    usage:
      "Use in prose to preview where a link goes. Pass href, the child text, and a custom image (no external screenshot service); the card leans toward the pointer as it rises in.",
    a11y: [
      "The real anchor carries the link; the floating card is decorative and hidden from assistive tech",
      "Under prefers-reduced-motion the lean is dropped and the card just fades in",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "portrait-spiral-hero",
    category: "effects",
    name: "Spiral Portrait Hero",
    importName: "SpiralPortraitHero",
    tagline: "A hero whose portraits orbit the copy like planets around the sun.",
    usage:
      "Use as a page hero. Supplied images orbit the centred copy on their own rings, behind slots for heading, description, actions, navigation and an optional centrepiece; missing imagery never removes the copy. Give an image href or onClick to make it a link or button.",
    a11y: [
      "Set headingLevel so the heading fits the page outline; images are decorative unless given href or onClick, and keyboard focus brings a linked one forward",
      "The orbit holds still under prefers-reduced-motion, leaving a distributed still frame",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "perspective-hero",
    category: "effects",
    name: "Perspective Hero",
    importName: "PerspectivePortraitHero",
    tagline: "A one-point-perspective corridor with portraits as posters on the walls.",
    usage:
      "Use as a page hero with depth. A wireframe draws the far wall and edge lines to the corners, and the portraits are posters pasted on all four walls, streaming out of the centre. Same copy, navigation and action slots as the other heroes.",
    a11y: [
      "Set headingLevel so the heading fits the page outline; images are decorative unless given href or onClick, and keyboard focus brings a linked one forward",
      "The corridor holds still under prefers-reduced-motion, leaving a distributed still frame",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "corridor-hero",
    category: "effects",
    name: "Corridor Hero",
    importName: "CorridorPortraitHero",
    tagline: "A hero whose portraits fan out to both sides into a receding wall.",
    usage:
      "Use as a page hero. The portraits stream out of the centre to the left and right walls, tilting into a receding corridor — the same idea as the perspective hero without the guide lines. Same copy, navigation and action slots.",
    a11y: [
      "Set headingLevel so the heading fits the page outline; images are decorative unless given href or onClick, and keyboard focus brings a linked one forward",
      "The fan holds still under prefers-reduced-motion, leaving a distributed still frame",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "mobile-reel-hero",
    category: "effects",
    name: "Mobile Reel Hero",
    importName: "MobileReelHero",
    tagline: "A film reel you scrub with a thumb, one project a frame.",
    usage:
      "Use as a small-screen page hero. Projects load into a single film frame with a labelled range scrubber underneath, so there is no autoplay and no precision dragging. Same heading, description and action slots as the portrait heroes.",
    a11y: [
      "The scrubber is a native range input with an aria-valuetext naming the project and its position, and a live region announces each frame",
      "Set headingLevel so the heading fits the page outline; the frame stays put with no imagery and keeps the project action after one fails",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "mobile-orbit-hero",
    category: "effects",
    name: "Mobile Orbit Hero",
    importName: "MobileOrbitHero",
    tagline: "A project constellation you turn with a thumb or tap by number.",
    usage:
      "Use as a small-screen page hero. Projects sit as numbered satellites on a ring you rotate by dragging, with a preview in the centre; tapping a satellite selects it without a drag. Same heading, description and action slots as the portrait heroes.",
    a11y: [
      "The dial is a keyboard-rotatable slider with aria-valuenow, tappable numbered markers, and a live region naming the selected project",
      "Set headingLevel so the heading fits the page outline; the ring holds still under prefers-reduced-motion and survives empty or failed imagery",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "mobile-lens-hero",
    category: "effects",
    name: "Mobile Lens Hero",
    importName: "MobileLensHero",
    tagline: "A magnifying glass you drag across a contact sheet of work.",
    usage:
      "Use as a small-screen page hero. A movable lens floats over a grid of project thumbnails; drag it across the sheet to inspect one, or use the centred next control and keyboard moves instead of dragging. Same heading, description and action slots as the portrait heroes.",
    a11y: [
      "The lens offers a centred next control and keyboard moves as alternatives to dragging, and a live region names the project under it",
      "Set headingLevel so the heading fits the page outline; the sheet holds up with empty or failed imagery",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "light-bloom",
    category: "effects",
    name: "LightBloom",
    importName: "LightBloom",
    tagline: "A soft glow blooming from one edge, breathing slowly.",
    usage:
      "Use as a decorative backdrop; pass content to layer over it. A CSS radial-bloom reinterpretation of the WebGL original, with an optional shaft variant and a spread control; the origin slides toward the pointer.",
    a11y: [
      "The glow is decorative and hidden from assistive tech",
      "Under prefers-reduced-motion the breathing, drift and pointer-follow all stop",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "particle-text",
    category: "effects",
    name: "ParticleText",
    importName: "ParticleText",
    tagline: "Text assembled from a drifting cloud of particles.",
    usage:
      "Use for a headline with motion. The built-in 2D canvas draws the particles — no renderer or dependency — and they scatter away from the pointer. Pass text plus optional colour and fontSize.",
    a11y: [
      "The canvas is decorative; the container is role=img labelled with the text, so the words are read regardless",
      "Under prefers-reduced-motion the particles are drawn at rest",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "refine-frame",
    category: "effects",
    name: "RefineFrame",
    importName: "RefineFrame",
    tagline: "Content resolving from blurred to sharp as its status advances.",
    usage:
      "Use as an image-generation preview. Drive it with status (queued, generating, refining, complete, error); CSS filter and scale sharpen per stage, with a glint while it works and a retry on error.",
    a11y: [
      "A role=status pill announces the current stage in words, not just colour",
      "Under prefers-reduced-motion the sweep is dropped and the spinner pulses instead of spinning",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "folder-float",
    category: "effects",
    name: "FolderFloat",
    importName: "FolderFloat",
    tagline: "A folder whose contents fan out and gently bob.",
    usage:
      "Use as a playful grouping of links. Pass a label and items; give an item an href to make it a real link, and accent to set the folder colour.",
    a11y: [
      "A labelled role=group; chips are real links when given an href",
      "Under prefers-reduced-motion the bob stops and the chips rest",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "botanical-text",
    category: "effects",
    name: "BotanicalText",
    importName: "BotanicalText",
    tagline: "Text grown from tiny swaying flowers and leaves.",
    usage:
      "Use for a decorative headline. The built-in 2D canvas samples the text and draws blooms at each point — no WebGL — and blooms near the pointer open larger. Tune bloomHue, leafHue and leafMix.",
    a11y: [
      "The canvas is decorative; the container is role=img labelled with the text",
      "Under prefers-reduced-motion the sway stops and the blooms are drawn at rest",
    ],
    usedOn: [],
    elsewhere: EFFECT_ELSEWHERE,
  },
  {
    id: "button",
    category: "forms",
    name: "Button",
    importName: "Button",
    tagline: "The primary action primitive — five variants, four sizes.",
    usage:
      "Use for any click action. Set variant to signal intent (primary/danger) and pass loading to show a spinner without swapping components. Renders as a link when given href.",
    a11y: [
      "Real <button> element, keyboard operable with a visible focus ring",
      "loading and disabled states keep an accessible name",
      "Intent is never carried by color alone",
    ],
    usedOn: [
      { label: "Calendar", href: "/calendar" },
      { label: "Player stats", href: "/fantasy/nba/player/stats" },
      { label: "Agent patterns", href: "/learn/ai-agent-patterns" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    id: "icon-button",
    category: "forms",
    name: "IconButton",
    importName: "IconButton",
    tagline: "A square, icon-only button that still names itself.",
    usage:
      "Use for compact toolbar actions where an icon reads clearly. Always pass an accessible label so screen readers announce the action, not the glyph.",
    a11y: [
      "Requires an accessible label — no unlabelled icons",
      "Same focus ring and hit target as Button",
    ],
    usedOn: [
      { label: "Calendar", href: "/calendar" },
      { label: "Work portfolio", href: "/work-portfolio" },
    ],
  },
  {
    id: "input",
    category: "forms",
    name: "Input",
    importName: "Input",
    tagline: "Labelled text field with error and helper text baked in.",
    usage:
      "Use for single-line text entry. The label is required and wired to the field; pass error to flip into the invalid state and helperText for hints. Use hideLabel when the context already names it.",
    a11y: [
      "Label tied to the input with a generated id",
      "error sets aria-invalid and announces via role=alert",
      "helperText and counters linked with aria-describedby",
    ],
    usedOn: [
      { label: "Event search", href: "/calendar/events" },
      { label: "GraphQL Pokédex", href: "/graphql" },
      { label: "TCG browser", href: "/tcg/pokemon" },
    ],
  },
  {
    id: "textarea",
    category: "forms",
    name: "Textarea",
    importName: "Textarea",
    tagline: "Multi-line field with a live character counter.",
    usage:
      "Use for longer free text like notes or descriptions. Pass maxLength to get an aria-live counter for free, and error/helperText mirror the Input contract.",
    a11y: [
      "Live character count announced politely via aria-live",
      "Shared error and describedby wiring with Input",
    ],
    usedOn: [
      { label: "Calendar", href: "/calendar" },
      { label: "Work portfolio", href: "/work-portfolio" },
    ],
  },
  {
    id: "select",
    category: "forms",
    name: "Select",
    importName: "Select",
    tagline: "Labelled native select tuned for filter rows.",
    usage:
      "Use inside a FilterBar for a compact, horizontal labelled dropdown. It is the native select, so it inherits platform keyboarding and mobile pickers for free.",
    a11y: [
      "Native <select> with a bound visible label",
      "Full platform keyboard and mobile picker support",
    ],
    usedOn: [
      { label: "Player stats", href: "/fantasy/nba/player/stats" },
      { label: "Matchups", href: "/fantasy/nba/matchups" },
    ],
  },
  {
    id: "filter-bar",
    category: "forms",
    name: "FilterBar",
    importName: "FilterBar",
    tagline: "A labelled landmark region that holds a row of filters.",
    usage:
      "Wrap a group of Selects so assistive tech announces the whole filter set as one named region. Pass a descriptive label like 'Team and player filters'.",
    a11y: [
      "Renders a named landmark region",
      "Wrapping row stays usable at every width",
    ],
    usedOn: [
      { label: "Player stats", href: "/fantasy/nba/player/stats" },
      { label: "Matchups", href: "/fantasy/nba/matchups" },
    ],
  },
  {
    id: "chip",
    category: "forms",
    name: "Chip",
    importName: "Chip",
    tagline: "A compact tag or badge, optionally clickable or removable.",
    usage:
      "Use for tags, filters, and inline labels. Pass onClick to make it a button, onRemove to add a dismiss control, and color to theme it (text flips to white automatically).",
    a11y: [
      "Renders a real <button> when interactive",
      "Remove control gets an accessible 'Remove {label}' name",
    ],
    usedOn: [{ label: "Card detail", href: "/tcg/pokemon" }],
  },
  {
    id: "modal",
    category: "feedback",
    name: "Modal",
    importName: "Modal",
    tagline: "A portalled dialog with a full focus trap.",
    usage:
      "Use for focused tasks and confirmations. Pass open/onClose and an aria-label or aria-labelledby. It traps focus, locks scroll, and restores focus on close.",
    a11y: [
      "role=dialog with aria-modal and a required label",
      "Focus trap plus focus restoration on close",
      "Escape and backdrop click both close it",
    ],
    usedOn: [
      { label: "Calendar", href: "/calendar" },
      { label: "Player stats", href: "/fantasy/nba/player/stats" },
      { label: "Operator dashboard", href: "/operator" },
    ],
  },
  {
    id: "guided-tour",
    category: "feedback",
    name: "Guided tour",
    importName: "GuidedTour",
    tagline: "A click-through coach-mark tour.",
    usage:
      "Walk a newcomer through a page. Pass open/onClose and steps; each step spotlights a target element by id or shows a centred card, with Back, Next and Skip controls.",
    a11y: [
      "role=dialog with a required label",
      "Focus moves into the card; Escape closes it",
      "Spotlight and scrim honour prefers-reduced-motion",
    ],
    usedOn: [
      { label: "Fantasy", href: "/fantasy/nba" },
      { label: "Vitals", href: "/vitals" },
      { label: "Operator dashboard", href: "/operator" },
    ],
  },
  {
    id: "tooltip",
    category: "feedback",
    name: "Tooltip",
    importName: "Tooltip",
    tagline: "A hover and focus label that escapes clipping containers.",
    usage:
      "Use for short, plain-text hints on an element. It shows on hover and focus, so keyboard users get it too, and positions with fixed coordinates to punch through overflow:hidden.",
    a11y: [
      "role=tooltip linked via aria-describedby while visible",
      "Opens on focus, dismisses on Escape",
    ],
    usedOn: [{ label: "Calendar", href: "/calendar" }],
  },
  {
    id: "info-tip",
    category: "feedback",
    name: "InfoTip",
    importName: "InfoTip",
    tagline: "A small ⓘ badge with a rich multi-line popover.",
    usage:
      "Use for richer, multi-line explanations attached to a subtle marker. The trigger is a labelled button, so it is reachable and dismissible from the keyboard.",
    a11y: [
      "Trigger is a button labelled 'More information'",
      "Popover uses role=tooltip and closes on Escape",
    ],
    usedOn: [{ label: "Calendar", href: "/calendar" }],
  },
  {
    id: "ticker",
    category: "charts",
    name: "Ticker",
    importName: "Ticker",
    tagline: "A looping horizontal strip, as a real scroller or a marquee.",
    usage:
      "Use for a moving row of items. scroll mode is an accessible, auto-scrolling container where every item stays reachable; marquee mode is a decorative, aria-hidden loop for pure flavour. Both honour reduced motion.",
    a11y: [
      "scroll mode is a labelled, keyboard-reachable scroll region",
      "marquee mode is aria-hidden decoration, never a content trap",
      "Ambient motion stops for prefers-reduced-motion",
    ],
    usedOn: [{ label: "Work portfolio", href: "/work-portfolio" }],
  },
  {
    id: "card",
    category: "content",
    name: "Card",
    importName: "Card",
    tagline: "A surface container with Header, Body, and Footer slots.",
    usage:
      "Use to group related content on a raised surface. Compose Card.Header / Card.Body / Card.Footer, and set variant to interactive when the whole card is a link or button.",
    a11y: [
      "Plain container by default — adds no unexpected semantics",
      "interactive variant keeps a visible focus ring",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package; this app still uses its own local card wrapper.",
  },
  {
    id: "badge",
    category: "content",
    name: "Badge",
    importName: "Badge",
    tagline: "A small status marker — dot, pill, or starburst seal.",
    usage:
      "Use for compact status like success/warning/error/info. Pass dot for a minimal indicator or starburst for a 'new'/'beta' seal. Keep the text short.",
    a11y: [
      "Status is never carried by colour alone — text backs it up",
      "Decorative dot is hidden from assistive tech",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package; this app renders local status pills for now.",
  },
  {
    id: "avatar",
    category: "content",
    name: "Avatar",
    importName: "Avatar",
    tagline: "A user image with sizes and an initials fallback.",
    usage:
      "Use to represent a person or entity. Pass src with a descriptive alt; when the image is missing it falls back to initials from fallback, so it never renders a broken image.",
    a11y: [
      "alt names the person when an image loads",
      "Falls back to text initials, not a broken-image icon",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package; used for profile chrome in the Angular app and Ketsup, not yet here.",
  },
  {
    id: "switch",
    category: "forms",
    name: "Switch",
    importName: "Switch",
    tagline: "An on/off toggle with a real switch role.",
    usage:
      "Use for an immediate on/off setting (not a form submit). Controlled via checked and onCheckedChange, and it needs an aria-label since it has no text of its own.",
    a11y: [
      "role=switch with aria-checked announces its state",
      "Keyboard operable with a visible focus ring",
    ],
    usedOn: [],
    elsewhere: "Ships in the shared package; not yet adopted in this app.",
  },
  {
    id: "spinner",
    category: "feedback",
    name: "Spinner",
    importName: "Spinner",
    tagline: "An indeterminate loading spinner that announces itself.",
    usage:
      "Use for short, indeterminate waits. It renders as a live status region, so screen readers hear that something is loading; pass label to customise the announcement.",
    a11y: [
      "Live status region announces the loading state",
      "Default 'Loading' label, overridable",
    ],
    usedOn: [],
    elsewhere: "Ships in the shared package; not yet adopted in this app.",
  },
  {
    id: "skeleton",
    category: "feedback",
    name: "Skeleton",
    importName: "Skeleton",
    tagline: "A shimmering placeholder in text, circle, or rect shapes.",
    usage:
      "Use to hold layout while content loads, so there's no shift when it arrives. Pick the variant that matches what's coming and size it with width/height.",
    a11y: [
      "Purely decorative — hidden from assistive tech",
      "Reserves space so content doesn't jump on load",
    ],
    usedOn: [],
    elsewhere:
      "Ships in the shared package; this app hand-rolls its loading skeletons today.",
  },
  {
    id: "divider",
    category: "content",
    name: "Divider",
    importName: "Divider",
    tagline: "A thin rule that separates content, either axis.",
    usage:
      "Use to divide sections. Renders an <hr> with an implicit separator role; pass orientation='vertical' for use inside a flex row.",
    a11y: [
      "Real <hr> with an implicit role=separator",
      "Orientation is exposed, not just visual",
    ],
    usedOn: [],
    elsewhere: "Ships in the shared package; not yet adopted in this app.",
  },
  {
    id: "visually-hidden",
    category: "content",
    name: "VisuallyHidden",
    importName: "VisuallyHidden",
    tagline: "Text that's off-screen for sight but read by screen readers.",
    usage:
      "Use to name something that's visually obvious but has no text — an icon-only control, or extra context for a link. The content stays in the accessibility tree while staying invisible on screen.",
    a11y: [
      "Content stays in the accessibility tree, hidden visually",
      "The standard way to caption icon-only UI",
    ],
    usedOn: [],
    elsewhere: "Ships in the shared package; not yet adopted in this app.",
  },
];

/** A single design token surfaced in the tokens gallery. */
/**
 * The component of the day. Seeded from the UTC day number so every render
 * within one day agrees (static HTML included), and multiplied by a prime
 * coprime to any realistic catalog length so consecutive days hop around the
 * catalog instead of walking it in order.
 */
export function spotlightFor(date: Date): ComponentDoc {
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return COMPONENTS[(dayNumber * 31) % COMPONENTS.length];
}

export type TokenSwatch = { var: string; label: string };

/** A named color ramp expressed as css custom property names. */
export type ColorScale = { name: string; steps: string[] };

const RAMP = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

const scale = (name: string, prefix: string): ColorScale => ({
  name,
  steps: RAMP.map((step) => `--color-${prefix}-${step}`),
});

export const COLOR_SCALES: ColorScale[] = [
  scale("Primary", "primary"),
  scale("Secondary", "secondary"),
  scale("Neutral", "neutral"),
  scale("Success", "success"),
  scale("Warning", "warning"),
  scale("Error", "error"),
];

export const RADIUS_TOKENS: TokenSwatch[] = [
  { var: "--radius-sm", label: "sm" },
  { var: "--radius-md", label: "md" },
  { var: "--radius-lg", label: "lg" },
  { var: "--radius-xl", label: "xl" },
  { var: "--radius-2xl", label: "2xl" },
  { var: "--radius-full", label: "full" },
];

export const SHADOW_TOKENS: TokenSwatch[] = [
  { var: "--shadow-xs", label: "xs" },
  { var: "--shadow-sm", label: "sm" },
  { var: "--shadow-md", label: "md" },
  { var: "--shadow-lg", label: "lg" },
  { var: "--shadow-xl", label: "xl" },
  { var: "--shadow-2xl", label: "2xl" },
];

/** The type scale, expressed as the app's font-size custom properties. */
export const TYPOGRAPHY_TOKENS: TokenSwatch[] = [
  { var: "--text-xs", label: "xs" },
  { var: "--text-sm", label: "sm" },
  { var: "--text-base", label: "base" },
  { var: "--text-lg", label: "lg" },
  { var: "--text-xl", label: "xl" },
  { var: "--text-2xl", label: "2xl" },
  { var: "--text-3xl", label: "3xl" },
  { var: "--text-4xl", label: "4xl" },
  { var: "--text-5xl", label: "5xl" },
];

// The button playground's vocabulary lives in ./buttonSnippet, its own leaf
// module, so the client-side playground island can import it without dragging
// this whole manifest into the bundle. Import it from there; a compatibility
// re-export here would be dead code the deadexports gate rightly flags.
