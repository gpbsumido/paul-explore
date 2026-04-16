import { describe, it, expect } from "vitest";
import { buildCascadeClears } from "../PlayoffBracketContent";
import type { PlayoffBracketPicks } from "@/types/nba";

const series = (winner: string) => ({ winner, seriesScore: "4-2" });

describe("buildCascadeClears", () => {
  it("clears a direct downstream pick when its winner was the removed team", () => {
    const picks: PlayoffBracketPicks = {
      E_R1_M1: series("CLE"),
      E_R2_M1: series("CLE"),
    };

    const clears = buildCascadeClears("E_R1_M1", "CLE", picks);

    expect(clears["E_R2_M1"]).toEqual({ winner: "", seriesScore: "4-2" });
  });

  it("does not clear a downstream pick whose winner is a different team", () => {
    const picks: PlayoffBracketPicks = {
      E_R1_M1: series("CLE"),
      E_R2_M1: series("BOS"), // BOS came from the other R1 matchup
    };

    const clears = buildCascadeClears("E_R1_M1", "CLE", picks);

    expect(clears["E_R2_M1"]).toBeUndefined();
  });

  it("cascades clears through multiple rounds", () => {
    const picks: PlayoffBracketPicks = {
      E_R1_M1: series("CLE"),
      E_R2_M1: series("CLE"),
      E_CF: series("CLE"),
      NBA_FINALS: {
        winner: "CLE",
        seriesScore: "4-2",
        lastGameCombinedScore: 210,
        mvp: "SGA",
      },
    };

    const clears = buildCascadeClears("E_R1_M1", "CLE", picks);

    expect(clears["E_R2_M1"]?.winner).toBe("");
    expect(clears["E_CF"]?.winner).toBe("");
    expect(clears["NBA_FINALS"]?.winner).toBe("");
  });

  it("stops cascading when a round has a different team as winner", () => {
    const picks: PlayoffBracketPicks = {
      E_R1_M1: series("CLE"),
      E_R2_M1: series("CLE"),
      E_CF: series("BOS"), // BOS won the ECF, not CLE
    };

    const clears = buildCascadeClears("E_R1_M1", "CLE", picks);

    expect(clears["E_R2_M1"]?.winner).toBe("");
    expect(clears["E_CF"]).toBeUndefined();
  });

  it("preserves non-winner fields on cleared picks", () => {
    const picks: PlayoffBracketPicks = {
      E_R2_M1: { winner: "CLE", seriesScore: "4-3" },
    };

    const clears = buildCascadeClears("E_R1_M1", "CLE", picks);

    expect(clears["E_R2_M1"]).toEqual({ winner: "", seriesScore: "4-3" });
  });

  it("returns an empty object when no downstream picks used the removed winner", () => {
    const picks: PlayoffBracketPicks = {
      E_R1_M1: series("CLE"),
    };

    const clears = buildCascadeClears("E_R1_M1", "CLE", picks);

    expect(Object.keys(clears)).toHaveLength(0);
  });

  it("handles West conference cascade independently of East", () => {
    const picks: PlayoffBracketPicks = {
      W_R1_M1: series("OKC"),
      W_R2_M1: series("OKC"),
      W_CF: series("OKC"),
      NBA_FINALS: {
        winner: "OKC",
        seriesScore: "4-1",
        lastGameCombinedScore: null,
        mvp: "",
      },
      // East picks untouched
      E_R1_M1: series("CLE"),
      E_R2_M1: series("CLE"),
    };

    const clears = buildCascadeClears("W_R1_M1", "OKC", picks);

    expect(clears["W_R2_M1"]?.winner).toBe("");
    expect(clears["W_CF"]?.winner).toBe("");
    expect(clears["NBA_FINALS"]?.winner).toBe("");
    expect(clears["E_R2_M1"]).toBeUndefined();
  });
});
