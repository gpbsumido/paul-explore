"use client";

import type { ReactNode } from "react";
import { BASE_FEE_CAD, BIGGEST, FEE_SHARE, MEASURED, MIDDLE, SMALLEST, STEPS, estimate, type Scenario } from "@/lib/evar/costs";
import { useCountResident } from "./ResidentTime";
import { cad, cadRounded, count, duration, hours, size } from "./format";

const th = "py-1.5 pr-3 font-medium";
const td = "py-2 pr-3 align-top";
const money = `${td} text-right font-mono tabular-nums text-foreground`;
const muted = "mt-3 max-w-prose text-[14px] leading-relaxed text-muted";

const sizes = [
  { name: "Smallest", scenario: SMALLEST },
  { name: "Middle", scenario: MIDDLE },
  { name: "Biggest", scenario: BIGGEST },
];
const caseLabel = (s: Scenario) =>
  `${count(s.scans)} scans, ${count(s.peoplePerDay)} people a day doing ${count(s.scansEachPerDay)} each`;
const residentFor = (s: Scenario) => estimate(s).lines.find((l) => l.id === "resident")?.cad ?? 0;

/** A captioned table that scrolls on its own when it's wider than the page. */
function Table({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-[14px]">
        <caption className="mb-2 text-left text-[15px] font-semibold text-foreground">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

/** Smallest, middle and biggest at each length of time, with the resident's time if the switch says so. */
export function RangeTable() {
  const countResident = useCountResident();
  return (
    <>
      <Table caption="The range, from the smallest case to the biggest">
        <thead>
          <tr className="text-[12px] text-muted">
            <th scope="col" className={th}>How long</th>
            {sizes.map(({ name, scenario }) => (
              <th key={name} scope="col" className={`${th} text-right`}>
                {name}
                <span className="block font-normal">{caseLabel(scenario)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STEPS.months.map((months) => (
            <tr key={months} className="border-t border-border">
              <th scope="row" className={`${td} font-normal text-foreground`}>{duration(months)}</th>
              {sizes.map(({ name, scenario }) => (
                <td key={name} className={money}>{cad(estimate({ ...scenario, months }, { countResident }).total)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      <p className={muted}>
        Every total includes my {cadRounded(BASE_FEE_CAD)} base fee, charged once, and my{" "}
        {Math.round(FEE_SHARE * 100)}% upkeep fee on running the site.{" "}
        {countResident
          ? `Every case counts the resident at ${cadRounded(MIDDLE.residentPerHour)} an hour and ${MIDDLE.minutesPerScan} minutes a scan. Without that, the biggest case is ${cad(estimate({ ...BIGGEST, months: 24 }, { countResident: false }).total)} for two years.`
          : `Counting a resident's time, at ${cadRounded(MIDDLE.residentPerHour)} an hour and ${MIDDLE.minutesPerScan} minutes a scan, would add ${cadRounded(residentFor(SMALLEST))} to the smallest case and ${cadRounded(residentFor(BIGGEST))} to the biggest.`}
      </p>
    </>
  );
}

/** Storage by the size of the library, and the resident's time to measure it when that's counted. */
export function LibraryTable() {
  const countResident = useCountResident();
  return (
    <Table caption={countResident ? "The library: storage and a resident's time, by number of scans" : "The library: storage by number of scans"}>
      <thead>
        <tr className="text-[12px] text-muted">
          <th scope="col" className={th}>Scans</th>
          <th scope="col" className={th}>Space</th>
          <th scope="col" className={`${th} text-right`}>Storage for a year</th>
          {countResident ? (
            <>
              <th scope="col" className={th}>Resident&apos;s time</th>
              <th scope="col" className={`${th} text-right`}>Resident&apos;s cost, once</th>
            </>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {STEPS.scans.map((scans) => (
          <tr key={scans} className="border-t border-border">
            <th scope="row" className={`${td} font-normal text-foreground`}>{count(scans)}</th>
            <td className={`${td} text-muted`}>{size((scans * MEASURED.scanMb) / 1000)}</td>
            <td className={money}>{cad(estimate({ ...MIDDLE, scans, months: 12 }).lines.find((l) => l.id === "storage")?.cad ?? 0)}</td>
            {countResident ? (
              <>
                <td className={`${td} text-muted`}>{hours((scans * MIDDLE.minutesPerScan) / 60)}</td>
                <td className={money}>{cad(residentFor({ ...MIDDLE, scans }))}</td>
              </>
            ) : null}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
