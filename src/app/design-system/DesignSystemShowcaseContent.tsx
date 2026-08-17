"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  FilterBar,
  Chip,
  Modal,
  Tooltip,
  InfoTip,
} from "@/components/ui";
// These primitives ship in the package but this app doesn't wrap them yet, so
// the gallery renders them straight from @paul-portfolio/react — the source of
// truth the showcase exists to reflect.
import {
  Avatar,
  Badge,
  BarChart,
  Card,
  Divider,
  DonutChart,
  FunnelChart,
  GaugeChart,
  GradientBackground,
  HeatmapChart,
  ParetoChart,
  RadarChart,
  ScatterPlot,
  Skeleton,
  Sparkline,
  Spinner,
  Spotlight,
  StackedLineChart,
  Switch,
  Ticker,
  TiltCard,
  VisuallyHidden,
  WordCloud,
} from "@paul-portfolio/react";
import {
  COMPONENTS,
  COLOR_SCALES,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  TYPOGRAPHY_TOKENS,
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  buildButtonSnippet,
  type ButtonPlaygroundState,
  type ComponentDoc,
} from "./catalog";
import { MOTION_PRIMITIVES, type MotionPrimitiveDoc } from "./motionPrimitives";
import TextReveal from "@/components/motion/TextReveal";
import TextScramble from "@/components/motion/TextScramble";
import ScrollProgress from "@/components/motion/ScrollProgress";
import MagneticButton from "@/components/motion/MagneticButton";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import BlobBackground from "@/components/motion/BlobBackground";
import SpotlightCard from "@/components/motion/SpotlightCard";
import GradientMesh from "@/components/motion/GradientMesh";
import LoopingDemo from "./LoopingDemo";
import { ACCENT_BAND } from "@/lib/accentBand";

const ACCENT = ACCENT_BAND.verdigris;

/** The pitch — why a shared design system is worth adopting. */
const BENEFITS: { title: string; body: string }[] = [
  {
    title: "One source of truth",
    body: "Tokens live in CSS custom properties and flow into Tailwind, CSS Modules, and inline styles. Change a value once, every surface updates.",
  },
  {
    title: "Accessible by default",
    body: "Focus traps, labelled controls, live regions, and Escape-to-close ship inside the primitives, so teams get them for free instead of re-deriving them.",
  },
  {
    title: "Framework agnostic",
    body: "The same tokens and component styles back this Next.js app, a sibling Angular app, and Ketsup through thin, typed wrappers. Publish once to npm, adopt anywhere — no lock-in to one renderer.",
  },
  {
    title: "Tested and versioned",
    body: "Every primitive has an axe scan and behaviour tests, and the packages are published to npm so upgrades are deliberate, not accidental.",
  },
];

/** Page-level accessibility guarantees shown in the a11y section. */
const A11Y_NOTES: string[] = [
  "Semantic HTML first — real buttons, labels, and landmarks before any ARIA.",
  "Every interactive control is keyboard operable with a visible focus ring.",
  "Dialogs trap focus, restore it on close, and dismiss on Escape.",
  "Colour never carries meaning alone; text and icons back it up.",
  "Motion respects prefers-reduced-motion across the whole system.",
];

function StarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5 20.4l1.4-6.8L1.3 9l6.9-.7L12 2z" />
    </svg>
  );
}

/**
 * Section wrapper that fades up on mount. Uses the CSS reveal so the content
 * paints straight away instead of sitting at opacity:0 until hydration, and the
 * reduced-motion case is handled by the @media rule on .reveal-up in globals.
 */
