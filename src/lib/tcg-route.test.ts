import { describe, it, expect } from "vitest";
import { serveTcg, TCG_CACHE_CONTROL } from "./tcg-route";

describe("serveTcg", () => {
  it("forwards the produced value with the shared cache header", async () => {
    const res = await serveTcg("Failed to fetch sets", async () => [
      { id: "base1" },
    ]);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(TCG_CACHE_CONTROL);
    expect(await res.json()).toEqual([{ id: "base1" }]);
  });

  it("strips the SDK's circular refs before serializing", async () => {
    const res = await serveTcg("x", async () => ({ id: "a", sdk: { huge: 1 } }));
    expect(await res.json()).toEqual({ id: "a" });
  });

  it("maps a thrown error to a 502 with the label", async () => {
    const res = await serveTcg("Failed to fetch sets", async () => {
      throw new Error("sdk down");
    });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Failed to fetch sets" });
  });

  it("maps a null result to a 502 with the label", async () => {
    const res = await serveTcg("Failed to fetch series", async () => null);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Failed to fetch series" });
  });
});
