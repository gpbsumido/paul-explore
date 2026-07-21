"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #60a5fa)";

type Block =
  | { id: number; kind: "heading"; text: string }
  | { id: number; kind: "text"; text: string }
  | { id: number; kind: "button"; text: string }
  | { id: number; kind: "image"; src?: string };

// Omit that distributes over the block union, so each variant keeps its own props.
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type BlockDraft = DistributiveOmit<Block, "id">;

const INITIAL: Block[] = [
  { id: 1, kind: "heading", text: "Season 4 is live" },
  { id: 2, kind: "image" },
  { id: 3, kind: "text", text: "New map, new rewards. Log in this week for a launch bonus." },
  { id: 4, kind: "button", text: "Play now" },
];

const CAMPAIGNS = [
  { name: "Season 4 launch", status: "Sent", open: "48%", sent: "128k" },
  { name: "Win-back lapsed", status: "Draft", open: "—", sent: "—" },
  { name: "Weekend 2x XP", status: "Scheduled", open: "—", sent: "62k" },
];

const STATUS_TINT: Record<string, string> = {
  Sent: "#34d399",
  Draft: "#94a3b8",
  Scheduled: "#f59e0b",
};

/** One editable email block: text blocks type in place, image blocks import a local file. */
function EditableBlock({
  block,
  onText,
  onImport,
}: {
  block: Block;
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
          style={{ backgroundColor: ACCENT }}
        />
      );
    case "image":
      return (
        <div className="space-y-1">
          {block.src ? (
            <img
              src={block.src}
              alt="email banner"
              className="h-16 w-full rounded-md object-cover"
            />
          ) : (
            <div
              className="h-16 rounded-md"
              style={{ background: `linear-gradient(120deg, ${"var(--wp-accent,#60a5fa)"}, transparent)` }}
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
export default function EmailCampaignsDemo({ feature }: { feature: WorkFeature }) {
  const [blocks, setBlocks] = useState<Block[]>(INITIAL);
  const [nextId, setNextId] = useState(5);

  const add = (block: BlockDraft) => {
    setBlocks((b) => [...b, { ...block, id: nextId }]);
    setNextId((n) => n + 1);
  };

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
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-muted">Add block:</span>
            <Button variant="outline" size="xs" onClick={() => add({ kind: "text", text: "New paragraph of copy." })}>Text</Button>
            <Button variant="outline" size="xs" onClick={() => add({ kind: "button", text: "Claim reward" })}>Button</Button>
            <Button variant="outline" size="xs" onClick={() => add({ kind: "image" })}>Image</Button>
          </div>
          <div
            aria-label="Email preview"
            className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3"
          >
            {blocks.map((block) => (
              <div key={block.id} data-testid="email-block">
                <EditableBlock
                  block={block}
                  onText={(text) => setText(block.id, text)}
                  onImport={(file) => importImage(block.id, file)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="text-muted">
              <tr>
                <th className="pb-1 font-medium">Campaign</th>
                <th className="pb-1 font-medium">Status</th>
                <th className="pb-1 text-right font-medium">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CAMPAIGNS.map((c) => (
                <tr key={c.name}>
                  <td className="py-1.5 text-foreground">{c.name}</td>
                  <td className="py-1.5">
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: STATUS_TINT[c.status] }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-foreground">
                    {c.open}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
