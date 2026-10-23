import { http, HttpResponse } from "msw";

/**
 * Defaults for the EVAR endpoints pages call on load. No hand-set reference
 * answers, so every case scores against its phantom geometry, and an empty
 * study, unless a test says otherwise.
 */
export const evarHandlers = [
  http.get("/api/evar/references", () => HttpResponse.json({ references: [] })),
  http.get("/api/evar/admin/export", () => HttpResponse.json({ participants: [], attempts: [] })),
];
