"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Chip, Modal } from "@/components/ui";
// Spotlight, TiltCard, and Ticker use hooks but the package ships without
// "use client" banners, so they can only render from inside a client module.
// Everything hook-free in the gallery stays in the server shell. The AI-app
// primitives below join them here for the same reason — every one holds state,
// a portal, or an animation loop.
import {
  ChatComposer,
  ChatMessage,
  CodeBlock,
  Combobox,
  CommandPalette,
  GuidedTour,
  RichTextEditor,
  Spotlight,
  StreamingText,
  Switch,
  Ticker,
  TiltCard,
  Toaster,
  ToastProvider,
  toast,
  useToast,
  type Command,
  ClickSpark,
  BlurReveal,
  StarBorder,
  ShineSweep,
  LiquidGlass,
  TextLoop,
  SquishSwitch,
  RubberSegment,
  LiquidCarveButton,
  LatticeLoader,
  DriftWall,
  CircularGallery,
  PathGallery,
  SmoothScrollSlider,
  HoverImageReveal,
  LinkPreview,
  SpiralPortraitHero,
  PerspectivePortraitHero,
  CorridorPortraitHero,
  LightBloom,
  ParticleText,
  RefineFrame,
  type RefineStatus,
  FolderFloat,
  BotanicalText,
} from "@paul-portfolio/react";
import { ACCENT_BAND } from "@/lib/accentBand";

// Shared sample imagery for the gallery-style effects. Every tile carries a
// title so the image links the components build get an accessible name.
const DEMO_TILES = [
  { image: "/landing/featured/operator-light.jpg", title: "Operator", href: "/operator" },
  { image: "/landing/featured/design-system-light.jpg", title: "Design system", href: "/design-system" },
  { image: "/landing/featured/world-light.jpg", title: "World", href: "/world" },
  { image: "/landing/featured/vitals-light.jpg", title: "Vitals", href: "/thoughts/vitals" },
  { image: "/landing/featured/flags-light.jpg", title: "Feature flags", href: "/thoughts/feature-flags" },
  { image: "/landing/featured/work-portfolio-light.jpg", title: "Work", href: "/work-portfolio" },
];

const HERO_IMAGES = DEMO_TILES.map((t) => ({ src: t.image }));

/**
 * Renders a preview only once its card scrolls near the viewport, holding a
 * fixed-height skeleton until then. The gallery mounts every visible card at
 * once and defaults to showing all of them, so without this the two dozen
 * animated effect previews would each start a requestAnimationFrame or canvas
 * loop on load and peg the main thread — bad INP, wasted battery. Deferring the
 * mount keeps that cost to the few cards actually on screen. The initial state
 * is the skeleton, so the server renders the skeleton too (none of the heavy
 * trees land in the initial HTML) and the reserved box means nothing shifts.
 */
export function DeferredPreview({
  children,
  minHeight = "8rem",
}: {
  children: ReactNode;
  minHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver !== "function") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time reveal when the browser can't observe intersection; there's nothing to watch, so mount now. The initial state stays false so the server still renders the skeleton.
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      className="flex w-full items-center justify-center"
      style={{ minHeight }}
    >
      {shown ? (
        children
      ) : (
        <div
          className="h-full w-full animate-pulse rounded-lg bg-surface"
          style={{ minHeight }}
          aria-hidden
        />
      )}
    </div>
  );
}

const ACCENT = ACCENT_BAND.verdigris;

/**
 * The stateful gallery demos, split out of the showcase so the page shell can
 * be a server component. Each one holds real state (or wraps a hook-using
 * package primitive), which is exactly the set of things that has to hydrate.
 */

