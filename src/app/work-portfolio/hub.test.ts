import { describe, it, expect } from "vitest";
import { FEATURES as HUB_FEATURES } from "@/app/_shared/featureData";

describe("work-portfolio hub registration", () => {
  it("appears in the hub feature list pointing at /work-portfolio", () => {
    const entry = HUB_FEATURES.find((f) => f.id === "work-portfolio");
    expect(entry).toBeDefined();
    expect(entry?.href).toBe("/work-portfolio");
    expect(entry?.title).toBe("Work Portfolio");
  });
});
