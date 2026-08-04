// ---------------------------------------------------------------------------
// Shrink and loss: reconcile what the system believed was on the shelf against
// what a restocker physically counted. The gap splits two ways, and keeping
// them apart is the whole point:
//
//   - unexplained shrink: counted fewer than expected, with no reason logged.
//     This is the theft-or-miscount signal, the money that leaves without a
//     trace.
//   - explained loss: stock the restocker deliberately pulled and gave a reason
//     for (expired, damaged, other). Still a loss, but an accounted one.
//
// A surplus (counted more than expected) is a miscount the other way, not
// negative shrink, so it never nets against a real shortfall. All pure, all
// take explicit inputs, all round money to cents.
// ---------------------------------------------------------------------------

/** One reconciled restock line: what was expected, counted, and pulled. */
export type ShrinkLineInput = {
  itemId: string;
  expectedQty: number;
  /** Null means the restocker skipped counting this slot; it cannot reveal shrink. */
  countedQty: number | null;
  removed: number;
  removalReason: string | null;
};

export type ShrinkSummary = {
  unexplainedUnits: number;
  unexplainedValue: number;
  explainedUnits: number;
  explainedValue: number;
  explainedByReason: Record<string, number>;
  /** Slots that were physically counted, so they could reveal shrink. */
  countedLines: number;
  /** Slots skipped, which say nothing either way. */
  notCountedLines: number;
};

/** Rounds a currency value to the nearest cent. */
function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

const EMPTY: ShrinkSummary = {
  unexplainedUnits: 0,
  unexplainedValue: 0,
  explainedUnits: 0,
  explainedValue: 0,
  explainedByReason: {},
  countedLines: 0,
  notCountedLines: 0,
};

/**
 * Reconciles a set of restock lines into a shrink summary, valuing every unit
 * at its item's price. Lines with no count are recorded as coverage gaps rather
 * than treated as zero shrink.
 */
export function summarizeShrink(
  lines: readonly ShrinkLineInput[],
  priceByItemId: Record<string, number>,
): ShrinkSummary {
  let unexplainedUnits = 0;
  let unexplainedValue = 0;
  let explainedUnits = 0;
  let explainedValue = 0;
  let countedLines = 0;
  let notCountedLines = 0;
  const explainedByReason: Record<string, number> = {};

  for (const line of lines) {
    const price = priceByItemId[line.itemId] ?? 0;

    if (line.countedQty === null) {
      notCountedLines += 1;
    } else {
      countedLines += 1;
      const shortfall = Math.max(0, line.expectedQty - line.countedQty);
      unexplainedUnits += shortfall;
      unexplainedValue += shortfall * price;
    }

    if (line.removed > 0) {
      explainedUnits += line.removed;
      explainedValue += line.removed * price;
      const reason = line.removalReason ?? "other";
      explainedByReason[reason] = (explainedByReason[reason] ?? 0) + line.removed;
    }
  }

  return {
    unexplainedUnits,
    unexplainedValue: toCents(unexplainedValue),
    explainedUnits,
    explainedValue: toCents(explainedValue),
    explainedByReason,
    countedLines,
    notCountedLines,
  };
}

export type StoreShrinkInput = {
  storeId: string;
  storeName: string;
  lines: readonly ShrinkLineInput[];
  priceByItemId: Record<string, number>;
};

export type StoreShrink = ShrinkSummary & {
  storeId: string;
  storeName: string;
};

export type FleetShrink = {
  stores: readonly StoreShrink[];
  totals: ShrinkSummary;
};

/** Merges one summary's numbers into an accumulator. */
function addInto(acc: ShrinkSummary, s: ShrinkSummary): ShrinkSummary {
  const explainedByReason = { ...acc.explainedByReason };
  for (const [reason, units] of Object.entries(s.explainedByReason)) {
    explainedByReason[reason] = (explainedByReason[reason] ?? 0) + units;
  }
  return {
    unexplainedUnits: acc.unexplainedUnits + s.unexplainedUnits,
    unexplainedValue: toCents(acc.unexplainedValue + s.unexplainedValue),
    explainedUnits: acc.explainedUnits + s.explainedUnits,
    explainedValue: toCents(acc.explainedValue + s.explainedValue),
    explainedByReason,
    countedLines: acc.countedLines + s.countedLines,
    notCountedLines: acc.notCountedLines + s.notCountedLines,
  };
}

/**
 * Reconciles every store, ranks them worst-first by the value of unexplained
 * shrink (that is the number an operator chases), and totals the fleet.
 */
export function fleetShrink(
  stores: readonly StoreShrinkInput[],
): FleetShrink {
  const summarized: StoreShrink[] = stores.map((store) => ({
    storeId: store.storeId,
    storeName: store.storeName,
    ...summarizeShrink(store.lines, store.priceByItemId),
  }));

  const ranked = [...summarized].sort(
    (a, b) =>
      b.unexplainedValue - a.unexplainedValue ||
      a.storeName.localeCompare(b.storeName),
  );

  const totals = summarized.reduce(addInto, EMPTY);

  return { stores: ranked, totals };
}