export function ModalDemo() {
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

export function GuidedTourDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div id="ds-tour-target" className="inline-flex">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Start the tour
        </Button>
      </div>
      <GuidedTour
        open={open}
        aria-label="Example tour"
        steps={[
          {
            title: "A guided tour",
            body: "It walks a page one coach-mark at a time — ask first, then spotlight each part.",
          },
          {
            target: "ds-tour-target",
            title: "Spotlight a real element",
            body: "Each step highlights an element on the page by its id.",
          },
        ]}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

export function SwitchDemo() {
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

export function ChipDemo() {
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

export function TiltCardPreview() {
  return (
    <TiltCard className="rounded-xl">
      <div className="rounded-xl border border-border bg-surface-raised p-4 text-sm">
        Hover me
      </div>
    </TiltCard>
  );
}

export function SpotlightPreview() {
  return (
    <Spotlight className="rounded-xl border border-border bg-surface-raised p-4 text-sm">
      Move the cursor across me
    </Spotlight>
  );
}

export function TickerPreview() {
  return (
    <Ticker label="Recent work" mode="marquee" className="w-full">
      <span className="px-3 text-sm text-foreground">Dashboards</span>
      <span className="px-3 text-sm text-foreground">Onboarding</span>
      <span className="px-3 text-sm text-foreground">Campaigns</span>
      <span className="px-3 text-sm text-foreground">Design system</span>
    </Ticker>
  );
}

export function ChatComposerDemo() {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="w-full space-y-3">
      {sent && (
        // role is ChatMessage's own prop, not an ARIA role — see the note in
        // DesignSystemShowcaseContent's chat-message preview.
        // eslint-disable-next-line jsx-a11y/aria-role
        <ChatMessage role="user" name="You">
          {sent}
        </ChatMessage>
      )}
      <ChatComposer
        label="Message the assistant"
        onSubmit={setSent}
        placeholder="Ask something…"
      />
    </div>
  );
}

export function CodeBlockPreview() {
  return (
    <CodeBlock
      language="tsx"
      filename="greet.tsx"
      code={`export function greet(name: string) {\n  return \`Hello, \${name}\`;\n}`}
    />
  );
}

export function ComboboxDemo() {
  const [model, setModel] = useState("sonnet");
  return (
    <div className="w-full">
      <Combobox
        label="Model"
        value={model}
        onChange={setModel}
        placeholder="Pick a model…"
        options={[
          { value: "opus", label: "Claude Opus" },
          { value: "sonnet", label: "Claude Sonnet" },
          { value: "haiku", label: "Claude Haiku" },
        ]}
      />
    </div>
  );
}

export function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  const commands: Command[] = [
    { id: "home", label: "Go to hub", group: "Navigate", onSelect: () => {} },
    {
      id: "ds",
      label: "Open design system",
      group: "Navigate",
      onSelect: () => {},
    },
    {
      id: "theme",
      label: "Toggle theme",
      group: "Actions",
      hint: "⌘T",
      onSelect: () => {},
    },
  ];
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Open command menu
      </Button>
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        commands={commands}
      />
    </>
  );
}

export function RichTextEditorDemo() {
  return (
    <div className="w-full">
      <RichTextEditor
        label="Notes"
        defaultValue="<p>Edit me — <strong>bold</strong>, lists, links.</p>"
      />
    </div>
  );
}

export function StreamingTextPreview() {
  // It streams once on mount and finishes fast, so scroll down late and you miss
  // it entirely. Remounting via key replays the stream. (The charts and meter
  // render statically, so they don't need this — this is the only one-shot
  // animation in the gallery.)
  const [runId, setRunId] = useState(0);
  return (
    <div className="flex flex-col items-start gap-2">
      <StreamingText
        key={runId}
        className="text-sm text-foreground"
        text="Streaming a reply the way a model sends it, a few characters at a time."
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setRunId((n) => n + 1)}
      >
        Replay
      </Button>
    </div>
  );
}

function ToastTrigger() {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() =>
        toast({
          title: "Saved",
          description: "Your changes are stored.",
          variant: "success",
        })
      }
    >
      Show a toast
    </Button>
  );
}

export function ToastDemo() {
  return (
    <ToastProvider>
      <ToastTrigger />
    </ToastProvider>
  );
}

export function ToasterDemo() {
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => toast.error("Couldn't save", "Please try again.")}
      >
        Raise an error toast
      </Button>
      <Toaster />
    </>
  );
}

// --- Motion & effects previews -------------------------------------------
// Each is wrapped in DeferredPreview so its animation only starts once the
// card is on screen. Sample imagery is shared from DEMO_TILES above.

