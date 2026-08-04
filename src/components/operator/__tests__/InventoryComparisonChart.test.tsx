import { describe, it, expect } from "vitest";
import { axisLabel } from "../InventoryComparisonChart";

describe("axisLabel", () => {
  it("drops the location suffix, which is what made names overflow", () => {
    // "Break Room Cooler - Floor 3" was wider than the axis, so the chart drew
    // it past its own left edge and the first characters were clipped off.
    expect(axisLabel("Break Room Cooler - Floor 3")).toBe("Break Room Cooler");
    expect(axisLabel("Gym Vending - Rec Center")).toBe("Gym Vending");
  });

  it("truncates a name that is still too long on its own", () => {
    expect(axisLabel("Parking Garage Kiosk - Level P2")).toBe(
      "Parking Garage K…",
    );
  });

  it("never returns more characters than the axis can hold", () => {
    const names = [
      "Break Room Cooler - Floor 3",
      "Cafeteria Unit - Building B",
      "Parking Garage Kiosk - Level P2",
      "Reception Snacks - Main Lobby",
    ];
    for (const n of names) {
      expect(axisLabel(n).length).toBeLessThanOrEqual(17);
    }
  });

  it("leaves a name with no suffix alone", () => {
    expect(axisLabel("Lobby Fridge")).toBe("Lobby Fridge");
  });
});
