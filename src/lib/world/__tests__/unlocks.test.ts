import { describe, it, expect } from "vitest";
import {
  GROUND_TOKEN_IDS,
  SKY_TOKEN_IDS,
  isWembyUnlocked,
  reachHeight,
  LOCKED_OUTFIT_ID,
  WEMBY_REACH,
} from "../unlocks";
import { COLLECTIBLES, findCollectible } from "../collectibles";

describe("token groups", () => {
  it("splits the catalog into ground and sky tokens", () => {
    expect(GROUND_TOKEN_IDS.length + SKY_TOKEN_IDS.length).toBe(COLLECTIBLES.length);
    expect(SKY_TOKEN_IDS.length).toBeGreaterThanOrEqual(3);
  });

  it("counts every non-elevated token as ground", () => {
    for (const token of COLLECTIBLES) {
      const inGround = GROUND_TOKEN_IDS.includes(token.id);
      expect(inGround).toBe(!token.elevated);
    }
  });
});

describe("isWembyUnlocked", () => {
  it("stays locked at the start", () => {
    expect(isWembyUnlocked([])).toBe(false);
  });

  it("stays locked while a single ground token is missing", () => {
    expect(isWembyUnlocked(GROUND_TOKEN_IDS.slice(0, -1))).toBe(false);
  });

  it("unlocks on the last ground token — no jumping required", () => {
    expect(isWembyUnlocked(GROUND_TOKEN_IDS)).toBe(true);
  });

  it("does not need the sky tokens, which is the whole point", () => {
    expect(isWembyUnlocked([...GROUND_TOKEN_IDS])).toBe(true);
    expect(SKY_TOKEN_IDS.every((id) => !GROUND_TOKEN_IDS.includes(id))).toBe(true);
  });

  it("ignores unknown ids", () => {
    expect(isWembyUnlocked([...GROUND_TOKEN_IDS, "not-a-token"])).toBe(true);
  });
});

describe("reachHeight", () => {
  it("gives everyone else an ordinary reach", () => {
    expect(reachHeight("blue-jays")).toBe(0);
    expect(reachHeight("raptors")).toBe(0);
  });

  it("lets the tall guy pluck things out of the air", () => {
    expect(reachHeight(LOCKED_OUTFIT_ID)).toBe(WEMBY_REACH);
  });

  it("reaches high enough for the sky tokens standing flat-footed", () => {
    const sky = COLLECTIBLES.find((c) => c.elevated)!;
    const standing = { x: sky.x, z: sky.z };
    expect(findCollectible(standing, 0, [], reachHeight("blue-jays"))).toBeNull();
    expect(findCollectible(standing, 0, [], reachHeight(LOCKED_OUTFIT_ID))).toBe(sky);
  });
});
