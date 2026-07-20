"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

const ACCENT = "var(--wp-accent, #c084fc)";
const RARITIES = ["Common", "Rare", "Epic", "Legendary"] as const;
const RARITY_TINT: Record<string, string> = {
  Common: "#94a3b8",
  Rare: "#60a5fa",
  Epic: "#c084fc",
  Legendary: "#f59e0b",
};

function inventory() {
  const rng = makeRng(777);
  return Array.from({ length: 9 }, (_, i) => ({
    id: i,
    name: `Relic #${roundish(1000 + rng() * 8999)}`,
    rarity: RARITIES[roundish(rng() * 3)],
    hue: roundish(rng() * 360),
  }));
}

/**
 * Vignette: the gamer hub's wallet + inventory. A fake wallet-connect that
 * reveals an on-chain asset grid with rarity tags. No real chain calls.
 */
export default function NftInventoryDemo({ feature }: { feature: WorkFeature }) {
  const [connected, setConnected] = useState(false);
  const items = inventory();

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
        <button
          type="button"
          onClick={() => setConnected((c) => !c)}
          className="rounded-md px-2.5 py-1 text-[11px] font-medium text-white"
          style={{ backgroundColor: ACCENT }}
        >
          {connected ? "0x77Ce…10ab" : "Connect wallet"}
        </button>
      </div>

      {!connected ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <span aria-hidden className="text-3xl">👛</span>
          <p className="text-[12px] text-muted">
            connect a wallet to see your on-chain items
          </p>
        </div>
      ) : (
        <div
          aria-label="Inventory grid"
          className="grid min-h-0 flex-1 grid-cols-3 gap-2 overflow-y-auto"
        >
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg border border-border">
              <div className="h-14" style={{ backgroundColor: `hsl(${item.hue} 55% 55%)` }} />
              <div className="p-1.5">
                <p className="truncate text-[10px] font-medium text-foreground">
                  {item.name}
                </p>
                <p
                  className="text-[9px] font-semibold"
                  style={{ color: RARITY_TINT[item.rarity] }}
                >
                  {item.rarity}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
