// ---------------------------------------------------------------------------
// Store detail page helpers: tab routing + connection quality
// ---------------------------------------------------------------------------

export type TabId = "inventory" | "alerts" | "activity" | "planogram";

export type ConnectionQuality = "strong" | "weak" | "offline";

export const TABS: readonly { id: TabId; label: string }[] = [
  { id: "inventory", label: "Inventory" },
  { id: "alerts", label: "Alerts" },
  { id: "activity", label: "Activity" },
  { id: "planogram", label: "Planogram" },
] as const;

const VALID_TAB_IDS = new Set<string>(TABS.map((t) => t.id));

const WEAK_THRESHOLD_MS = 2 * 60 * 1000;
const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Resolves a URL search param value into a valid tab ID.
 * Falls back to "inventory" when the param is null, empty, or unrecognized.
 */
export function parseTab(param: string | null): TabId {
  if (param && VALID_TAB_IDS.has(param)) {
    return param as TabId;
  }
  return "inventory";
}

/**
 * Derives sensor connection quality from the lastPing ISO timestamp.
 * Strong = within 2 minutes, Weak = 2-5 minutes, Offline = over 5 minutes.
 */
export function getConnectionQuality(lastPing: string): ConnectionQuality {
  const elapsed = Date.now() - new Date(lastPing).getTime();

  if (elapsed < WEAK_THRESHOLD_MS) return "strong";
  if (elapsed < OFFLINE_THRESHOLD_MS) return "weak";
  return "offline";
}
