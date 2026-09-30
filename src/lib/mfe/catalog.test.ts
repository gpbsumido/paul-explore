import { describe, it, expect, vi, afterEach } from "vitest";
import { workPortfolioCounts } from "./catalog";

afterEach(() => vi.unstubAllGlobals());

const REMOTE = {
  name: "workPortfolio",
  manifestUrl: "https://mfe.example/mf-manifest.json",
  origin: "https://mfe.example",
};

const catalog = {
  projects: [
    { id: "a", name: "A", blurb: "", stack: "", accent: { accent: "#111111", surface: "#11111110", font: "sans" }, cutFeatures: [] },
    { id: "b", name: "B", blurb: "", stack: "", accent: { accent: "#222222", surface: "#22222210", font: "mono" }, cutFeatures: [] },
  ],
  features: ["one", "two", "three"].map((slug) => ({
    slug,
    projectId: "a",
    title: slug,
    tagline: "",
    icon: "",
    explainer: { did: "", stack: "", mocked: "" },
  })),
};

const respond = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );

describe("workPortfolioCounts", () => {
  it("counts projects and features from the remote's catalog.json", async () => {
    const fetchMock = respond(200, catalog);
    vi.stubGlobal("fetch", fetchMock);

    expect(await workPortfolioCounts(REMOTE)).toEqual({ projects: 2, features: 3 });
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://mfe.example/catalog.json");
  });

  it("gives up quietly when the remote can't be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await workPortfolioCounts(REMOTE)).toBeNull();
  });

  it("gives up quietly on an error status", async () => {
    vi.stubGlobal("fetch", respond(503, {}));
    expect(await workPortfolioCounts(REMOTE)).toBeNull();
  });

  it("refuses a catalog that doesn't match the contract", async () => {
    vi.stubGlobal("fetch", respond(200, { projects: "nope" }));
    expect(await workPortfolioCounts(REMOTE)).toBeNull();
  });

  it("has nothing to count without a remote", async () => {
    expect(await workPortfolioCounts(null)).toBeNull();
  });
});
