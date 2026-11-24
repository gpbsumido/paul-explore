import { describe, it, expect, vi, afterEach } from "vitest";
import {
  COMMAND_PALETTE_OPEN_EVENT,
  openCommandPalette,
} from "../open-event";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("openCommandPalette", () => {
  it("dispatches the open event so a globally mounted palette can react", () => {
    const listener = vi.fn();
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, listener);

    openCommandPalette();
    window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, listener);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does nothing on the server, where there is no window to dispatch on", () => {
    vi.stubGlobal("window", undefined);

    expect(() => openCommandPalette()).not.toThrow();
  });
});
