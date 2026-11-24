import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "@/lib/clipboard";

afterEach(() => vi.unstubAllGlobals());

const stubClipboard = (clipboard: unknown) =>
  vi.stubGlobal("navigator", { ...navigator, clipboard });

/**
 * The clipboard can refuse: no permission, an insecure origin, or a browser
 * without the API at all. Every copy button said "Copied" regardless, so the
 * one result that needed saying was the one nobody saw.
 */
describe("copyText", () => {
  it("resolves true once the text is on the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    await expect(copyText("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("resolves false when the browser refuses the write", async () => {
    stubClipboard({ writeText: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")) });
    await expect(copyText("hello")).resolves.toBe(false);
  });

  it("resolves false when there is no clipboard API", async () => {
    stubClipboard(undefined);
    await expect(copyText("hello")).resolves.toBe(false);
  });
});
