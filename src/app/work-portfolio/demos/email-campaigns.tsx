"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #60a5fa)";

type Block =
  | { kind: "heading"; text: string }
  | { kind: "text"; text: string }
  | { kind: "button"; text: string }
  | { kind: "image" };

const INITIAL: Block[] = [
  { kind: "heading", text: "Season 4 is live" },
  { kind: "image" },
  { kind: "text", text: "New map, new rewards. Log in this week for a launch bonus." },
  { kind: "button", text: "Play now" },
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

/** Render a single email block in the preview. */
function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "heading":
      return <p className="text-base font-bold text-foreground">{block.text}</p>;
    case "text":
      return <p className="text-[12px] text-muted">{block.text}</p>;
    case "button":
      return (
        <span
          className="inline-block rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
          style={{ backgroundColor: ACCENT }}
        >
          {block.text}
        </span>
      );
    case "image":
      return (
        <div
          className="h-16 rounded-md"
          style={{ background: `linear-gradient(120deg, ${"var(--wp-accent,#60a5fa)"}, transparent)` }}
        />
      );
  }
}

/**
 * Vignette: portal v2's email studio. A block-based template preview on the
 * left (add blocks from a palette) and the campaign table on the right.
 */
export default function EmailCampaignsDemo({ feature }: { feature: WorkFeature }) {
  const [blocks, setBlocks] = useState<Block[]>(INITIAL);

  const add = (block: Block) => setBlocks((b) => [...b, block]);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-muted">Add block:</span>
            <button type="button" onClick={() => add({ kind: "text", text: "New paragraph of copy." })} className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-black/5 dark:hover:bg-white/10">Text</button>
            <button type="button" onClick={() => add({ kind: "button", text: "Claim reward" })} className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-black/5 dark:hover:bg-white/10">Button</button>
            <button type="button" onClick={() => add({ kind: "image" })} className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-black/5 dark:hover:bg-white/10">Image</button>
          </div>
          <div
            aria-label="Email preview"
            className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3"
          >
            {blocks.map((block, i) => (
              <div key={i}>
                <BlockView block={block} />
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
