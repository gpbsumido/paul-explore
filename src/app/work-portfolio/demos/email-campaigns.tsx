"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import type { WorkFeature } from "../_data/types";

type Block =
  | { id: number; kind: "heading"; text: string }
  | { id: number; kind: "text"; text: string }
  | { id: number; kind: "button"; text: string }
  | { id: number; kind: "image"; src?: string };

// Omit that distributes over the block union, so each variant keeps its own props.
type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;
type BlockDraft = DistributiveOmit<Block, "id">;

const INITIAL: Block[] = [
  { id: 1, kind: "heading", text: "Season 4 is live" },
  { id: 2, kind: "image" },
  {
    id: 3,
    kind: "text",
    text: "New map, new rewards. Log in this week for a launch bonus.",
  },
  { id: 4, kind: "button", text: "Play now" },
];

const CAMPAIGNS = [
  { name: "Season 4 launch", status: "Sent", open: "48%", sent: "128k" },
  { name: "Win-back lapsed", status: "Draft", open: "—", sent: "—" },
  { name: "Weekend 2x XP", status: "Scheduled", open: "—", sent: "62k" },
];

const STATUS_TINT: Record<string, string> = {
  Sent: "#34d399",
  Draft: "#a49d90",
  Scheduled: "#bd8d3a",
};

/** One editable email block: text blocks type in place, image blocks import a local file. */
function EditableBlock({
  block,
  accent,
  onText,
  onImport,
}: {
  block: Block;
  accent: string;
  onText: (text: string) => void;
  onImport: (file: File) => void;
}) {
  switch (block.kind) {
    case "heading":
      return (
        <input
          aria-label="Heading text"
          value={block.text}
          onChange={(e) => onText(e.target.value)}
          className="w-full bg-transparent text-base font-bold text-foreground outline-none"
        />
      );
    case "text":
      return (
        <textarea
          aria-label="Body text"
          value={block.text}
          onChange={(e) => onText(e.target.value)}
          rows={2}
          className="w-full resize-none bg-transparent text-[12px] text-muted outline-none"
        />
      );
    case "button":
      return (
        <input
          aria-label="Button label"
          value={block.text}
          onChange={(e) => onText(e.target.value)}
          className="rounded-md px-3 py-1.5 text-center text-[12px] font-medium text-white outline-none"
          style={{ backgroundColor: accent }}
        />
      );
    case "image":
      return (
        <div className="space-y-1">
          {block.src ? (
            // A locally-imported data URL, so unoptimized (nothing for the
            // Next image optimizer to do); fill matches the fixed-height block.
            <div className="relative h-16 w-full overflow-hidden rounded-md">
              <Image
                src={block.src}
                alt="email banner"
                fill
                unoptimized
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="h-16 rounded-md"
              style={{
                background: `linear-gradient(120deg, ${accent}, transparent)`,
              }}
            />
          )}
          <label className="block cursor-pointer text-[10px] text-muted underline">
            Import image
            <input
              type="file"
              accept="image/*"
              aria-label="Import image"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
              }}
            />
          </label>
        </div>
      );
  }
}

/**
 * Vignette: portal v2's email studio. A block-based template preview on the
 * left (add blocks from a palette) and the campaign table on the right.
 */
const SWATCHES = [
  "hsl(210 62% 54%)",
  "hsl(160 60% 45%)",
  "hsl(330 62% 56%)",
  "hsl(38 82% 52%)",
  "hsl(265 62% 62%)",
] as const;

