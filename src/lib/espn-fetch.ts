import { fetchUpstream } from "./upstream";

/**
 * GETs an ESPN endpoint, cached for an hour, and returns the parsed body or
 * null. Every ESPN reader treats a failure as "no data" so the page that asked
 * can show its own empty state, rather than one bad response failing the render.
 */
export async function fetchEspnJson(
  url: string,
  headers?: Record<string, string>,
): Promise<unknown | null> {
  const result = await fetchUpstream(url, { next: { revalidate: 3600 }, headers });
  if (!result.ok || !result.response.ok) return null;
  try {
    return await result.response.json();
  } catch {
    // ESPN sometimes answers 200 with an HTML page; that's no data, not a crash.
    return null;
  }
}
