import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useShortcutKey } from "../useShortcutKey";

function setPlatform(platform: string) {
  Object.defineProperty(window.navigator, "platform", {
    value: platform,
    configurable: true,
  });
}

afterEach(() => {
  setPlatform("");
});

describe("useShortcutKey", () => {
  it("resolves to the Command symbol on Apple platforms", () => {
    setPlatform("MacIntel");
    const { result } = renderHook(() => useShortcutKey());
    expect(result.current).toBe("⌘");
  });

  it("resolves to Ctrl on non-Apple platforms", () => {
    setPlatform("Win32");
    const { result } = renderHook(() => useShortcutKey());
    expect(result.current).toBe("Ctrl");
  });
});
