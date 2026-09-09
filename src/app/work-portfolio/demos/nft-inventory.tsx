"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Modal from "@/components/ui/Modal";
import Web3Provider from "@/components/Web3Provider";
import ConnectWallet from "@/components/ConnectWallet";
import { useWallet } from "@/hooks/useWallet";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";
import { NftArt } from "./_shared/NftArt";

const ACCENT = "var(--wp-accent, #8f52cb)";
const RARITIES = ["Common", "Rare", "Epic", "Legendary"] as const;
type Rarity = (typeof RARITIES)[number];
const RARITY_TINT: Record<string, string> = {
  Common: "#a49d90",
  Rare: "#4a83c8",
  Epic: "#8f52cb",
  Legendary: "#bd8d3a",
};

const TRAIT_POOL = [
  ["Element", ["Fire", "Frost", "Void", "Storm"]],
  ["Class", ["Blade", "Ward", "Relic", "Sigil"]],
  ["Origin", ["Ashfall", "Deepvault", "Skyreach", "Mirefen"]],
] as const;

const OWNERS = ["0x77Ce…10ab", "0x21Fb…9c04", "vault.eth", "0x8a3d…be71"];

type WalletSide = "me" | "them";
const PANES: { side: WalletSide; label: string }[] = [
  { side: "me", label: "You" },
  { side: "them", label: "Recipient" },
];

type Asset = {
  id: number;
  name: string;
  rarity: Rarity;
  hue: number;
  collection: string;
  tokenId: string;
  wallet: WalletSide;
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
      wallet: "me",
      attributes,
      history,
    };
  });
}

/** Reassign one asset to a wallet side, leaving the rest untouched. */
export function transferAsset<T extends { id: number; wallet: WalletSide }>(
  assets: T[],
  id: number,
  wallet: WalletSide,
): T[] {
  return assets.map((a) => (a.id === id ? { ...a, wallet } : a));
}

