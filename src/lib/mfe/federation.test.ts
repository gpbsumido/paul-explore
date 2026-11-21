import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RemoteConfig } from "./remotes";

const registerRemotes = vi.fn();
const loadRemote = vi.fn();
const createInstance = vi.fn((_options: unknown) => ({ registerRemotes, loadRemote }));

vi.mock("@module-federation/runtime", () => ({
  createInstance: (options: unknown) => createInstance(options),
}));

const REMOTE: RemoteConfig = {
  name: "workPortfolio",
  manifestUrl: "https://mfe.example/mf-manifest.json",
  origin: "https://mfe.example",
};

/** The module is a per-page singleton, so every test gets a fresh copy of it. */
async function freshLoadRemoteModule() {
  vi.resetModules();
  return (await import("./federation")).loadRemoteModule;
}

beforeEach(() => {
  registerRemotes.mockReset();
  loadRemote.mockReset();
  createInstance.mockClear();
});

describe("loadRemoteModule", () => {
  it("registers the remote's manifest and loads its ./mount module", async () => {
    const mountModule = { mount: vi.fn() };
    loadRemote.mockResolvedValue(mountModule);
    const loadRemoteModule = await freshLoadRemoteModule();

    const loaded = await loadRemoteModule(REMOTE);

    expect(registerRemotes).toHaveBeenCalledWith([
      { name: "workPortfolio", entry: REMOTE.manifestUrl },
    ]);
    expect(loadRemote).toHaveBeenCalledWith("workPortfolio/mount");
    expect(loaded).toBe(mountModule);
  });

  it("answers undefined when the runtime finds nothing to load", async () => {
    loadRemote.mockResolvedValue(null);
    const loadRemoteModule = await freshLoadRemoteModule();

    expect(await loadRemoteModule(REMOTE)).toBeUndefined();
  });

  it("lets a failed load reach the caller", async () => {
    loadRemote.mockRejectedValue(new Error("manifest 404"));
    const loadRemoteModule = await freshLoadRemoteModule();

    await expect(loadRemoteModule(REMOTE)).rejects.toThrow("manifest 404");
  });

  it("builds one federation runtime per page, however many remotes are loaded", async () => {
    loadRemote.mockResolvedValue({});
    const loadRemoteModule = await freshLoadRemoteModule();

    await loadRemoteModule(REMOTE);
    await loadRemoteModule({ ...REMOTE, name: "other" });

    expect(createInstance).toHaveBeenCalledTimes(1);
  });

  it("lends this site's React to remotes as singletons", async () => {
    loadRemote.mockResolvedValue({});
    const loadRemoteModule = await freshLoadRemoteModule();

    await loadRemoteModule(REMOTE);

    const [options] = createInstance.mock.calls[0] as unknown as [
      { shared: Record<string, { shareConfig: { singleton: boolean } }> },
    ];
    expect(Object.keys(options.shared).sort()).toEqual(["react", "react-dom", "react-dom/client"]);
    for (const lent of Object.values(options.shared)) {
      expect(lent.shareConfig.singleton).toBe(true);
    }
  });
});
