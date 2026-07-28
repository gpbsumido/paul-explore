import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildWallFormData,
  localImageIds,
  listWalls,
  getWall,
  createWall,
  updateWall,
  deleteWall,
} from "./walls-api";
import { initialGalleryState, type GalleryState } from "./state";

const stateWith = (srcs: string[]): GalleryState => ({
  ...initialGalleryState,
  images: srcs.map((src, i) => ({
    id: `img${i}`,
    src,
    aspect: 1,
    frame: { sizeId: "8x10", orientation: "portrait" },
  })),
});

const file = (name: string) => new File(["x"], name, { type: "image/png" });

describe("localImageIds", () => {
  it("picks out images still held locally, ignoring already-saved ones", () => {
    const state = stateWith([
      "blob:one",
      "https://cdn.example/gallery-walls/u/w/images/img1.webp",
      "data:image/png;base64,AAA",
    ]);
    expect(localImageIds(state)).toEqual(["img0", "img2"]);
  });
});

describe("buildWallFormData", () => {
  it("carries the name, the serialized state, and one file per local image", () => {
    const state = stateWith(["blob:one", "https://cdn.example/x.webp"]);
    const form = buildWallFormData({
      name: "Hallway",
      state,
      filesById: { img0: file("a.png") },
    });

    expect(form.get("name")).toBe("Hallway");
    expect(JSON.parse(form.get("state") as string).images).toHaveLength(2);
    expect(form.get("img0")).toBeInstanceOf(File);
    expect(form.get("img1")).toBeNull();
  });

  it("omits the name when renaming is not part of the save", () => {
    const form = buildWallFormData({ state: stateWith([]), filesById: {} });
    expect(form.get("name")).toBeNull();
  });
});

describe("walls api client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const ok = (body: unknown) =>
    Promise.resolve({ ok: true, status: 200, json: async () => body } as Response);

  it("lists walls", async () => {
    fetchMock.mockReturnValue(ok([{ id: "w1", name: "Den", updatedAt: "t" }]));
    await expect(listWalls()).resolves.toEqual([
      { id: "w1", name: "Den", updatedAt: "t" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith("/api/walls", expect.anything());
  });

  it("reads one wall", async () => {
    fetchMock.mockReturnValue(ok({ id: "w1", name: "Den", state: initialGalleryState }));
    const wall = await getWall("w1");
    expect(wall.name).toBe("Den");
    expect(fetchMock).toHaveBeenCalledWith("/api/walls/w1", expect.anything());
  });

  it("creates a wall by posting form data", async () => {
    fetchMock.mockReturnValue(ok({ id: "w9", name: "New", updatedAt: "t" }));
    const summary = await createWall({
      name: "New",
      state: stateWith(["blob:a"]),
      filesById: { img0: file("a.png") },
    });
    expect(summary.id).toBe("w9");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/walls");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("updates a wall with PUT", async () => {
    fetchMock.mockReturnValue(ok({ id: "w1", name: "Renamed", updatedAt: "t" }));
    await updateWall("w1", { name: "Renamed", state: stateWith([]), filesById: {} });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/walls/w1");
    expect(init.method).toBe("PUT");
  });

  it("deletes a wall", async () => {
    fetchMock.mockReturnValue(ok({ message: "gone" }));
    await deleteWall("w1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/walls/w1");
    expect(init.method).toBe("DELETE");
  });

  it("throws with the server's message when a request fails", async () => {
    fetchMock.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: "Wall not found." }),
      } as Response),
    );
    await expect(getWall("ghost")).rejects.toThrow(/Wall not found/);
  });
});
