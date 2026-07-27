"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { m } from "framer-motion";
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
import { fadeUp, spring, instantTransition } from "@/lib/animations";
import { useHubReducedMotion } from "@/app/providers";
import {
  COMPONENTS,
  COLOR_SCALES,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  buildButtonSnippet,
  type ButtonPlaygroundState,
  type ComponentDoc,
} from "./catalog";

const ACCENT = "#06b6d4";

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
    body: "The same tokens and component styles back both React and Angular apps through thin, typed wrappers. No lock-in to one renderer.",
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5 20.4l1.4-6.8L1.3 9l6.9-.7L12 2z" />
    </svg>
  );
}

/** Section wrapper that fades up on mount and honours reduced motion. */
function Reveal({
  children,
  id,
  className,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const reduced = useHubReducedMotion();
  return (
    <m.section
      id={id}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={reduced ? instantTransition : spring.smooth}
      className={className}
    >
      {children}
    </m.section>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl font-bold tracking-tight text-foreground">
      {children}
    </h2>
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
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <FilterBar label="Button playground controls" className="flex-wrap gap-4">
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
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={state.loading}
              onChange={(e) => set("loading", e.target.checked)}
              className="h-4 w-4 accent-primary-500"
            />
            Loading
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={state.disabled}
              onChange={(e) => set("disabled", e.target.checked)}
              className="h-4 w-4 accent-primary-500"
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
        <span className="text-sm text-muted">All removed — refresh to reset.</span>
      )}
    </div>
  );
}

/** Keyed by component id so each gallery card can render itself live. */
const PREVIEWS: Record<string, ReactNode> = {
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

      {/* The live component. Hovering (or focusing) surfaces a quick usage hint. */}
      <Tooltip content={component.tagline} delay={200}>
        <div className="flex min-h-16 w-full items-center rounded-xl border border-border bg-surface/60 p-4">
          {PREVIEWS[component.id]}
        </div>
      </Tooltip>

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
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          Used on
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {component.usedOn.map((link) => (
            <Link
              key={`${component.id}-${link.href}`}
              href={link.href}
              className="rounded-full border border-border px-2.5 py-1 text-[12px] text-foreground transition-colors hover:border-foreground/40 hover:bg-surface"
            >
              {link.label}
            </Link>
          ))}
        </div>
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
        <h3 className="mb-3 text-sm font-semibold text-foreground">Colour ramps</h3>
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

      <div className="grid gap-8 sm:grid-cols-2">
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
          <h3 className="mb-3 text-sm font-semibold text-foreground">Shadows</h3>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DesignSystemShowcaseContent() {
  return (
    <PageShell colorA={ACCENT} colorB="#818cf8">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Design System" }]}
        showLogout={false}
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
            Every primitive below is the real, published component — not a
            screenshot. Play with the controls, read how each one is used, and
            follow the links to the pages where it already ships. This is the
            fastest way to see why adopting the system beats hand-rolling UI.
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COMPONENTS.map((component) => (
              <ComponentCard key={component.id} component={component} />
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
            Accessibility is a property of the primitives, not a checklist bolted
            on later. Tab through this page — every control takes focus and shows
            it.
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
