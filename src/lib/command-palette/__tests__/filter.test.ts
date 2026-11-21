import { describe, it, expect } from "vitest";
import { rankCommands, groupRankedCommands } from "../filter";
import type { Command } from "../types";

function command(overrides: Partial<Command>): Command {
  return {
    id: "id",
    title: "Title",
    group: "Pages",
    keywords: [],
    ...overrides,
  };
}

const calendar = command({ id: "calendar", title: "Calendar", group: "Pages" });
const operator = command({ id: "operator", title: "Operator", group: "Pages" });
const theme = command({
  id: "toggle-theme",
  title: "Toggle theme",
  group: "Actions",
  keywords: ["dark", "light", "appearance"],
});

describe("rankCommands", () => {
  it("returns every command in registry order for an empty query", () => {
    const ranked = rankCommands([calendar, operator, theme], "");
    expect(ranked.map((r) => r.command.id)).toEqual([
      "calendar",
      "operator",
      "toggle-theme",
    ]);
    expect(ranked.every((r) => r.score === 0)).toBe(true);
  });

  it("drops commands whose title and keywords both miss", () => {
    const ranked = rankCommands([calendar, operator], "zzz");
    expect(ranked).toEqual([]);
  });

  it("ranks a title match above a keyword-only match", () => {
    // "dark" matches the theme command only via its keyword; give a command a
    // title that also fuzzy-contains the letters to compete.
    const darkroom = command({ id: "darkroom", title: "Darkroom" });
    const ranked = rankCommands([theme, darkroom], "dark");
    expect(ranked[0].command.id).toBe("darkroom");
  });

  it("matches on keywords when the title does not", () => {
    const ranked = rankCommands([theme], "appearance");
    expect(ranked).toHaveLength(1);
    expect(ranked[0].command.id).toBe("toggle-theme");
  });

  it("carries highlight ranges from the title match", () => {
    const ranked = rankCommands([calendar], "cal");
    expect(ranked[0].ranges).toEqual([{ start: 0, end: 3 }]);
  });

  it("leaves ranges empty for a keyword-only match", () => {
    const ranked = rankCommands([theme], "appearance");
    expect(ranked[0].ranges).toEqual([]);
  });

  it("orders title matches best score first", () => {
    const scattered = command({ id: "scattered", title: "Xcxaxl" });
    const prefix = command({ id: "prefix", title: "Calendar" });
    const ranked = rankCommands([scattered, prefix], "cal");
    expect(ranked.map((r) => r.command.id)).toEqual(["prefix", "scattered"]);
  });

  it("scores a keyword match at half of what the same text would score as a title", () => {
    const asTitle = rankCommands([command({ title: "appearance" })], "appearance")[0];
    const asKeyword = rankCommands([theme], "appearance")[0];
    expect(asKeyword.score).toBe(asTitle.score * 0.5);
  });

  it("keeps input order for commands that tie on score", () => {
    const a = command({ id: "a", title: "Match" });
    const b = command({ id: "b", title: "Match" });
    const ranked = rankCommands([a, b], "match");
    expect(ranked.map((r) => r.command.id)).toEqual(["a", "b"]);
  });
});

describe("groupRankedCommands", () => {
  it("buckets commands into their groups preserving rank order", () => {
    const ranked = rankCommands([calendar, theme, operator], "");
    const grouped = groupRankedCommands(ranked);
    expect(grouped.map((g) => g.group)).toEqual(["Pages", "Actions"]);
    expect(grouped[0].commands.map((c) => c.command.id)).toEqual([
      "calendar",
      "operator",
    ]);
    expect(grouped[1].commands.map((c) => c.command.id)).toEqual([
      "toggle-theme",
    ]);
  });

  it("lists Dev Notes after Actions and Pages, however the commands arrive", () => {
    const note = command({ id: "note", title: "Note", group: "Dev Notes" });
    const grouped = groupRankedCommands(rankCommands([note, theme, calendar], ""));
    expect(grouped.map((g) => g.group)).toEqual(["Pages", "Actions", "Dev Notes"]);
  });

  it("keeps the better match first inside each group", () => {
    const weak = command({ id: "weak", title: "Xcxaxl" });
    const strong = command({ id: "strong", title: "Calendar" });
    const grouped = groupRankedCommands(rankCommands([weak, strong], "cal"));
    expect(grouped[0].commands.map((c) => c.command.id)).toEqual(["strong", "weak"]);
  });

  it("drops groups with no matching commands", () => {
    const ranked = rankCommands([calendar, operator], "");
    const grouped = groupRankedCommands(ranked);
    expect(grouped.map((g) => g.group)).toEqual(["Pages"]);
  });
});