export default function EmailCampaignsDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [blocks, setBlocks] = useState<Block[]>(INITIAL);
  const [nextId, setNextId] = useState(5);
  const [subject, setSubject] = useState("Season 4 is live — log in for a bonus");
  const [accent, setAccent] = useState<string>(SWATCHES[0]);
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");

  const add = (block: BlockDraft) => {
    setBlocks((b) => [...b, { ...block, id: nextId }]);
    setNextId((n) => n + 1);
  };

  const removeBlock = (id: number) =>
    setBlocks((b) => b.filter((x) => x.id !== id));

  const moveBlock = (id: number, dir: -1 | 1) =>
    setBlocks((b) => {
      const i = b.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= b.length) return b;
      const next = [...b];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const setText = (id: number, text: string) =>
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, text } : x)));

  const importImage = (id: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () =>
      setBlocks((b) =>
        b.map((x) => (x.id === id ? { ...x, src: String(reader.result) } : x)),
      );
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="flex h-full min-h-64 flex-col gap-3 p-5 text-foreground"
      style={{
        background: "hsl(258 36% 8%)",
        backgroundImage:
          "linear-gradient(hsl(258 78% 66% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(258 78% 66% / 0.06) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Analytics portal v2{" "}
          <span style={{ color: "hsl(258 78% 70%)" }}>&#47;&#47;</span> email
        </p>
        <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {feature.title}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_13rem]">
        <div className="flex min-h-0 flex-col gap-2">
          {/* Config bar: subject, accent, device */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/40 p-2">
            <input
              aria-label="Subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line…"
              className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-foreground outline-none"
            />
            <div className="flex gap-1" role="group" aria-label="Accent colour">
              {SWATCHES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-label={`Accent ${s}`}
                  aria-pressed={accent === s}
                  onClick={() => setAccent(s)}
                  className="h-4 w-4 rounded-full"
                  style={{
                    background: s,
                    outline:
                      accent === s ? "2px solid var(--color-foreground)" : "none",
                    outlineOffset: "1px",
                  }}
                />
              ))}
            </div>
            <div className="flex overflow-hidden rounded-md border border-border text-[12px]">
              {(["desktop", "mobile"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-label={`${d} preview`}
                  aria-pressed={device === d}
                  onClick={() => setDevice(d)}
                  className={`px-2 py-0.5 ${device === d ? "bg-white/15 text-foreground" : "text-muted"}`}
                >
                  {d === "desktop" ? "🖥️" : "📱"}
                </button>
              ))}
            </div>
          </div>

          {/* Add-block palette */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-muted">Add block:</span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => add({ kind: "heading", text: "New heading" })}
            >
              Heading
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                add({ kind: "text", text: "New paragraph of copy." })
              }
            >
              Text
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => add({ kind: "button", text: "Claim reward" })}
            >
              Button
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => add({ kind: "image" })}
            >
              Image
            </Button>
          </div>

          {/* The preview canvas — bigger, framed like a real email client */}
          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-black/20 p-3">
            <div
              className="mx-auto rounded-lg border border-border bg-background shadow-lg transition-all"
              style={{ maxWidth: device === "mobile" ? "20rem" : "34rem" }}
            >
              <div className="border-b border-border px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted">
                  Subject
                </p>
                <p className="truncate text-[12px] font-semibold text-foreground">
                  {subject || "(no subject)"}
                </p>
              </div>
              <div aria-label="Email preview" className="space-y-1.5 p-3">
                {blocks.map((block, i) => (
                  <div
                    key={block.id}
                    data-testid="email-block"
                    className="group relative rounded-md border border-transparent p-1.5 hover:border-border"
                  >
                    <EditableBlock
                      block={block}
                      accent={accent}
                      onText={(text) => setText(block.id, text)}
                      onImport={(file) => importImage(block.id, file)}
                    />
                    <div className="absolute top-1 right-1 hidden gap-0.5 rounded bg-surface-raised/90 p-0.5 group-hover:flex">
                      <button
                        type="button"
                        aria-label="Move block up"
                        disabled={i === 0}
                        onClick={() => moveBlock(block.id, -1)}
                        className="px-1 text-[10px] text-muted hover:text-foreground disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Move block down"
                        disabled={i === blocks.length - 1}
                        onClick={() => moveBlock(block.id, 1)}
                        className="px-1 text-[10px] text-muted hover:text-foreground disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label="Delete block"
                        onClick={() => removeBlock(block.id)}
                        className="px-1 text-[10px] text-error-500 hover:text-error-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Compact campaign list */}
        <div className="min-h-0 overflow-y-auto rounded-lg border border-border bg-background/40 p-2">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
            Campaigns
          </p>
          <ul className="space-y-1">
            {CAMPAIGNS.map((c) => (
              <li
                key={c.name}
                className="rounded-md border border-border p-1.5"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] font-medium text-foreground">
                    {c.name}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
                    style={{ backgroundColor: STATUS_TINT[c.status] }}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="mt-0.5 flex justify-between text-[10px] text-muted tabular-nums">
                  <span>open {c.open}</span>
                  <span>{c.sent}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
