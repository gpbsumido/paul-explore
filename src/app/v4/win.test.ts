import { describe, it, expect } from "vitest";
import { isWinningPull } from "./win";
import type { SlotCategory, SlotOption } from "./slotData";

const apps = { id: "apps", label: "Apps" } as SlotCategory;
const other = { id: "design-ui", label: "Design & UI" } as SlotCategory;
const openable = { id: "feat:craft", label: "Craft" } as SlotOption;
const disabled = { id: "feat:x", label: "X", disabled: true } as SlotOption;

describe("isWinningPull", () => {
  it("celebrates landing on an openable app", () => {
    expect(
      isWinningPull({ category: apps, option: openable, reduced: false }),
    ).toBe(true);
  });

  it("does not celebrate a column that is not an app", () => {
    expect(
      isWinningPull({ category: other, option: openable, reduced: false }),
    ).toBe(false);
  });

  it("does not celebrate an app row you cannot open", () => {
    expect(
      isWinningPull({ category: apps, option: disabled, reduced: false }),
    ).toBe(false);
    expect(
      isWinningPull({ category: apps, option: undefined, reduced: false }),
    ).toBe(false);
  });

  it("never celebrates under reduced motion, however good the pull", () => {
    expect(
      isWinningPull({ category: apps, option: openable, reduced: true }),
    ).toBe(false);
  });

  it("handles an unresolved category without throwing", () => {
    expect(
      isWinningPull({ category: undefined, option: openable, reduced: false }),
    ).toBe(false);
  });
});
