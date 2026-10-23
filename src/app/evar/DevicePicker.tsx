"use client";

import type { Device, DeviceGroup, DevicePick, SheetId, Side } from "@/lib/evar/devices";
import { SHEETS } from "@/lib/evar/sheets";

const select =
  "mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const describe = (d: Device) => `${d.code} · ${d.proximal} to ${d.distal} mm, ${d.lengthMm} mm long, ${d.fr} Fr`;

/** A labelled native select over part of the catalogue, with an empty first choice. */
function DeviceSelect({
  id,
  label,
  empty,
  groups,
  value,
  onChange,
}: {
  id: string;
  label: string;
  empty: string;
  groups: readonly DeviceGroup[];
  value: string | null;
  onChange: (code: string | null) => void;
}) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="text-[13px] text-muted">
        {label}
      </label>
      <select id={id} className={select} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{empty}</option>
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.devices.map((d) => (
              <option key={d.code} value={d.code}>
                {describe(d)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

/**
 * Picking the stent graft from your measurements: whose device, which side
 * the main body goes up, then the main body, the contralateral limb, and
 * anything extra on the main body's own side. Changing manufacturer clears
 * the picks, since no code belongs to two sheets.
 */
export default function DevicePicker({ pick, onChange }: { pick: DevicePick; onChange: (pick: DevicePick) => void }) {
  const sides: readonly Side[] = ["right", "left"];
  const sheet = SHEETS[pick.sheet];
  const sheetIds = Object.keys(SHEETS) as SheetId[];
  return (
    <section aria-labelledby="evar-devices-heading" className="mt-6">
      <h3 id="evar-devices-heading" className="mb-1 text-[15px] font-bold text-foreground">
        Devices
      </h3>
      <p className="mb-3 text-[13px] text-muted">
        Size a stent graft from your numbers. Lengths are graded along the centerline: each side
        has to seal {sheet.distalSealMm} mm into its common iliac without covering the internal iliac.
      </p>

      <fieldset className="mb-3">
        <legend className="text-[13px] text-muted">Manufacturer</legend>
        <div className="mt-1 flex flex-col gap-1">
          {sheetIds.map((id) => (
            <label key={id} className="flex items-center gap-1.5 text-[14px] text-foreground">
              <input
                type="radio"
                name="evar-sheet"
                value={id}
                checked={pick.sheet === id}
                onChange={() => onChange({ ...pick, sheet: id, mainBody: null, contraLimb: null, ipsiExtension: null })}
              />
              {SHEETS[id].name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-3">
        <legend className="text-[13px] text-muted">Main body goes up the</legend>
        <div className="mt-1 flex gap-4">
          {sides.map((side) => (
            <label key={side} className="flex items-center gap-1.5 text-[14px] text-foreground">
              <input
                type="radio"
                name="evar-ipsilateral"
                value={side}
                checked={pick.ipsilateral === side}
                onChange={() => onChange({ ...pick, ipsilateral: side })}
              />
              {side === "right" ? "Right iliac" : "Left iliac"}
            </label>
          ))}
        </div>
      </fieldset>

      <DeviceSelect
        id="evar-main-body"
        label="Main body"
        empty="Choose a main body"
        groups={sheet.catalogue.mainBodies}
        value={pick.mainBody}
        onChange={(mainBody) => onChange({ ...pick, mainBody })}
      />
      <DeviceSelect
        id="evar-contra-limb"
        label="Contralateral limb"
        empty="Choose a limb"
        groups={sheet.catalogue.contraLimbs}
        value={pick.contraLimb}
        onChange={(contraLimb) => onChange({ ...pick, contraLimb })}
      />
      <DeviceSelect
        id="evar-ipsi-extension"
        label="Ipsilateral extension"
        empty={sheet.noIpsiExtension}
        groups={sheet.catalogue.ipsiExtensions}
        value={pick.ipsiExtension}
        onChange={(ipsiExtension) => onChange({ ...pick, ipsiExtension })}
      />

      <p className="text-[12px] text-muted">
        Sizing from {sheet.source}, for practice only. {sheet.codesNote} Not affiliated with{" "}
        {sheet.maker} and not for clinical use; the instructions for use are the source of truth.
      </p>
    </section>
  );
}
