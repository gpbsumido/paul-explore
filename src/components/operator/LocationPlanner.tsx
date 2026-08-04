"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_PLANNER_INPUTS,
  LOCATION_TYPES,
  MARGIN_TIERS,
  PLATFORM_FEE_PER_UNIT_MONTHLY,
  PRICE_TIERS,
  TXN_FEE_FLAT,
  TXN_FEE_RATE,
  plannerBenchmarksResponseSchema,
  plannerInputsToQuery,
  projectLocation,
  type FleetBenchmarks,
  type PlannerInputs,
} from "@/lib/operator-planner";
import { formatCAD } from "@/lib/operator-sales";

interface LocationPlannerProps {
  /** Inputs to start from, parsed from the URL or the bundled defaults. */
  initialInputs?: PlannerInputs;
  /**
   * Whether to offer the fleet's own averages as defaults. False when the URL
   * carried explicit state (a shared link), so we don't override the sender.
   */
  prefillFromFleet?: boolean;
}

/** The 24-month horizon the payback bar fills against. */
const PAYBACK_HORIZON_MONTHS = 24;

/** Formats a percentage with at most one decimal, e.g. "5%" or "2.5%". */
function formatPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

/** Keeps the address bar in step with the inputs, so the plan is a shareable link. */
function syncUrl(inputs: PlannerInputs): void {
  if (typeof window === "undefined") return;
  const query = plannerInputsToQuery(inputs);
  window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
}

/**
 * A what-if planner for a new location. Foot traffic and conversion drive
 * orders, a basket size and price drive revenue, a margin and the platform's
 * fees drive profit, and the payback period falls out of hardware cost over
 * monthly net profit. Everything recomputes live from pure functions; the only
 * network call fetches the fleet's real averages to offer as defaults.
 */
