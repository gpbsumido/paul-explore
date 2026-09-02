"use client";

import { useState } from "react";
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
  RichTextEditor,
  Spotlight,
  StreamingText,
  Switch,
  Ticker,
  TiltCard,
  ToastProvider,
  useToast,
  type Command,
} from "@paul-portfolio/react";
import { ACCENT_BAND } from "@/lib/accentBand";

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
    <TiltCard className="rounded-xl border border-border bg-surface-raised p-4 text-sm">
      Hover me
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
  return (
    <StreamingText
      className="text-sm text-foreground"
      text="Streaming a reply the way a model sends it, a few characters at a time."
    />
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