export function ClickSparkDemo() {
  return (
    <DeferredPreview>
      <ClickSpark>
        <Button variant="secondary" size="sm">
          Tap for a spark
        </Button>
      </ClickSpark>
    </DeferredPreview>
  );
}

export function BlurRevealDemo() {
  // BlurReveal plays once on mount, so remounting it with a fresh key replays it.
  const [runKey, setRunKey] = useState(0);
  return (
    <DeferredPreview>
      <div className="flex flex-col items-center gap-3">
        <BlurReveal
          key={runKey}
          className="text-lg font-semibold text-foreground"
        >
          Resolves from a blur
        </BlurReveal>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setRunKey((k) => k + 1)}
        >
          Replay
        </Button>
      </div>
    </DeferredPreview>
  );
}

export function StarBorderDemo() {
  return (
    <DeferredPreview>
      <StarBorder className="rounded-xl text-primary-500">
        <span className="block px-4 py-3 text-sm text-foreground">
          Animated conic border
        </span>
      </StarBorder>
    </DeferredPreview>
  );
}

export function ShineSweepDemo() {
  return (
    <DeferredPreview>
      <ShineSweep>
        <Button size="sm">Glossy sweep</Button>
      </ShineSweep>
    </DeferredPreview>
  );
}

export function LiquidGlassDemo() {
  return (
    <DeferredPreview>
      <div className="w-full rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-4">
        <LiquidGlass className="rounded-lg p-4 text-sm font-medium text-foreground">
          Frosted liquid glass
        </LiquidGlass>
      </div>
    </DeferredPreview>
  );
}

export function TextLoopDemo() {
  return (
    <DeferredPreview>
      <span className="text-lg font-semibold text-foreground">
        Built for{" "}
        <TextLoop
          items={["speed", "clarity", "delight"]}
          className="text-primary-600"
        />
      </span>
    </DeferredPreview>
  );
}

export function SquishSwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <DeferredPreview>
      <SquishSwitch checked={on} onChange={setOn} label="Notifications" />
    </DeferredPreview>
  );
}

export function RubberSegmentDemo() {
  const [value, setValue] = useState("Week");
  return (
    <DeferredPreview>
      <RubberSegment
        segments={["Day", "Week", "Month"]}
        value={value}
        onChange={setValue}
      />
    </DeferredPreview>
  );
}

export function LiquidCarveButtonDemo() {
  return (
    <DeferredPreview>
      <LiquidCarveButton label="Hover the carve" />
    </DeferredPreview>
  );
}

export function LatticeLoaderDemo() {
  return (
    <DeferredPreview>
      <div className="flex flex-wrap items-start justify-center gap-6">
        <LatticeLoader label="Working" status="working" showTimer />
        <LatticeLoader status="done" doneLabel="Done" />
        <LatticeLoader status="error" errorLabel="Failed" />
      </div>
    </DeferredPreview>
  );
}

export function DriftWallDemo() {
  return (
    <DeferredPreview minHeight="12rem">
      {/* DriftWall is height:100% and measures its container, so it needs a
          definite height to render — min-height alone collapses it to zero. */}
      <div className="h-48 w-full">
        <DriftWall
          items={DEMO_TILES}
          columns={3}
          tileWidth={92}
          tileHeight={64}
          className="w-full"
        />
      </div>
    </DeferredPreview>
  );
}

export function CircularGalleryDemo() {
  return (
    <DeferredPreview minHeight="12rem">
      <CircularGallery
        items={DEMO_TILES}
        radius={140}
        cardWidth={120}
        cardHeight={80}
      />
    </DeferredPreview>
  );
}

export function PathGalleryDemo() {
  return (
    <DeferredPreview minHeight="11rem">
      <PathGallery items={DEMO_TILES} itemSize={54} />
    </DeferredPreview>
  );
}

export function SmoothScrollSliderDemo() {
  return (
    <DeferredPreview minHeight="11rem">
      <SmoothScrollSlider
        slides={DEMO_TILES}
        slideWidth={132}
        slideHeight={88}
      />
    </DeferredPreview>
  );
}

