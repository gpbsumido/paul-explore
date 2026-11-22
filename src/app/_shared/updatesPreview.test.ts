import { describe, it, expect } from "vitest";
import { UPDATE_ENTRIES } from "@/lib/updates/entries.data";
import { UPDATES_PREVIEW } from "./featureData";

/**
 * The hub card echoes /updates, but it's typed out by hand: reading the 75 KB
 * entries file from a client module would ship the whole changelog with the
 * hub. This keeps the copy honest instead. When a new entry lands, the card
 * has to move with it.
 */
describe("the hub's updates preview", () => {
  it("shows the three newest public updates, with their category colour and minor version", () => {
    const newest = UPDATE_ENTRIES.slice(0, 3).map((entry) => ({
      title: entry.title,
      tone: `var(--color-update-${entry.category})`,
      version: entry.version.split(".").slice(0, 2).join("."),
    }));
    expect(UPDATES_PREVIEW).toEqual(newest);
  });
});
