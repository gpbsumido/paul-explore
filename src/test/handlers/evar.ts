import { http, HttpResponse } from "msw";
import manifest from "../../../public/evar/scans/manifest.json";

/**
 * Defaults for the EVAR endpoints pages call on load. No hand-set reference
 * answers, so every case scores against its phantom geometry, an empty
 * study, and the scan manifest this site ships, unless a test says otherwise.
 */
export const evarHandlers = [
  http.get("/api/evar/references", () => HttpResponse.json({ references: [] })),
  // The real scans' manifest, as this site serves it, so the case list has them.
  http.get("/evar/scans/manifest.json", () => HttpResponse.json(manifest)),
  http.get("/api/evar/admin/export", () => HttpResponse.json({ participants: [], attempts: [] })),
];
