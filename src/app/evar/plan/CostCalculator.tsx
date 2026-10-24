"use client";

import { useId, useState } from "react";
import { MEASURED, MIDDLE, PRICES, SCENARIO_KEYS, SLIDERS, estimate, type DeliveryPlan, type LineId, type Scenario } from "@/lib/evar/costs";
import { cad, cadRounded, count, duration, size, usd } from "./format";

/** What each slider is called, and how its value is said aloud and shown. */
const SLIDER_COPY: Record<keyof Scenario, { label: string; say: (n: number) => string }> = {
  scans: { label: "Scans in the library", say: (n) => `${count(n)} ${n === 1 ? "scan" : "scans"}` },
  peoplePerDay: { label: "People a day", say: (n) => `${count(n)} ${n === 1 ? "person" : "people"} a day` },
  scansEachPerDay: { label: "Scans each a day", say: (n) => `${count(n)} ${n === 1 ? "scan" : "scans"} each a day` },
  months: { label: "How long", say: duration },
  residentPerHour: { label: "A resident's rate", say: (n) => `${cadRounded(n)} an hour` },
  minutesPerScan: { label: "Minutes a scan", say: (n) => `${n} ${n === 1 ? "minute" : "minutes"} a scan` },
};

const DELIVERY_NOTE: Record<DeliveryPlan, string> = {
  free: "Inside CloudFront's free terabyte a month.",
  perGb: `Past the free terabyte, at ${usd(PRICES.cloudfrontPerGb.value)} a GB.`,
  flat: `The flat-rate Pro plan, ${usd(PRICES.cloudfrontFlatPro.value)} a month, is cheaper than paying by the GB.`,
};

/** A line's name and how it was worked out, for the breakdown. */
function lineCopy(id: LineId, s: Scenario, delivery: DeliveryPlan): { label: string; how: string } {
  switch (id) {
    case "resident":
      return {
        label: "A resident's time",
        how: `${count(s.scans)} scans at ${s.minutesPerScan} minutes each and ${cadRounded(s.residentPerHour)} an hour, paid once.`,
      };
    case "servers":
      return { label: "API and database (Railway)", how: `Hobby, ${usd(PRICES.railwayHobby.value)} a month with that much usage included.` };
    case "delivery":
      return { label: "Scan delivery (CloudFront)", how: DELIVERY_NOTE[delivery] };
    case "storage":
      return {
        label: "Scan storage (S3)",
        how: `${size((s.scans * MEASURED.scanMb) / 1000)} at ${usd(PRICES.s3PerGbMonth.value)} a GB a month.`,
      };
    case "domain":
      return { label: "Domain (.com)", how: "Paid a year at a time." };
    case "website":
      return { label: "Website (Vercel Hobby)", how: "Free while the site is non-commercial." };
    case "signIn":
      return { label: "Sign-in (Auth0)", how: `Free up to ${count(PRICES.auth0FreeMonthlyUsers.value)} people a month.` };
  }
}

/**
 * The estimate with sliders: how big the library is, how busy it gets, for
 * how long, and what the resident's time is worth. Every number comes from
 * `estimate`, so the sliders and the page's tables can't disagree.
 */
export default function CostCalculator() {
  const [scenario, setScenario] = useState<Scenario>(MIDDLE);
  const idBase = useId();
  const sliderId = (key: keyof Scenario) => `${idBase}-${key}`;
  const { lines, total, usage, delivery } = estimate(scenario);

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {SCENARIO_KEYS.map((key) => {
          const { min, max, step } = SLIDERS[key];
          const { label, say } = SLIDER_COPY[key];
          const value = scenario[key];
          return (
            <div key={key} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <label htmlFor={sliderId(key)} className="text-foreground">
                  {label}
                </label>
                <span aria-hidden className="font-mono text-[13px] text-muted">
                  {say(value)}
                </span>
              </div>
              <input
                id={sliderId(key)}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                aria-valuetext={say(value)}
                onChange={(event) => setScenario((current) => ({ ...current, [key]: Number(event.target.value) }))}
                className="paul-touch-min mt-1 w-full cursor-pointer accent-foreground"
              />
            </div>
          );
        })}
      </div>

      <output
        htmlFor={SCENARIO_KEYS.map(sliderId).join(" ")}
        className="mt-6 flex flex-wrap items-baseline gap-x-2 border-t border-border pt-5"
      >
        <span className="text-3xl font-bold tabular-nums text-foreground">{cad(total)}</span>
        <span className="text-[15px] text-muted">for {duration(scenario.months)}</span>
      </output>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <caption className="mb-2 text-left text-[15px] font-semibold text-foreground">What the total is made of</caption>
          <thead>
            <tr className="text-[12px] text-muted">
              <th scope="col" className="py-1.5 pr-3 font-medium">Line</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">Cost</th>
              <th scope="col" className="py-1.5 font-medium">How it&apos;s worked out</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const { label, how } = lineCopy(line.id, scenario, delivery);
              return (
                <tr key={line.id} className="border-t border-border">
                  <th scope="row" className="py-2 pr-3 font-normal text-foreground">{label}</th>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums text-foreground">{cad(line.cad)}</td>
                  <td className="py-2 text-muted">{how}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-1 text-[13px] text-muted">
        <li>
          {count(usage.opensPerMonth)} scan opens a month, {size(usage.scanGbPerMonth)} of data.
        </li>
        <li>
          {count(usage.callsPerMonth)} of Vercel Hobby&apos;s {count(PRICES.vercelHobbyCalls.value)} function calls a month.
        </li>
        <li>{size(usage.recordsGb)} of study records by the end.</li>
      </ul>
    </div>
  );
}