export default function LocationPlanner({
  initialInputs = DEFAULT_PLANNER_INPUTS,
  prefillFromFleet = true,
}: LocationPlannerProps) {
  const [inputs, setInputs] = useState<PlannerInputs>(initialInputs);

  useEffect(() => {
    syncUrl(inputs);
  }, [inputs]);

  const { data: benchmarks } = useQuery({
    queryKey: ["operator", "planner", "benchmarks"],
    queryFn: async ({ signal }): Promise<FleetBenchmarks | null> => {
      const res = await fetch("/api/operator/planner/benchmarks", { signal });
      if (!res.ok) throw new Error("Failed to fetch planner benchmarks");
      return plannerBenchmarksResponseSchema.parse(await res.json()).benchmarks;
    },
    staleTime: Infinity,
  });

  const projection = useMemo(() => projectLocation(inputs), [inputs]);

  const update = (patch: Partial<PlannerInputs>) =>
    setInputs((prev) => ({ ...prev, ...patch }));

  const useFleetAverages = () => {
    if (!benchmarks) return;
    update({
      avgItemPrice: benchmarks.avgItemPrice,
      itemsPerOrder: benchmarks.itemsPerOrder,
    });
  };

  const paybackPct =
    projection.paybackMonths === null
      ? 100
      : Math.min(
          100,
          (projection.paybackMonths / PAYBACK_HORIZON_MONTHS) * 100,
        );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ---------------------------------------------------------------- */}
      {/* Inputs */}
      {/* ---------------------------------------------------------------- */}
      <form
        className="space-y-5 rounded-xl border border-border bg-surface p-5"
        aria-label="Location assumptions"
        onSubmit={(e) => e.preventDefault()}
      >
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            Assumptions
          </legend>

          <PresetGroup
            label="Location type"
            options={LOCATION_TYPES.map((t) => ({
              id: t.id,
              label: t.label,
              value: t.conversionRate,
            }))}
            active={inputs.conversionRate}
            onSelect={(conversionRate) => update({ conversionRate })}
          />

          <SliderRow
            id="planner-traffic"
            label="Daily foot traffic"
            min={0}
            max={500}
            step={5}
            value={inputs.dailyFootTraffic}
            format={(v) => `${v} / day`}
            onChange={(dailyFootTraffic) => update({ dailyFootTraffic })}
          />

          <SliderRow
            id="planner-conversion"
            label="Conversion rate"
            min={0}
            max={15}
            step={0.5}
            value={inputs.conversionRate}
            format={formatPercent}
            onChange={(conversionRate) => update({ conversionRate })}
          />

          <PresetGroup
            label="Price tier"
            options={PRICE_TIERS.map((t) => ({
              id: t.id,
              label: t.label,
              value: t.avgItemPrice,
            }))}
            active={inputs.avgItemPrice}
            onSelect={(avgItemPrice) => update({ avgItemPrice })}
          />

          <SliderRow
            id="planner-price"
            label="Basket price"
            min={0}
            max={15}
            step={0.25}
            value={inputs.avgItemPrice}
            format={formatCAD}
            onChange={(avgItemPrice) => update({ avgItemPrice })}
          />

          <SliderRow
            id="planner-items"
            label="Items per order"
            min={0}
            max={3}
            step={0.1}
            value={inputs.itemsPerOrder}
            format={(v) => `${Math.round(v * 10) / 10}`}
            onChange={(itemsPerOrder) => update({ itemsPerOrder })}
          />

          <PresetGroup
            label="Product mix"
            options={MARGIN_TIERS.map((t) => ({
              id: t.id,
              label: t.label,
              value: t.margin,
            }))}
            active={inputs.margin}
            onSelect={(margin) => update({ margin })}
          />

          <SliderRow
            id="planner-margin"
            label="Gross margin"
            min={0}
            max={100}
            step={5}
            value={inputs.margin}
            format={formatPercent}
            onChange={(margin) => update({ margin })}
          />

          <SliderRow
            id="planner-units"
            label="Units at this location"
            min={1}
            max={10}
            step={1}
            value={inputs.units}
            format={(v) => `${v}`}
            onChange={(units) => update({ units })}
          />
        </fieldset>

        {/* Fleet-derived defaults: anchor the estimate in real numbers. Only
            offered on a fresh visit; a shared link keeps the sender's numbers. */}
        {prefillFromFleet && benchmarks && (
          <p className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted">
            Your fleet averages{" "}
            <span className="font-medium text-foreground">
              {formatCAD(benchmarks.avgItemPrice)}
            </span>{" "}
            per item and{" "}
            <span className="font-medium text-foreground">
              {Math.round(benchmarks.itemsPerOrder * 10) / 10}
            </span>{" "}
            items per order across {benchmarks.sampleSize.toLocaleString()}{" "}
            transactions.{" "}
            <button
              type="button"
              onClick={useFleetAverages}
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              Use fleet averages
            </button>
          </p>
        )}

        <button
          type="button"
          onClick={() => setInputs(DEFAULT_PLANNER_INPUTS)}
          className="text-xs font-medium text-muted hover:text-foreground transition-colors"
        >
          Reset to defaults
        </button>
      </form>

      {/* ---------------------------------------------------------------- */}
      {/* Projection */}
      {/* ---------------------------------------------------------------- */}
      <div
        role="status"
        aria-live="polite"
        className="space-y-4 rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">Projection</h2>

        <dl className="space-y-2">
          <Figure
            label="Gross revenue / year"
            value={formatCAD(projection.grossRevenueAnnual)}
          />
          <Figure
            label="Revenue / unit / year"
            value={formatCAD(projection.revenuePerUnitAnnual)}
            muted
          />
        </dl>

        <hr className="border-border" />

        <dl className="space-y-2">
          <Figure
            label="Net profit / month"
            value={formatCAD(projection.netProfitMonthly)}
          />
          <Figure
            label="Net profit / year"
            value={formatCAD(projection.netProfitAnnual)}
            muted
          />
        </dl>

        <hr className="border-border" />

        <dl className="space-y-2">
          <Figure
            label="Hardware cost"
            value={formatCAD(projection.hardwareCost)}
            muted
          />
        </dl>

        {/* Payback: the honest headline, or the honest non-answer */}
        {projection.paybackMonths === null ? (
          <div className="rounded-lg border border-warning-300 bg-warning-50 px-3 py-3 text-sm dark:border-warning-800 dark:bg-warning-950/40">
            <p className="font-semibold text-warning-800 dark:text-warning-300">
              ⚠ Never pays back at these numbers
            </p>
            <p className="mt-1 text-warning-700 dark:text-warning-400">
              Net profit is {formatCAD(projection.netProfitMonthly)} / month
              after fees, so the hardware never earns itself back. Raise traffic,
              price or margin to change that.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-foreground">
                Payback
              </span>
              <span className="tabular-nums text-lg font-bold text-foreground">
                {projection.paybackMonths} months
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background"
              role="img"
              aria-label={`Payback in ${projection.paybackMonths} months, against a ${PAYBACK_HORIZON_MONTHS}-month horizon`}
            >
              <div
                className="h-full rounded-full bg-primary-600"
                style={{ width: `${paybackPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Bar fills against a {PAYBACK_HORIZON_MONTHS}-month horizon.
            </p>
          </div>
        )}

        <p className="text-xs text-muted">
          Fees modelled: {formatCAD(PLATFORM_FEE_PER_UNIT_MONTHLY)} / unit /
          month, plus {Math.round(TXN_FEE_RATE * 100)}% +{" "}
          {formatCAD(TXN_FEE_FLAT)} per order. A month is 30 days.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

interface SliderRowProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

/** A labelled range input with the current value read out beside it. */
function SliderRow({
  id,
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: SliderRowProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm text-foreground">
          {label}
        </label>
        <span className="tabular-nums text-sm font-medium text-foreground">
          {format(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 min-h-[44px] w-full cursor-pointer accent-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      />
    </div>
  );
}

interface PresetOption {
  id: string;
  label: string;
  value: number;
}

interface PresetGroupProps {
  label: string;
  options: readonly PresetOption[];
  active: number;
  onSelect: (value: number) => void;
}

/** A row of preset buttons; the one matching the current value is pressed. */
function PresetGroup({ label, options, active, onSelect }: PresetGroupProps) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1">
        {options.map((option) => {
          const isActive = option.value === active;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect(option.value)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500 ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface FigureProps {
  label: string;
  value: string;
  muted?: boolean;
}

/** One label/value line in the projection panel. */
function Figure({ label, value, muted }: FigureProps) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className={`text-sm ${muted ? "text-muted" : "text-foreground"}`}>
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          muted ? "text-sm text-muted" : "text-base font-semibold text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
