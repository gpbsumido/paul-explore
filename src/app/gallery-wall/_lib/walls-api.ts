/**
 * Client for the saved-walls API. The BFF routes under `/api/walls` attach the
 * Auth0 token and forward to the portfolio API, which stores each wall in S3.
 *
 * Photos live in the browser as blob/data URLs until a wall is saved. On save we
 * send one multipart file per still-local image, keyed by its image id, and the
 * server swaps those srcs for CDN URLs. Images that already carry a remote src
 * (from an earlier save) are left alone, so re-saving never re-uploads them.
 */

import { serializeGallery, type GalleryState } from "./state";

/** A saved wall as it appears in the list. */
export type WallSummary = {
  id: string;
  name: string;
  updatedAt: string;
};

/** A saved wall with its full arrangement. */
export type WallManifest = WallSummary & {
  state: GalleryState;
  createdAt: string;
};

/** Files to upload with a save, keyed by the image id they belong to. */
export type FilesById = Record<string, File>;

type SaveInput = {
  name?: string;
  state: GalleryState;
  filesById: FilesById;
};

/** True when an image is still only in the browser and needs uploading. */
const isLocal = (src: string): boolean =>
  src.startsWith("blob:") || src.startsWith("data:");

/** Ids of the images that still need uploading on the next save. */
export function localImageIds(state: GalleryState): string[] {
  return state.images.filter((image) => isLocal(image.src)).map((image) => image.id);
}

/**
 * The multipart body for a save: the wall's name (when it's being set), the
 * serialized arrangement, and the photos still held locally.
 *
 * Photos are correlated to their images by position, not by field name. Image
 * ids come from filenames, which can carry spaces and other characters that do
 * not survive a round trip as a multipart field name -- when that happened the
 * server could not match an upload back to its image and quietly left the dead
 * `blob:` src in place, so the wall reopened blank.
 */
export function buildWallFormData({ name, state, filesById }: SaveInput): FormData {
  const form = new FormData();
  if (name !== undefined) form.append("name", name);
  form.append("state", serializeGallery(state));

  const ids = localImageIds(state).filter((id) => filesById[id]);
  form.append("imageIds", JSON.stringify(ids));
  for (const id of ids) form.append("photos", filesById[id]);
  return form;
}

/** Unwrap a BFF response, turning a failure into an Error with its message. */
async function unwrap<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function listWalls(): Promise<WallSummary[]> {
  return unwrap<WallSummary[]>(await fetch("/api/walls", { cache: "no-store" }));
}

export async function getWall(id: string): Promise<WallManifest> {
  return unwrap<WallManifest>(
    await fetch(`/api/walls/${encodeURIComponent(id)}`, { cache: "no-store" }),
  );
}

export async function createWall(input: SaveInput): Promise<WallSummary> {
  return unwrap<WallSummary>(
    await fetch("/api/walls", { method: "POST", body: buildWallFormData(input) }),
  );
}

export async function updateWall(id: string, input: SaveInput): Promise<WallSummary> {
  return unwrap<WallSummary>(
    await fetch(`/api/walls/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: buildWallFormData(input),
    }),
  );
}

export async function deleteWall(id: string): Promise<void> {
  await unwrap<{ message: string }>(
    await fetch(`/api/walls/${encodeURIComponent(id)}`, { method: "DELETE" }),
  );
}
