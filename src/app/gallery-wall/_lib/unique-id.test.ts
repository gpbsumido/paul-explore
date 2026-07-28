import { describe, it, expect } from "vitest";
import { uniqueImageId } from "./state";

describe("uniqueImageId", () => {
  it("keeps the id when nothing has claimed it", () => {
    expect(uniqueImageId("photo.png-10-99", new Set())).toBe("photo.png-10-99");
  });

  it("suffixes a duplicate so re-adding the same photo does not collide", () => {
    const taken = new Set(["photo.png-10-99"]);
    expect(uniqueImageId("photo.png-10-99", taken)).toBe("photo.png-10-99_2");
  });

  it("keeps counting past an existing suffix", () => {
    const taken = new Set(["a", "a_2", "a_3"]);
    expect(uniqueImageId("a", taken)).toBe("a_4");
  });
});
