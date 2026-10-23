/**
 * The real scans, read on the server so /evar's first render already has
 * them and can open on one, instead of fetching the manifest after the page
 * loads and swapping the case under the visitor.
 *
 * This site's own manifest is imported rather than read from disk, because a
 * file under public/ isn't guaranteed to be on disk when the page revalidates
 * on Vercel. A manifest in object storage is fetched, and kept for an hour.
 */

import localManifest from "../../../public/evar/scans/manifest.json";
import { SCANS_BASE_URL, SCANS_MANIFEST_URL, parseManifest, type ScanCase } from "./scans";

export async function loadInitialScans(): Promise<ScanCase[]> {
  try {
    if (/^https?:\/\//i.test(SCANS_BASE_URL)) {
      const res = await fetch(SCANS_MANIFEST_URL, { next: { revalidate: 3600 } });
      return res.ok ? parseManifest(await res.json(), SCANS_BASE_URL) : [];
    }
    return parseManifest(localManifest, SCANS_BASE_URL);
  } catch {
    // The page still works on phantoms, and the browser tries the manifest itself.
    return [];
  }
}
