import { describe, it, expect, vi, afterEach } from "vitest";
import { isFeatureEnabled, loadPocketGate, POCKET_TCG_FLAG } from "./flags-gate";
import { loadFleet } from "./flags-bff";
import { getFlag } from "./flags-data";
import {
  buildFlag,
  buildEnvironmentConfig,
  percentRollout,
} from "@/test/factories/flags";

vi.mock("./flags-bff", () => ({ loadFleet: vi.fn() }));
vi.mock("./flags-data", async () => {
  const actual = await vi.importActual<typeof import("./flags-data")>("./flags-data");
  return { ...actual, getFlag: vi.fn(actual.getFlag) };
});

afterEach(() => vi.clearAllMocks());

const offEverywhere = () =>
  buildFlag({
    key: POCKET_TCG_FLAG,
    environments: {
      development: buildEnvironmentConfig({ enabled: false }),
      staging: buildEnvironmentConfig({ enabled: false }),
      production: buildEnvironmentConfig({ enabled: false }),
    },
  });

const onEverywhere = () =>
  buildFlag({
    key: POCKET_TCG_FLAG,
    environments: {
      development: buildEnvironmentConfig({ fallthrough: percentRollout(100) }),
      staging: buildEnvironmentConfig({ fallthrough: percentRollout(100) }),
      production: buildEnvironmentConfig({ fallthrough: percentRollout(100) }),
    },
  });

describe("isFeatureEnabled", () => {
  it("is on when the flag serves the on variation to everyone", () => {
    expect(isFeatureEnabled(onEverywhere(), "production", "visitor-1")).toBe(
      true,
    );
  });

  it("is off when the kill switch is off, regardless of visitor", () => {
    const killed = buildFlag({
      environments: {
        development: buildEnvironmentConfig({ enabled: false }),
        staging: buildEnvironmentConfig({ enabled: false }),
        production: buildEnvironmentConfig({ enabled: false }),
      },
    });
    expect(isFeatureEnabled(killed, "production", "visitor-1")).toBe(false);
  });

  it("splits visitors under a partial rollout rather than serving everyone the same answer", () => {
    const half = buildFlag({
      environments: {
        development: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
        staging: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
        production: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
      },
    });
    const enabledCount = Array.from({ length: 400 }, (_, i) =>
      isFeatureEnabled(half, "production", `visitor-${i}`),
    ).filter(Boolean).length;

    expect(enabledCount).toBeGreaterThan(140);
    expect(enabledCount).toBeLessThan(260);
  });

  it("reads the environment it is asked about, not production", () => {
    const stagingOnly = buildFlag({
      environments: {
        development: buildEnvironmentConfig({ enabled: false }),
        staging: buildEnvironmentConfig({ fallthrough: percentRollout(100) }),
        production: buildEnvironmentConfig({ enabled: false }),
      },
    });
    expect(isFeatureEnabled(stagingOnly, "staging", "visitor-1")).toBe(true);
    expect(isFeatureEnabled(stagingOnly, "production", "visitor-1")).toBe(false);
  });

  it("is sticky per visitor under a partial rollout", () => {
    const half = buildFlag({
      environments: {
        development: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
        staging: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
        production: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
      },
    });
    const first = isFeatureEnabled(half, "production", "visitor-42");
    const again = isFeatureEnabled(half, "production", "visitor-42");
    expect(again).toBe(first);
  });

  it("fails open when the flag is missing so a config gap never hides the feature", () => {
    expect(isFeatureEnabled(undefined, "production", "visitor-1")).toBe(true);
  });
});

describe("loadPocketGate", () => {
  it("enables the page when the live fleet serves the flag on", async () => {
    vi.mocked(loadFleet).mockResolvedValue({
      flags: [onEverywhere()],
      environments: ["development", "staging", "production"],
      source: "api",
    });

    expect(await loadPocketGate("visitor-1")).toEqual({ enabled: true, source: "api" });
  });

  it("honours a kill switch flipped in the live fleet over the seeded flag", async () => {
    vi.mocked(loadFleet).mockResolvedValue({
      flags: [offEverywhere()],
      environments: ["development", "staging", "production"],
      source: "api",
    });

    expect(await loadPocketGate("visitor-1")).toEqual({ enabled: false, source: "api" });
  });

  it("reports the seed as the source when the fleet itself fell back to it", async () => {
    vi.mocked(loadFleet).mockResolvedValue({
      flags: [onEverywhere()],
      environments: ["development", "staging", "production"],
      source: "seed",
    });

    expect((await loadPocketGate("visitor-1")).source).toBe("seed");
  });

  it("reads the flag from the local seed when the fleet does not carry it", async () => {
    vi.mocked(loadFleet).mockResolvedValue({
      flags: [buildFlag({ key: "something-else" })],
      environments: ["development", "staging", "production"],
      source: "api",
    });

    const decision = await loadPocketGate("visitor-1");

    expect(getFlag).toHaveBeenCalledWith(POCKET_TCG_FLAG);
    expect(decision).toEqual({ enabled: true, source: "seed" });
  });

  it("fails open with a default source when the flag exists nowhere", async () => {
    vi.mocked(loadFleet).mockResolvedValue({
      flags: [],
      environments: ["development", "staging", "production"],
      source: "api",
    });
    vi.mocked(getFlag).mockReturnValueOnce(undefined);

    expect(await loadPocketGate("visitor-1")).toEqual({ enabled: true, source: "default" });
  });

  it("evaluates against the environment it is given, and production when none is", async () => {
    vi.mocked(loadFleet).mockResolvedValue({
      flags: [
        buildFlag({
          key: POCKET_TCG_FLAG,
          environments: {
            development: buildEnvironmentConfig({ fallthrough: percentRollout(100) }),
            staging: buildEnvironmentConfig({ fallthrough: percentRollout(100) }),
            production: buildEnvironmentConfig({ enabled: false }),
          },
        }),
      ],
      environments: ["development", "staging", "production"],
      source: "api",
    });

    expect((await loadPocketGate("visitor-1", "development")).enabled).toBe(true);
    expect((await loadPocketGate("visitor-1")).enabled).toBe(false);
  });
});
