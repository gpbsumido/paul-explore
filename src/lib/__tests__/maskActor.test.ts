import { describe, it, expect } from "vitest";
import { maskActor } from "@/lib/maskActor";

describe("maskActor", () => {
  it("does not reproduce the address", () => {
    const masked = maskActor("psumido@gmail.com");

    expect(masked).not.toContain("psumido");
    expect(masked).not.toContain("gmail.com");
  });

  it("keeps enough to tell two actors apart", () => {
    expect(maskActor("alice@example.com")).not.toBe(maskActor("bob@example.com"));
  });

  it("is stable for the same actor", () => {
    expect(maskActor("alice@example.com")).toBe(maskActor("alice@example.com"));
  });

  it("normalises case and padding, since the same person may appear either way", () => {
    expect(maskActor(" Alice@Example.com ")).toBe(maskActor("alice@example.com"));
  });

  it("passes through a non-address actor unchanged", () => {
    expect(maskActor("system")).toBe("system");
  });

  it("handles a missing actor", () => {
    expect(maskActor(null)).toBeNull();
    expect(maskActor(undefined)).toBeNull();
  });
});
