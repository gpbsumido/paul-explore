"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import IconButton from "@/components/ui/IconButton";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #e879f9)";
const STATS = ["STR", "AGI", "INT", "LCK"] as const;
type Stat = (typeof STATS)[number];

type Character = {
  name: string;
  cls: string;
  stats: Record<Stat, number>;
};

/**
 * Vignette: the content engine's character sheets. Edit a game character's
 * name, class, and stat points (a small budget), with a live radar-ish bar
 * readout.
 */
export default function CharacterSheetsDemo({ feature }: { feature: WorkFeature }) {
  const [char, setChar] = useState<Character>({
    name: "Aria Vale",
    cls: "Ranger",
    stats: { STR: 6, AGI: 9, INT: 5, LCK: 4 },
  });

  const total = STATS.reduce((sum, s) => sum + char.stats[s], 0);

  const bump = (stat: Stat, dir: -1 | 1) =>
    setChar((c) => {
      const value = c.stats[stat] + dir;
      if (value < 0 || value > 10) return c;
      if (dir === 1 && total >= 30) return c;
      return { ...c, stats: { ...c.stats, [stat]: value } };
    });

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Name"
          size="sm"
          value={char.name}
          onChange={(e) => setChar((c) => ({ ...c, name: e.target.value }))}
        />
        <Input
          label="Class"
          size="sm"
          value={char.cls}
          onChange={(e) => setChar((c) => ({ ...c, cls: e.target.value }))}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted">
        <span>Stat points</span>
        <span data-testid="stat-total">{total} / 30</span>
      </div>

      <div className="min-h-0 flex-1 space-y-2">
        {STATS.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className="w-8 text-[11px] font-medium text-foreground">{s}</span>
            <IconButton size="sm" aria-label={`Lower ${s}`} onClick={() => bump(s, -1)} className="!h-5 !w-5 border border-border text-[11px]">−</IconButton>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <span className="block h-full rounded-full" style={{ width: `${char.stats[s] * 10}%`, backgroundColor: ACCENT }} />
            </span>
            <span className="w-5 text-right text-[11px] tabular-nums text-foreground">
              {char.stats[s]}
            </span>
            <IconButton size="sm" aria-label={`Raise ${s}`} onClick={() => bump(s, 1)} className="!h-5 !w-5 border border-border text-[11px]">+</IconButton>
          </div>
        ))}
      </div>
    </div>
  );
}