function Reveal({
  children,
  id,
  className,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={["reveal-up", className].filter(Boolean).join(" ")}
    >
      {children}
    </section>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Motion primitives — the app's own, documented alongside the package's
// ---------------------------------------------------------------------------

/** A live demo per primitive, so the card shows the thing rather than describing it. */
/**
 * A scroll bar needs something to scroll. The page's own instance is pinned to
 * the top of the viewport, which is the right place for it and the wrong place
 * to demonstrate it from: by the time you reach this card the bar is off
 * screen, so the card could only ever describe it. This is the real component
 * tracking a real scrollable box, small enough to fit in the frame.
 */
function ScrollProgressDemo() {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-lg border border-border">
        <ScrollProgress container={box} height={3} />
        {/* A scrollable area has to be reachable by keyboard, so it is a named
            region with a tab stop rather than a bare div: someone who cannot
            drag a scrollbar still needs to be able to scroll this. */}
        <div
          ref={box}
          role="region"
          aria-label="Scrollable example"
          tabIndex={0}
          className="h-20 overflow-y-auto px-3 pt-3 pb-2 text-sm text-muted focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
        >
          <p>Scroll this box. The bar along its top edge is the component.</p>
          <p className="mt-2">
            It reads the scroll position of whatever element it is given, so a
            panel can show its own progress rather than the page&rsquo;s.
          </p>
          <p className="mt-2">
            The page&rsquo;s own instance is still up at the very top of this
            window, tracking the article you are reading now.
          </p>
          <p className="mt-2">That is the end of the example.</p>
        </div>
      </div>
    </div>
  );
}

function MotionPrimitiveDemo({ id }: { id: string }) {
  if (id === "text-reveal") {
    return (
      <LoopingDemo label="text reveal">
        <TextReveal as="p" per="word" className="text-lg font-semibold">
          Verdigris and ember
        </TextReveal>
      </LoopingDemo>
    );
  }
  if (id === "text-scramble") {
    return (
      <LoopingDemo label="text scramble">
        <TextScramble
          text="design language"
          trigger="inView"
          className="font-mono text-lg font-semibold"
        />
      </LoopingDemo>
    );
  }
  if (id === "scroll-progress") {
    return <ScrollProgressDemo />;
  }
  if (id === "magnetic-button") {
    return (
      <MagneticButton>
        <Button>Hover me</Button>
      </MagneticButton>
    );
  }
  if (id === "animated-number") {
    return (
      <LoopingDemo label="animated number">
        <AnimatedNumber
          value={2454}
          format={(n) => n.toLocaleString()}
          className="text-3xl font-bold tabular-nums text-foreground"
        />
      </LoopingDemo>
    );
  }
  if (id === "blob-background") {
    return (
      // w-full matters: the preview frame is a flex row, and a flex item whose
      // only content is absolutely positioned collapses to zero width.
      <div className="relative h-24 w-full overflow-hidden rounded-xl">
        <BlobBackground seeds={[12, 34]} />
      </div>
    );
  }
  if (id === "spotlight-card") {
    return (
      <SpotlightCard accent="var(--color-feature-craft)" className="p-4">
        <p className="text-sm text-foreground">Move the cursor across me.</p>
      </SpotlightCard>
    );
  }
  if (id === "gradient-mesh") {
    return (
      <div className="relative h-24 w-full overflow-hidden rounded-xl">
        <GradientMesh />
      </div>
    );
  }
  return null;
}

function MotionPrimitiveCard({
  primitive,
}: {
  primitive: MotionPrimitiveDoc;
}) {
  return (
    <div className="glass-card flex flex-col gap-3 rounded-2xl p-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          {primitive.name}
        </h3>
        <p className="mt-1 text-sm text-muted">{primitive.tagline}</p>
      </div>
      <div className="flex min-h-[6rem] items-center justify-center rounded-xl border border-border bg-surface p-4">
        <MotionPrimitiveDemo id={primitive.id} />
      </div>
      <dl className="space-y-1 text-xs text-muted">
        <div className="flex gap-2">
          <dt className="font-semibold text-foreground">Reduced motion</dt>
          <dd>{primitive.reducedMotion}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold text-foreground">Import</dt>
          <dd className="font-mono">{primitive.importPath}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted">
        Ships on{" "}
        <span className="font-mono text-foreground">{primitive.usedOn}</span>,
        the landing page these were built for.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Button playground — the interactive "controls" surface
// ---------------------------------------------------------------------------

function ButtonPlayground() {
  const [state, setState] = useState<ButtonPlaygroundState>({
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
    label: "Click me",
  });

  const set = <K extends keyof ButtonPlaygroundState>(
    key: K,
    value: ButtonPlaygroundState[K],
  ) => setState((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <FilterBar
          label="Button playground controls"
          className="flex-wrap gap-4"
        >
          <Select
            label="Variant"
            value={state.variant}
            onChange={(e) =>
              set("variant", e.target.value as ButtonPlaygroundState["variant"])
            }
          >
            {BUTTON_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
          <Select
            label="Size"
            value={state.size}
            onChange={(e) =>
              set("size", e.target.value as ButtonPlaygroundState["size"])
            }
          >
            {BUTTON_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FilterBar>

        <div className="flex flex-wrap items-center gap-5">
          <label className="paul-touch-min flex min-h-11 items-center gap-2 text-sm text-foreground sm:min-h-0">
            <input
              type="checkbox"
              checked={state.loading}
              onChange={(e) => set("loading", e.target.checked)}
              className="paul-touch-target h-4 w-4 accent-primary-500"
            />
            Loading
          </label>
          <label className="paul-touch-min flex min-h-11 items-center gap-2 text-sm text-foreground sm:min-h-0">
            <input
              type="checkbox"
              checked={state.disabled}
              onChange={(e) => set("disabled", e.target.checked)}
              className="paul-touch-target h-4 w-4 accent-primary-500"
            />
            Disabled
          </label>
        </div>

        <Input
          label="Label"
          value={state.label}
          onChange={(e) => set("label", e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex min-h-24 items-center justify-center rounded-xl border border-border bg-surface p-6">
          <Button
            variant={state.variant}
            size={state.size}
            loading={state.loading}
            disabled={state.disabled}
          >
            {state.label || "Button"}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-border bg-neutral-900 p-4 text-[13px] leading-relaxed text-neutral-100 dark:bg-black/60">
          <code>{buildButtonSnippet(state)}</code>
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live examples for each gallery card
// ---------------------------------------------------------------------------

function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Open the dialog
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="ds-modal-title"
      >
        <h4 id="ds-modal-title" className="text-lg font-bold text-foreground">
          Example dialog
        </h4>
        <p className="mt-2 text-sm text-muted">
          Focus is trapped here. Tab stays inside, Escape closes, and focus
          returns to the trigger when you leave.
        </p>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}

function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <label className="paul-touch-min flex min-h-11 items-center gap-2 text-sm text-foreground sm:min-h-0">
      <Switch
        checked={on}
        onCheckedChange={setOn}
        aria-label="Enable notifications"
      />
      Notifications {on ? "on" : "off"}
    </label>
  );
}

function ChipDemo() {
  const [tags, setTags] = useState(["Electric", "Flying", "Psychic"]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          color={ACCENT}
          size="md"
          onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
        />
      ))}
      {tags.length === 0 && (
        <span className="text-sm text-muted">
          All removed — refresh to reset.
        </span>
      )}
    </div>
  );
}

/** Keyed by component id so each gallery card can render itself live. */
const PREVIEWS: Record<string, ReactNode> = {
  // The charts and the three decorative components were catalogued and never
  // rendered. The gallery looks up PREVIEWS[id], and a missing key is not an
  // error -- it is undefined, so the card laid out perfectly with an empty
  // frame where the component should be. They sit first in the catalog, so the
  // page opened on a column of blank boxes and only looked alive further down.
  // Sample data is small and hand-written so each shape reads at preview size.
  sparkline: (
    <Sparkline data={[4, 9, 6, 12, 10, 16, 14]} label="Weekly signups" />
  ),
  "bar-chart": (
    <BarChart data={[12, 19, 8, 15, 11]} label="Posts per weekday" />
  ),
  "donut-chart": (
    <DonutChart
      label="Traffic by source"
      data={[
        { label: "Search", value: 48 },
        { label: "Direct", value: 30 },
        { label: "Referral", value: 22 },
      ]}
    />
  ),
  "funnel-chart": (
    <FunnelChart
      label="Signup funnel"
      data={[
        { label: "Visited", value: 1000 },
        { label: "Started", value: 420 },
        { label: "Finished", value: 180 },
      ]}
    />
  ),
  "radar-chart": (
    <RadarChart
      label="Skill coverage"
      axes={["Perf", "A11y", "Tests", "Types", "Docs"]}
      data={[{ label: "Now", values: [8, 9, 7, 9, 6] }]}
      max={10}
    />
  ),
  "scatter-plot": (
    <ScatterPlot
      label="Load time against payload"
      series={[
        {
          label: "Routes",
          points: [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
            { x: 4, y: 3 },
            { x: 6, y: 7 },
            { x: 8, y: 6 },
          ],
        },
      ]}
    />
  ),
  "heatmap-chart": (
    <HeatmapChart
      label="Commits by day and week"
      colLabels={["M", "T", "W", "T", "F"]}
      rows={[
        { label: "W1", values: [1, 4, 2, 6, 3] },
        { label: "W2", values: [5, 2, 7, 3, 8] },
      ]}
    />
  ),
  "pareto-chart": (
    <ParetoChart
      label="Errors by cause"
      data={[
        { label: "Timeout", value: 42 },
        { label: "Parse", value: 20 },
        { label: "Auth", value: 12 },
        { label: "Other", value: 6 },
      ]}
    />
  ),
  "gauge-chart": <GaugeChart label="P75 LCP budget used" value={68} unit="%" />,
  "word-cloud": (
    <WordCloud
      label="Write-up topics"
      terms={[
        { text: "performance", weight: 9 },
        { text: "testing", weight: 7 },
        { text: "tokens", weight: 6 },
        { text: "contrast", weight: 5 },
        { text: "bundle", weight: 4 },
      ]}
    />
  ),
  "stacked-line-chart": (
    <StackedLineChart
      label="Weekly page loads by device"
      series={[
        { label: "Desktop", values: [6, 8, 7, 10, 12] },
        { label: "Mobile", values: [4, 5, 9, 8, 11] },
      ]}
    />
  ),
  "tilt-card": (
    <TiltCard className="rounded-xl border border-border bg-surface-raised p-4 text-sm">
      Hover me
    </TiltCard>
  ),
  spotlight: (
    <Spotlight className="rounded-xl border border-border bg-surface-raised p-4 text-sm">
      Move the cursor across me
    </Spotlight>
  ),
  "gradient-background": (
    <GradientBackground className="w-full rounded-xl p-4 text-sm text-foreground">
      Animated gradient
    </GradientBackground>
  ),
  button: (
    <div className="flex flex-wrap gap-2">
      <Button size="sm">Primary</Button>
      <Button variant="secondary" size="sm">
        Secondary
      </Button>
      <Button variant="outline" size="sm">
        Outline
      </Button>
      <Button variant="danger" size="sm">
        Danger
      </Button>
    </div>
  ),
  "icon-button": (
    <IconButton aria-label="Add to favourites">
      <StarIcon />
    </IconButton>
  ),
  input: <Input label="Email" type="email" placeholder="you@example.com" />,
  textarea: (
    <Textarea label="Notes" maxLength={80} placeholder="Type a note…" />
  ),
  select: (
    <FilterBar label="Example filters">
      <Select label="Team" defaultValue="bos">
        <option value="bos">Boston</option>
        <option value="lal">LA Lakers</option>
      </Select>
    </FilterBar>
  ),
  "filter-bar": (
    <FilterBar label="Team and season filters">
      <Select label="Team" defaultValue="bos">
        <option value="bos">Boston</option>
        <option value="lal">LA Lakers</option>
      </Select>
      <Select label="Season" defaultValue="2025">
        <option value="2025">2025</option>
        <option value="2024">2024</option>
      </Select>
    </FilterBar>
  ),
  chip: <ChipDemo />,
  modal: <ModalDemo />,
  tooltip: (
    <Tooltip content="Fixed-position, keyboard reachable" delay={120}>
      <Button variant="outline" size="sm">
        Hover or focus me
      </Button>
    </Tooltip>
  ),
  "info-tip": (
    <span className="inline-flex items-center gap-2 text-sm text-foreground">
      Storage limit
      <InfoTip>
        Rich, multi-line help that stays reachable from the keyboard and closes
        on Escape.
      </InfoTip>
    </span>
  ),
  ticker: (
    <Ticker label="Recent work" mode="marquee" className="w-full">
      <span className="px-3 text-sm text-foreground">Dashboards</span>
      <span className="px-3 text-sm text-foreground">Onboarding</span>
      <span className="px-3 text-sm text-foreground">Campaigns</span>
      <span className="px-3 text-sm text-foreground">Design system</span>
    </Ticker>
  ),
  card: (
    <Card variant="elevated" className="w-full">
      <Card.Header>
        <span className="text-sm font-semibold text-foreground">
          Card title
        </span>
      </Card.Header>
      <Card.Body>
        <span className="text-[13px] text-muted">
          Header, body, and footer slots on a raised surface.
        </span>
      </Card.Body>
    </Card>
  ),
  badge: (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="success">Stable</Badge>
      <Badge variant="warning">Beta</Badge>
      <Badge variant="info" dot>
        Info
      </Badge>
      <Badge variant="info" starburst>
        New
      </Badge>
    </div>
  ),
  avatar: (
    <div className="flex items-center gap-3">
      <Avatar fallback="PS" alt="Paul Sumido" />
      <Avatar size="lg" fallback="AB" alt="Ada B" />
    </div>
  ),
  switch: <SwitchDemo />,
  spinner: <Spinner />,
  skeleton: (
    <div className="w-full space-y-2">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="rect" height="2rem" />
    </div>
  ),
  divider: (
    <div className="w-full text-sm text-foreground">
      Above the rule
      <Divider className="my-2" />
      Below the rule
    </div>
  ),
  "visually-hidden": (
    <div className="flex items-center gap-2 text-sm text-muted">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground"
      >
        <StarIcon />
        <VisuallyHidden>Add to favourites</VisuallyHidden>
      </button>
      <span>An icon button named for screen readers only</span>
    </div>
  ),
};

function ComponentCard({ component }: { component: ComponentDoc }) {
  return (
    <article className="glass-card flex flex-col gap-4 rounded-2xl p-5">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            {component.name}
          </h3>
          <InfoTip maxWidth={260}>{component.usage}</InfoTip>
        </div>
        <p className="mt-1 text-sm text-muted">{component.tagline}</p>
      </div>

      {/* The live component. The tagline already sits above it and the ⓘ carries
          usage, so the preview isn't wrapped in another tooltip — that stacked a
          second popover on the Tooltip/InfoTip cards and read as a glitch. */}
      <div className="flex min-h-16 w-full items-center rounded-xl border border-border bg-surface/60 p-4">
        {PREVIEWS[component.id]}
      </div>

      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          Accessibility
        </h4>
        <ul className="mt-1.5 space-y-1 text-[13px] text-muted">
          {component.a11y.map((note) => (
            <li key={note} className="flex gap-2">
              <span aria-hidden className="text-success-500">
                ✓
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        {component.usedOn.length > 0 ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Used on
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {component.usedOn.map((link) => (
                <Link
                  key={`${component.id}-${link.href}`}
                  href={link.href}
                  className="paul-touch-min rounded-full border border-border px-2.5 py-1 text-[12px] text-foreground transition-colors hover:border-foreground/40 hover:bg-surface"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Availability
            </p>
            <p className="mt-1.5 text-[12px] text-muted">
              {component.elsewhere}
            </p>
          </>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Token gallery
// ---------------------------------------------------------------------------

function TokenGallery() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Colour ramps
        </h3>
        <div className="space-y-3">
          {COLOR_SCALES.map((ramp) => (
            <div key={ramp.name}>
              <p className="mb-1 text-[12px] text-muted">{ramp.name}</p>
              <div className="flex overflow-hidden rounded-lg border border-border">
                {ramp.steps.map((token) => (
                  <div
                    key={token}
                    className="h-8 flex-1"
                    style={{ backgroundColor: `var(${token})` }}
                    title={token}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Radius</h3>
          <div className="flex flex-wrap gap-4">
            {RADIUS_TOKENS.map((token) => (
              <div key={token.var} className="text-center">
                <div
                  className="h-14 w-14 border border-border bg-surface"
                  style={{ borderRadius: `var(${token.var})` }}
                />
                <span className="mt-1 block text-[11px] text-muted">
                  {token.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Shadows
          </h3>
          <div className="flex flex-wrap gap-4">
            {SHADOW_TOKENS.map((token) => (
              <div key={token.var} className="text-center">
                <div
                  className="h-14 w-14 rounded-lg bg-surface-raised"
                  style={{ boxShadow: `var(${token.var})` }}
                />
                <span className="mt-1 block text-[11px] text-muted">
                  {token.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Type scale
        </h3>
        <div className="space-y-1">
          {TYPOGRAPHY_TOKENS.map((token) => (
            <div key={token.var} className="flex items-baseline gap-4">
              <span className="w-10 shrink-0 text-[11px] text-muted">
                {token.label}
              </span>
              <span
                className="truncate leading-tight text-foreground"
                style={{ fontSize: `var(${token.var})` }}
              >
                The quick brown fox
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DesignSystemShowcaseContent() {
  return (
    <PageShell colorA={ACCENT} colorB="var(--color-secondary-500)">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Design System" }]}
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* Hero / pitch */}
        <Reveal className="mb-16">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            Shared design system
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The design system, live
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            Every primitive below is the real, published component from{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] text-foreground">
              @paul-portfolio/react
            </code>{" "}
            — not a screenshot. The same package backs this Next.js app, a
            sibling Angular app, and Ketsup, so this gallery is the shared
            source of truth. Play with the controls, read how each one is used,
            and see where it ships.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="#components">Browse components</Button>
            <Button variant="outline" href="/thoughts/design-system-showcase">
              Read the write-up
            </Button>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-4 sm:max-w-md">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">
                Primitives
              </dt>
              <dd className="text-2xl font-bold text-foreground">
                {COMPONENTS.length}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">
                Colour ramps
              </dt>
              <dd className="text-2xl font-bold text-foreground">
                {COLOR_SCALES.length}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">
                Contrast
              </dt>
              <dd className="text-2xl font-bold text-foreground">WCAG AA</dd>
            </div>
          </dl>
        </Reveal>

        {/* Why adopt it */}
        <Reveal className="mb-16">
          <SectionHeading>Why adopt it</SectionHeading>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {benefit.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Interactive playground */}
        <Reveal className="mb-16">
          <SectionHeading>Button playground</SectionHeading>
          <p className="mb-5 mt-2 max-w-2xl text-sm text-muted">
            Change the props and watch the live button and the code you would
            write update together.
          </p>
          <div className="glass-card rounded-2xl p-5 sm:p-6">
            <ButtonPlayground />
          </div>
        </Reveal>

        {/* Component gallery */}
        <Reveal id="components" className="mb-16 scroll-mt-20">
          <SectionHeading>Components</SectionHeading>
          <p className="mb-5 mt-2 max-w-2xl text-sm text-muted">
            Hover the ⓘ for how to use each one, hover the preview for a quick
            hint, and follow a chip to see it in production.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COMPONENTS.map((component) => (
              <ComponentCard key={component.id} component={component} />
            ))}
          </div>
        </Reveal>

        {/* Motion primitives — app-local, so they are not in the catalog */}
        <Reveal id="motion-primitives" className="mb-16 scroll-mt-20">
          {/* Rendered for real rather than mocked up, so the bar in the card
              below is the actual component doing its job. */}
          <ScrollProgress />
          <SectionHeading>Motion primitives</SectionHeading>
          <p className="mb-5 mt-2 max-w-2xl text-sm text-muted">
            These eight live in this app rather than the shared package, so they
            sit outside the catalog above. Each one respects reduced motion and
            renders its content visible in the server HTML.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {MOTION_PRIMITIVES.map((primitive) => (
              <MotionPrimitiveCard key={primitive.id} primitive={primitive} />
            ))}
          </div>
        </Reveal>

        {/* Tokens */}
        <Reveal className="mb-16">
          <SectionHeading>Design tokens</SectionHeading>
          <p className="mb-5 mt-2 max-w-2xl text-sm text-muted">
            The primitives are skinned entirely from these tokens, so a rebrand
            is a token change, not a component rewrite.
          </p>
          <div className="glass-card rounded-2xl p-5 sm:p-6">
            <TokenGallery />
          </div>
        </Reveal>

        {/* Accessibility */}
        <Reveal>
          <SectionHeading>Accessibility built in</SectionHeading>
          <p className="mb-5 mt-2 max-w-2xl text-sm text-muted">
            Accessibility is a property of the primitives, not a checklist
            bolted on later. Tab through this page — every control takes focus
            and shows it.
          </p>
          <div className="glass-card rounded-2xl p-5 sm:p-6">
            <ul className="space-y-2 text-sm text-foreground">
              {A11Y_NOTES.map((note) => (
                <li key={note} className="flex gap-2.5">
                  <span aria-hidden className="text-success-500">
                    ✓
                  </span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </main>
    </PageShell>
  );
}