export function HoverImageRevealDemo() {
  return (
    <DeferredPreview minHeight="11rem">
      <HoverImageReveal
        items={DEMO_TILES.slice(0, 3).map((tile) => ({
          label: tile.title,
          image: tile.image,
          href: tile.href,
        }))}
      />
    </DeferredPreview>
  );
}

export function LinkPreviewDemo() {
  return (
    <DeferredPreview>
      <p className="text-sm text-foreground">
        Explore the{" "}
        <LinkPreview
          href="/design-system"
          image="/landing/featured/design-system-light.jpg"
        >
          design system
        </LinkPreview>{" "}
        in the app.
      </p>
    </DeferredPreview>
  );
}

export function SpiralPortraitHeroDemo() {
  return (
    <DeferredPreview minHeight="16rem">
      <div className="w-full overflow-hidden rounded-xl [&_.portrait-hero]:min-h-0 [&_.portrait-hero]:p-6">
        <SpiralPortraitHero
          heading="Build in the open"
          description="Copy stays sharp and in charge while the portraits spiral behind it."
          images={HERO_IMAGES}
          headingLevel={3}
          actions={
            <Button size="sm" href="/work-portfolio">
              See the work
            </Button>
          }
        />
      </div>
    </DeferredPreview>
  );
}

export function PerspectivePortraitHeroDemo() {
  return (
    <DeferredPreview minHeight="16rem">
      <div className="w-full overflow-hidden rounded-xl [&_.portrait-hero]:min-h-0 [&_.portrait-hero]:p-6">
        <PerspectivePortraitHero
          heading="Depth without a renderer"
          description="Posters pasted on the walls of a one-point-perspective corridor."
          images={HERO_IMAGES}
          headingLevel={3}
          actions={
            <Button size="sm" href="/design-system">
              Browse components
            </Button>
          }
        />
      </div>
    </DeferredPreview>
  );
}

export function CorridorPortraitHeroDemo() {
  return (
    <DeferredPreview minHeight="16rem">
      <div className="w-full overflow-hidden rounded-xl [&_.portrait-hero]:min-h-0 [&_.portrait-hero]:p-6">
        <CorridorPortraitHero
          heading="A wall of pictures either side"
          description="The imagery fans out to both sides into a receding corridor."
          images={HERO_IMAGES}
          headingLevel={3}
          actions={
            <Button size="sm" href="/work-portfolio">
              See the work
            </Button>
          }
        />
      </div>
    </DeferredPreview>
  );
}

export function LightBloomDemo() {
  return (
    <DeferredPreview minHeight="11rem">
      <LightBloom className="w-full rounded-xl" spread={60}>
        <div className="grid h-40 place-items-center text-sm font-semibold text-foreground">
          Light bloom
        </div>
      </LightBloom>
    </DeferredPreview>
  );
}

export function ParticleTextDemo() {
  return (
    <DeferredPreview>
      <ParticleText text="Particles" fontSize={64} />
    </DeferredPreview>
  );
}

export function RefineFrameDemo() {
  const [status, setStatus] = useState<RefineStatus>("refining");
  return (
    <DeferredPreview minHeight="12rem">
      <div className="flex flex-col items-center gap-3">
        <div className="w-full max-w-[220px]">
          <RefineFrame status={status}>
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: "url(/landing/featured/world-light.jpg)" }}
            />
          </RefineFrame>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={status === "complete" ? "secondary" : "primary"}
            onClick={() => setStatus("refining")}
          >
            Loading
          </Button>
          <Button
            size="sm"
            variant={status === "complete" ? "primary" : "secondary"}
            onClick={() => setStatus("complete")}
          >
            Done
          </Button>
        </div>
      </div>
    </DeferredPreview>
  );
}

export function FolderFloatDemo() {
  return (
    <DeferredPreview minHeight="11rem">
      <FolderFloat
        label="Projects"
        items={[
          { label: "Operator", href: "/operator" },
          { label: "World", href: "/world" },
          { label: "Vitals", href: "/thoughts/vitals" },
        ]}
      />
    </DeferredPreview>
  );
}

export function BotanicalTextDemo() {
  return (
    <DeferredPreview>
      <BotanicalText text="Bloom" fontSize={120} density={7} />
    </DeferredPreview>
  );
}