/** Read-only detail view for one asset: metadata, traits, and provenance. */
function AssetDetail({
  asset,
  onClose,
}: {
  asset: Asset;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      aria-label={`${asset.name} details`}
      className="w-[22rem] max-w-[92vw]"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {asset.name}
            </p>
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

        <div className="h-24 overflow-hidden rounded-lg">
          <NftArt seed={asset.hue + asset.id * 13} className="h-full w-full" />
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span
            className="font-semibold"
            style={{ color: RARITY_TINT[asset.rarity] }}
          >
            {asset.rarity}
          </span>
          <span className="font-mono text-muted">Token #{asset.tokenId}</span>
        </div>

        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-muted">
            Attributes
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {asset.attributes.map((a) => (
              <div
                key={a.trait}
                className="rounded-md border border-border bg-background/50 p-1.5"
              >
                <p className="text-[8px] uppercase tracking-wider text-muted">
                  {a.trait}
                </p>
                <p className="truncate text-[11px] font-medium text-foreground">
                  {a.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-muted">
            Provenance
          </p>
          <ol className="flex flex-col gap-1">
            {asset.history.map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-[11px]"
              >
                <span className="flex items-center gap-1.5">
                  <span aria-hidden style={{ color: ACCENT }}>
                    •
                  </span>
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

/** One draggable asset chip inside a transfer pane, with a keyboard-friendly send button. */
function TransferChip({
  asset,
  onSend,
}: {
  asset: Asset;
  onSend: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: asset.id,
  });
  const other = asset.wallet === "me" ? "Recipient" : "You";
  return (
    <li
      ref={setNodeRef}
      // The moving chip is drawn by the DragOverlay (which follows the pointer
      // across panes), so the source just dims in place as a placeholder.
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center justify-between gap-1 rounded-md border border-border bg-background/60 p-1.5"
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="flex min-w-0 flex-1 cursor-grab items-center gap-1.5 text-left"
      >
        <span
          className="h-4 w-4 shrink-0 rounded"
          style={{ backgroundColor: `hsl(${asset.hue} 55% 55%)` }}
        />
        <span className="truncate text-[10px] font-medium text-foreground">
          {asset.name}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onSend(asset.id)}
        aria-label={`Send ${asset.name} to ${other}`}
        className="shrink-0 rounded px-1 text-[13px] leading-none text-muted hover:text-foreground"
      >
        {asset.wallet === "me" ? "→" : "←"}
      </button>
    </li>
  );
}

/** A droppable wallet pane holding the assets currently assigned to one side. */
function WalletPane({
  side,
  label,
  assets,
  onSend,
}: {
  side: WalletSide;
  label: string;
  assets: Asset[];
  onSend: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: side });
  const mine = assets.filter((a) => a.wallet === side);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label} · {mine.length}
      </p>
      <ul
        ref={setNodeRef}
        aria-label={label}
        className="flex min-h-24 flex-1 flex-col gap-1.5 overflow-y-auto rounded-lg border p-1.5 transition"
        style={{ borderColor: isOver ? ACCENT : "var(--color-border)" }}
      >
        {mine.map((asset) => (
          <TransferChip key={asset.id} asset={asset} onSend={onSend} />
        ))}
      </ul>
    </div>
  );
}

/** Shorten a wallet address to the usual 0x1234…abcd form. */
export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * The gamer hub's wallet + inventory panel. Reads the real connected wallet
 * through the shared useWallet hook (address/ENS/balance); the NFT grid itself
 * stays fixture-driven. Click an asset for its metadata, attributes, and
 * provenance, or flip on transfer mode to drag assets between two wallets.
 * The transfer is a simulation, no chain transaction is sent.
 */
export function NftInventoryPanel({ feature }: { feature: WorkFeature }) {
  const { address, ensName, balanceLabel, isConnected, disconnect } =
    useWallet();
  const [selected, setSelected] = useState<Asset | null>(null);
  const [transferMode, setTransferMode] = useState(false);
  const [assets, setAssets] = useState<Asset[]>(inventory);
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeAsset = assets.find((a) => a.id === activeId) ?? null;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Staging holds while the panes are arranged; the move is only committed
  // once the user confirms and the (simulated) transfer settles.
  const [snapshot, setSnapshot] = useState<Asset[] | null>(null);
  const [phase, setPhase] = useState<"idle" | "confirm" | "sending" | "done">(
    "idle",
  );
  const [sentCount, setSentCount] = useState(0);
  const staged = assets.filter((a) => a.wallet === "them").length;

  const send = (id: number, to: WalletSide) =>
    setAssets((prev) => transferAsset(prev, id, to));

  const enterTransfer = () => {
    setSnapshot(assets);
    setTransferMode(true);
  };
  const cancelTransfer = () => {
    if (snapshot) setAssets(snapshot);
    setSnapshot(null);
    setTransferMode(false);
    setPhase("idle");
  };
  const startTransfer = () => {
    setSentCount(staged);
    setPhase("sending");
    // Simulate the on-chain settle before confirming completion.
    setTimeout(() => setPhase("done"), 2500);
  };
  const finishTransfer = () => {
    setSnapshot(null);
    setTransferMode(false);
    setPhase("idle");
  };
  const closeTransferModal = () => {
    if (phase === "sending") return; // can't dismiss mid-transfer
    if (phase === "done") finishTransfer();
    else setPhase("idle");
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(Number(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const target = e.over?.id;
    if (target === "me" || target === "them") {
      send(Number(e.active.id), target);
    }
  };

  const identity = ensName ?? (address ? shortAddress(address) : "");

  return (
    <div
      className="flex min-h-full flex-col gap-3.5 p-5 text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(50% 40% at 4% 0%, hsl(272 90% 66% / 0.26), transparent 60%), radial-gradient(46% 42% at 96% 4%, hsl(190 90% 60% / 0.2), transparent 62%), radial-gradient(60% 50% at 60% 100%, hsl(320 90% 62% / 0.14), transparent 62%)",
      }}
    >
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-muted">
            Web3 gamer hub{" "}
            <span style={{ color: "hsl(190 90% 62%)" }}>/</span> vault
          </p>
          <h2
            className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            style={{
              backgroundImage:
                "linear-gradient(96deg, hsl(272 90% 74%), hsl(190 90% 66%) 55%, hsl(320 90% 70%))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {feature.title}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <button
                type="button"
                onClick={transferMode ? cancelTransfer : enterTransfer}
                aria-pressed={transferMode}
                className="paul-touch-min rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground"
              >
                {transferMode ? "Cancel" : "Transfer"}
              </button>
              <button
                type="button"
                onClick={() => disconnect()}
                className="paul-touch-min rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted hover:text-foreground"
              >
                Disconnect
              </button>
            </>
          ) : (
            <ConnectWallet />
          )}
        </div>
      </div>

      {isConnected && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
          <span className="font-mono text-foreground">{identity}</span>
          {balanceLabel && <span className="text-muted">{balanceLabel}</span>}
        </div>
      )}

      {!isConnected ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <span aria-hidden className="text-3xl">
            👛
          </span>
          <p className="text-[12px] text-muted">
            connect a wallet to see your on-chain items
          </p>
        </div>
      ) : transferMode ? (
        <>
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex min-h-0 flex-1 gap-2">
            {PANES.map((pane) => (
              <WalletPane
                key={pane.side}
                side={pane.side}
                label={pane.label}
                assets={assets}
                onSend={(id) => send(id, pane.side === "me" ? "them" : "me")}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeAsset ? (
              <div className="flex cursor-grabbing items-center gap-1.5 rounded-md border border-border bg-background/90 p-1.5 shadow-lg">
                <span
                  className="h-4 w-4 shrink-0 rounded"
                  style={{ backgroundColor: `hsl(${activeAsset.hue} 55% 55%)` }}
                />
                <span className="truncate text-[10px] font-medium text-foreground">
                  {activeAsset.name}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-muted">
            {staged} staged for the recipient
          </span>
          <button
            type="button"
            disabled={staged === 0}
            onClick={() => setPhase("confirm")}
            className="rounded-md px-3.5 py-1.5 text-[12px] font-semibold text-background transition-opacity disabled:opacity-40"
            style={{
              background:
                "linear-gradient(96deg, hsl(272 90% 66%), hsl(320 90% 62%))",
            }}
          >
            Confirm transfer{staged > 0 ? ` (${staged})` : ""}
          </button>
        </div>

        <Modal
          open={phase !== "idle"}
          onClose={closeTransferModal}
          aria-label="Transfer"
        >
          {phase === "confirm" && (
            <div className="flex flex-col gap-3">
              <p className="font-display text-lg font-bold text-foreground">
                Confirm transfer
              </p>
              <p className="text-[13px] leading-relaxed text-muted">
                Send {staged} item{staged === 1 ? "" : "s"} to the recipient
                wallet? This simulates an on-chain transfer.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPhase("idle")}
                  className="rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={startTransfer}
                  className="rounded-md px-3.5 py-1.5 text-[12px] font-semibold text-background"
                  style={{
                    background:
                      "linear-gradient(96deg, hsl(272 90% 66%), hsl(320 90% 62%))",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {phase === "sending" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span
                className="h-8 w-8 rounded-full border-2 border-white/15 motion-safe:animate-spin"
                style={{ borderTopColor: "hsl(272 90% 66%)" }}
              />
              <p className="text-[13px] text-muted">
                Transferring {sentCount} item{sentCount === 1 ? "" : "s"}…
              </p>
              <p className="font-mono text-[10px] text-muted">
                broadcasting to the network
              </p>
            </div>
          )}
          {phase === "done" && (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <span className="text-3xl" aria-hidden>
                ✅
              </span>
              <p className="font-display text-lg font-bold text-foreground">
                Transfer complete
              </p>
              <p className="text-[13px] text-muted">
                {sentCount} item{sentCount === 1 ? "" : "s"} sent to the
                recipient.
              </p>
              <button
                type="button"
                onClick={finishTransfer}
                className="mt-1 rounded-md px-4 py-1.5 text-[12px] font-semibold text-background"
                style={{
                  background:
                    "linear-gradient(96deg, hsl(272 90% 66%), hsl(320 90% 62%))",
                }}
              >
                Done
              </button>
            </div>
          )}
        </Modal>
        </>
      ) : (
        <div
          aria-label="Inventory grid"
          className="grid min-h-0 flex-1 grid-cols-3 gap-2 overflow-y-auto"
        >
          {assets
            .filter((a) => a.wallet === "me")
            .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] text-left backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/25"
            >
              {/* holographic sheen */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, transparent 30%, hsl(190 90% 70% / 0.25) 45%, hsl(320 90% 70% / 0.2) 55%, transparent 70%)",
                }}
              />
              <div className="h-14">
                <NftArt seed={item.hue + item.id * 13} className="h-full w-full" />
              </div>
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

      {selected && (
        <AssetDetail asset={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/**
 * Vignette wrapper: mounts the app's Web3Provider so the panel's wallet reads
 * work here without loading wallet code app-wide. Rendered client-only.
 */
export default function NftInventoryDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  return (
    <Web3Provider>
      <NftInventoryPanel feature={feature} />
    </Web3Provider>
  );
}
