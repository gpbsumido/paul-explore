"use client";

import { useEffect, useState } from "react";

import { formatCAD } from "@/lib/operator-sales";
import { promotionPerformanceSchema } from "@/lib/operator-schemas";
import { zoneLabel } from "@/lib/operator-timezone";
import Bone from "../Bone";

interface PromotionPerformanceProps {
  promotionId: string;
  timeZone: string;
}

type Performance = {
  window: { units: number; revenue: number };
  baseline: { units: number; revenue: number };
  unitsChangePercent: number | null;
  revenueChangePercent: number | null;
  measuredFrom: string;
  measuredTo: string;
  note: string;
};

function formatRange(from: string, to: string, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    month: "short",
    day: "numeric",
  });
  return `${fmt.format(new Date(from))} to ${fmt.format(new Date(to))}`;
}

/**
 * What a promotion actually did, next to what happened before it.
 *
 * Both raw totals are shown rather than only the delta, because the delta on its
 * own invites reading a cause into it. The wording says what this is, and the
 * sign and word carry the direction so colour is never the only signal.
 */
export default function PromotionPerformance({
  promotionId,
  timeZone,
}: PromotionPerformanceProps) {
  const [data, setData] = useState<Performance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/operator/promotions/${promotionId}/performance`,
        );
        if (!res.ok) throw new Error("failed");
        const parsed = promotionPerformanceSchema
          .omit({ promotion: true })
          .parse(await res.json());
        if (!cancelled) setData(parsed as Performance);
      } catch {
        if (!cancelled) setError("Could not load performance for this one.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [promotionId]);

  if (error) {
    return (
      <p role="alert" className="text-xs text-error-500">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="space-y-1.5">
        <Bone style={{ height: 14, width: "40%" }} />
        <Bone style={{ height: 32, width: "100%", borderRadius: 6 }} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-wide text-muted">
        {formatRange(data.measuredFrom, data.measuredTo, timeZone)} &middot;{" "}
        {zoneLabel(timeZone)}
      </p>

      <table className="w-full text-xs">
        <caption className="sr-only">
          Units and revenue during the promotion compared with the equal-length
          period before it
        </caption>
        <thead>
          <tr className="text-left text-muted">
            <th scope="col" className="pb-1 font-medium">
              &nbsp;
            </th>
            <th scope="col" className="pb-1 text-right font-medium">
              Before
            </th>
            <th scope="col" className="pb-1 text-right font-medium">
              During
            </th>
            <th scope="col" className="pb-1 text-right font-medium">
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          <Row
            label="Units"
            before={String(data.baseline.units)}
            during={String(data.window.units)}
            change={data.unitsChangePercent}
          />
          <Row
            label="Revenue"
            before={formatCAD(data.baseline.revenue)}
            during={formatCAD(data.window.revenue)}
            change={data.revenueChangePercent}
          />
        </tbody>
      </table>

      <p className="text-[11px] leading-relaxed text-muted">{data.note}</p>
    </div>
  );
}

function Row({
  label,
  before,
  during,
  change,
}: {
  label: string;
  before: string;
  during: string;
  change: number | null;
}) {
  // No baseline means a percentage would be a fabrication, so say that instead.
  const changeLabel =
    change === null
      ? "no baseline"
      : `${change > 0 ? "up" : change < 0 ? "down" : "flat"} ${Math.abs(change)}%`;

  return (
    <tr className="border-t border-border">
      <th scope="row" className="py-1.5 text-left font-normal text-foreground">
        {label}
      </th>
      <td className="py-1.5 text-right tabular-nums text-muted">{before}</td>
      <td className="py-1.5 text-right tabular-nums font-medium text-foreground">
        {during}
      </td>
      <td className="py-1.5 text-right tabular-nums text-muted">
        {changeLabel}
      </td>
    </tr>
  );
}
