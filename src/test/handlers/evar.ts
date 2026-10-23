import { http, HttpResponse } from "msw";

/**
 * The EVAR page asks for hand-set reference answers on load. None is the
 * default, so every case scores against its phantom geometry unless a test
 * says otherwise.
 */
export const evarHandlers = [http.get("/api/evar/references", () => HttpResponse.json({ references: [] }))];
