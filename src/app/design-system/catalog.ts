/**
 * The catalog behind the /design-system showcase. It's plain data so the page
 * stays declarative and a test can prove every entry lines up with a real
 * export from the shared UI barrel and a real route in the app. Think of it as
 * a hand-written Storybook manifest.
 */

/** A link to a live page in the app where a component actually ships. */
export type UsedOnLink = { label: string; href: string };

/** One documented primitive from the shared design system. */
export type ComponentDoc = {
  /** Stable kebab id used for anchors and preview lookup. */
  id: string;
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

export const COMPONENTS: ComponentDoc[] = [
  {
    id: "chat-composer",
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
    id: "token-usage-meter",
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
    id: "sparkline",
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
    id: "button",
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
    id: "tooltip",
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
