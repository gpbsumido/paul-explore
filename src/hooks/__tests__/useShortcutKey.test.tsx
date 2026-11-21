import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useShortcutKey } from "../useShortcutKey";

function setPlatform(platform: string) {
  Object.defineProperty(window.navigator, "platform", {
    value: platform,
    configurable: true,
  });
}

function setUserAgentData(platform: string | undefined) {
  Object.defineProperty(window.navigator, "userAgentData", {
    value: platform === undefined ? undefined : { platform },
    configurable: true,
  });
}

afterEach(() => {
  setPlatform("");
  setUserAgentData(undefined);
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

  it.each(["iPhone", "iPad", "iPod"])("resolves to the Command symbol on an %s", (device) => {
    setPlatform(device);
    const { result } = renderHook(() => useShortcutKey());
    expect(result.current).toBe("⌘");
  });

  it("prefers the platform the browser reports through userAgentData", () => {
    setPlatform("Win32");
    setUserAgentData("macOS");
    const { result } = renderHook(() => useShortcutKey());
    expect(result.current).toBe("⌘");
  });

  it("draws nothing on the server render, so hydration can't mismatch", () => {
    setPlatform("MacIntel");
    function Hint() {
      return <span>{useShortcutKey() ?? "no hint yet"}</span>;
    }
    expect(renderToString(<Hint />)).toContain("no hint yet");
  });
});
