"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #e879f9)";
const STATS = ["STR", "AGI", "INT", "LCK"] as const;
type Stat = (typeof STATS)[number];
type Stats = Record<Stat, number>;
const CLASSES = ["Ranger", "Warrior", "Mage", "Rogue"];
const BUDGET = 30;

type Character = { id: number; name: string; cls: string; stats: Stats };

const INITIAL: Character[] = [
  { id: 1, name: "Aria Vale", cls: "Ranger", stats: { STR: 6, AGI: 9, INT: 5, LCK: 4 } },
  { id: 2, name: "Bran Oskar", cls: "Warrior", stats: { STR: 10, AGI: 4, INT: 3, LCK: 5 } },
];

const sum = (s: Stats) => STATS.reduce((a, k) => a + s[k], 0);

/** Apply a +/-1 step to one stat, respecting the [0,10] and total-budget caps. */
function bumpStat(stats: Stats, stat: Stat, dir: -1 | 1): Stats {
  const value = stats[stat] + dir;
  if (value < 0 || value > 10) return stats;
  if (dir === 1 && sum(stats) >= BUDGET) return stats;
  return { ...stats, [stat]: value };
}

function StatRow({
  stat,
  value,
  onBump,
}: {
  stat: Stat;
  value: number;
  onBump: (stat: Stat, dir: -1 | 1) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[11px] font-medium text-foreground">{stat}</span>
      <IconButton
        size="sm"
        aria-label={`Lower ${stat}`}
        onClick={() => onBump(stat, -1)}
        className="!h-5 !w-5 border border-border text-[11px]"
      >
        −
      </IconButton>
      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <span
          className="block h-full rounded-full"
          style={{ width: `${value * 10}%`, backgroundColor: ACCENT }}
        />
      </span>
      <span className="w-5 text-right text-[11px] tabular-nums text-foreground">
        {value}
      </span>
      <IconButton
        size="sm"
        aria-label={`Raise ${stat}`}
        onClick={() => onBump(stat, 1)}
        className="!h-5 !w-5 border border-border text-[11px]"
      >
        +
      </IconButton>
    </div>
  );
}

const STEPS = ["Identity", "Class", "Stats"];

/** A stepped create flow: name, then class, then the stat budget. */
function CreateCharacterModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (character: Omit<Character, "id">) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [cls, setCls] = useState(CLASSES[0]);
  const [stats, setStats] = useState<Stats>({ STR: 5, AGI: 5, INT: 5, LCK: 5 });

  const canAdvance = step === 0 ? name.trim().length > 0 : true;

  return (
    <Modal open onClose={onClose} aria-label="Create character">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            New character
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col gap-1">
                <div
                  className="h-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: i <= step ? ACCENT : "var(--color-border)",
                  }}
                />
                <span
                  className={`text-[10px] ${i === step ? "text-foreground" : "text-muted"}`}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {step === 0 && (
          <Input
            label="Name"
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name your character"
          />
        )}

        {step === 1 && (
          <label className="flex flex-col gap-1 text-[13px]">
            <span className="font-medium text-foreground">Class</span>
            <select
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-[13px] text-foreground"
              value={cls}
              onChange={(e) => setCls(e.target.value)}
            >
              {CLASSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>Stat points</span>
              <span>
                {sum(stats)} / {BUDGET}
              </span>
            </div>
            {STATS.map((s) => (
              <StatRow
                key={s}
                stat={s}
                value={stats[s]}
                onBump={(stat, dir) => setStats((st) => bumpStat(st, stat, dir))}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button size="sm" onClick={() => onCreate({ name: name.trim(), cls, stats })}>
              Create character
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/**
 * Vignette: the content engine's character sheets. A roster of characters plus
 * an editable sheet (name, class, and a stat-point budget), with a stepped
 * create flow for new characters.
 */
export default function CharacterSheetsDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [characters, setCharacters] = useState<Character[]>(INITIAL);
  const [selectedId, setSelectedId] = useState(1);
  const [creating, setCreating] = useState(false);
  const [nextId, setNextId] = useState(3);

  const selected = characters.find((c) => c.id === selectedId) ?? characters[0];
  const total = sum(selected.stats);

  const patchSelected = (patch: Partial<Character>) =>
    setCharacters((cs) =>
      cs.map((c) => (c.id === selected.id ? { ...c, ...patch } : c)),
    );

  const bump = (stat: Stat, dir: -1 | 1) =>
    setCharacters((cs) =>
      cs.map((c) =>
        c.id === selected.id ? { ...c, stats: bumpStat(c.stats, stat, dir) } : c,
      ),
    );

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">
          {feature.title}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
          style={{ backgroundColor: ACCENT }}
        >
          New character
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-[9rem_1fr]">
        <ul
          aria-label="Roster"
          className="min-h-0 space-y-1 overflow-y-auto"
        >
          {characters.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={c.id === selected.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full rounded-md border px-2.5 py-1.5 text-left transition-colors ${
                  c.id === selected.id
                    ? "border-foreground/40 bg-foreground/[0.04]"
                    : "border-border hover:bg-foreground/[0.02]"
                }`}
              >
                <span className="block truncate text-[12px] text-foreground">
                  {c.name}
                </span>
                <span className="text-[10px] text-muted">{c.cls}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex min-h-0 flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Name"
              size="sm"
              value={selected.name}
              onChange={(e) => patchSelected({ name: e.target.value })}
            />
            <Input
              label="Class"
              size="sm"
              value={selected.cls}
              onChange={(e) => patchSelected({ cls: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Stat points</span>
            <span data-testid="stat-total">
              {total} / {BUDGET}
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-2">
            {STATS.map((s) => (
              <StatRow
                key={s}
                stat={s}
                value={selected.stats[s]}
                onBump={bump}
              />
            ))}
          </div>
        </div>
      </div>

      {creating && (
        <CreateCharacterModal
          onClose={() => setCreating(false)}
          onCreate={(character) => {
            const id = nextId;
            setNextId((n) => n + 1);
            setCharacters((cs) => [...cs, { id, ...character }]);
            setSelectedId(id);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
