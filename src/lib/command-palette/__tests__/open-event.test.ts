import { describe, it, expect, vi, afterEach } from "vitest";
import {
  COMMAND_PALETTE_OPEN_EVENT,
  openCommandPalette,
} from "../open-event";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("openCommandPalette", () => {
  it("dispatches the open event so a globally mounted palette can react", () => {
    const listener = vi.fn();
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, listener);

    openCommandPalette();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, listener);
  });
});
