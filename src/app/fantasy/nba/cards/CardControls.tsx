"use client";

import { RARITY_META, type Rarity } from "@/lib/fantasy-cards";
import {
  CARD_SORTS,
  RARITY_ORDER,
  type CardSort,
  type RarityFilter,
} from "@/lib/card-view";

type Props = {
  /** The full set, to count each rarity for the chips. */
  cards: readonly { rarity: Rarity }[];
  filter: RarityFilter;
  onFilter: (f: RarityFilter) => void;
  sort: CardSort;
  onSort: (s: CardSort) => void;
};

/** Rarity filter chips + a sort control, shared by every page that shows cards. */
export default function CardControls({ cards, filter, onFilter, sort, onSort }: Props) {
  const present = RARITY_ORDER.filter((r) => cards.some((c) => c.rarity === r));
  const chip = (value: RarityFilter, label: string, count: number) => {
    const active = filter === value;
    return (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        onClick={() => onFilter(value)}
        className={[
          "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
          active
            ? "border-foreground bg-foreground text-background"
            : "border-border text-muted hover:text-foreground",
        ].join(" ")}
      >
        {label}
        <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
      </button>
    );
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label="Filter by rarity" className="flex flex-wrap gap-2">
        {chip("all", "All", cards.length)}
        {present.map((r) => chip(r, RARITY_META[r].label, cards.filter((c) => c.rarity === r).length))}
      </div>

      <label className="flex items-center gap-2 text-[13px] text-muted">
        Sort
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as CardSort)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          {CARD_SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
