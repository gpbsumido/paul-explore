import type { ButtonVariant, ButtonSize } from "@/components/ui/Button";

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

export const COMPONENTS: ComponentDoc[] = [
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
    elsewhere: "Ships in the shared package; this app still uses its own local card wrapper.",
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
    elsewhere: "Ships in the shared package; this app renders local status pills for now.",
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
    elsewhere: "Ships in the shared package; used for profile chrome in the Angular app and Ketsup, not yet here.",
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
    elsewhere: "Ships in the shared package; this app hand-rolls its loading skeletons today.",
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

/** The live state driven by the Button playground controls. */
export type ButtonPlaygroundState = {
  variant: ButtonVariant;
  size: ButtonSize;
  loading: boolean;
  disabled: boolean;
  label: string;
};

export const BUTTON_VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "danger",
];

export const BUTTON_SIZES: ButtonSize[] = ["xs", "sm", "md", "lg"];

/**
 * Turns the playground state into the exact JSX a developer would write. Props
 * left at their component defaults (primary/md, no loading/disabled) are
 * omitted so the snippet reads like real, minimal code rather than an
 * exhaustive prop dump.
 */
export function buildButtonSnippet(state: ButtonPlaygroundState): string {
  const parts: string[] = [];
  if (state.variant !== "primary") parts.push(`variant="${state.variant}"`);
  if (state.size !== "md") parts.push(`size="${state.size}"`);
  if (state.loading) parts.push("loading");
  if (state.disabled) parts.push("disabled");

  const attrs = parts.length > 0 ? ` ${parts.join(" ")}` : "";
  return `<Button${attrs}>${state.label}</Button>`;
}
