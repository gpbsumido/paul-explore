"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

const ACCENT = "var(--wp-accent, #c084fc)";
const RARITIES = ["Common", "Rare", "Epic", "Legendary"] as const;
type Rarity = (typeof RARITIES)[number];
const RARITY_TINT: Record<string, string> = {
  Common: "#94a3b8",
  Rare: "#60a5fa",
  Epic: "#c084fc",
  Legendary: "#f59e0b",
};

const TRAIT_POOL = [
  ["Element", ["Fire", "Frost", "Void", "Storm"]],
  ["Class", ["Blade", "Ward", "Relic", "Sigil"]],
  ["Origin", ["Ashfall", "Deepvault", "Skyreach", "Mirefen"]],
] as const;

const OWNERS = ["0x77Ce…10ab", "0x21Fb…9c04", "vault.eth", "0x8a3d…be71"];

type Asset = {
  id: number;
  name: string;
  rarity: Rarity;
  hue: number;
  collection: string;
  tokenId: string;
  attributes: { trait: string; value: string }[];
  history: { event: string; who: string; when: string }[];
};

/** Build the fixture inventory, including per-asset attributes and provenance. */
export function inventory(): Asset[] {
  const rng = makeRng(777);
  return Array.from({ length: 9 }, (_, i) => {
    const attributes = TRAIT_POOL.map(([trait, values]) => ({
      trait,
      value: values[roundish(rng() * (values.length - 1))],
    }));
    const history = Array.from({ length: 3 }, (_, h) => ({
      event: h === 2 ? "Minted" : "Transfer",
      who: OWNERS[roundish(rng() * (OWNERS.length - 1))],
      when: `${2024 - h}-0${roundish(1 + rng() * 8)}`,
    }));
    return {
      id: i,
      name: `Relic #${roundish(1000 + rng() * 8999)}`,
      rarity: RARITIES[roundish(rng() * 3)],
      hue: roundish(rng() * 360),
      collection: "Ashvault Relics",
      tokenId: `${roundish(100 + rng() * 899)}`,
      attributes,
      history,
    };
  });
}

/** Read-only detail view for one asset: metadata, traits, and provenance. */
function AssetDetail({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} aria-label={`${asset.name} details`} className="w-[22rem] max-w-[92vw]">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{asset.name}</p>
            <p className="text-[11px] text-muted">{asset.collection}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-1.5 text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="h-24 rounded-lg" style={{ backgroundColor: `hsl(${asset.hue} 55% 55%)` }} />

        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold" style={{ color: RARITY_TINT[asset.rarity] }}>
            {asset.rarity}
          </span>
          <span className="font-mono text-muted">Token #{asset.tokenId}</span>
        </div>

        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-muted">Attributes</p>
          <div className="grid grid-cols-3 gap-1.5">
            {asset.attributes.map((a) => (
              <div key={a.trait} className="rounded-md border border-border bg-background/50 p-1.5">
                <p className="text-[8px] uppercase tracking-wider text-muted">{a.trait}</p>
                <p className="truncate text-[11px] font-medium text-foreground">{a.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-muted">Provenance</p>
          <ol className="flex flex-col gap-1">
            {asset.history.map((h, i) => (
              <li key={i} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden style={{ color: ACCENT }}>•</span>
                  <span className="text-foreground">{h.event}</span>
                  <span className="font-mono text-muted">{h.who}</span>
                </span>
                <span className="text-muted">{h.when}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Vignette: the gamer hub's wallet + inventory. A fake wallet-connect that
 * reveals an on-chain asset grid with rarity tags. Click an asset for its
 * metadata, attributes, and (fixture) provenance. No real chain calls.
 */
export default function NftInventoryDemo({ feature }: { feature: WorkFeature }) {
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
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
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="overflow-hidden rounded-lg border border-border text-left transition hover:border-foreground/40"
            >
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
            </button>
          ))}
        </div>
      )}

      {selected && <AssetDetail asset={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
