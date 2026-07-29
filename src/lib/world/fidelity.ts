// First-visit fidelity, sized to the visitor's hardware instead of a blind
// 0.6. The slider still overrules this — it only applies when nothing is
// stored yet.

type DeviceProfile = {
  // navigator.hardwareConcurrency; undefined where unsupported.
  readonly cores?: number;
  // navigator.deviceMemory in GB; Chromium-only.
  readonly memory?: number;
  readonly coarsePointer: boolean;
};

/** Maps what the browser will admit about the device to a slider default. */
export function defaultFidelity({ cores, memory, coarsePointer }: DeviceProfile): number {
  if (coarsePointer) return 0.35;
  if ((cores ?? 0) >= 12 || (memory ?? 0) >= 12) return 0.85;
  if ((cores ?? 0) >= 8) return 0.7;
  if ((cores ?? 0) >= 4) return 0.5;
  return 0.4;
}
