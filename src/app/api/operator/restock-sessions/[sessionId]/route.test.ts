import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/operator-bff", () => ({ loadRestockSession: vi.fn() }));

import { loadRestockSession } from "@/lib/operator-bff";
import { GET } from "./route";

const request = () => new NextRequest("http://localhost/api/operator/restock-sessions/s1");
const params = (sessionId: string) => ({ params: Promise.resolve({ sessionId }) });

afterEach(() => vi.clearAllMocks());

describe("GET /api/operator/restock-sessions/:sessionId", () => {
  it("looks the session up by the id in the path and returns it with its lines", async () => {
    const found = {
      session: { id: "restock-77", storeId: "st-1", status: "open" },
      lines: [{ itemId: "i-1", counted: 4 }],
    };
    vi.mocked(loadRestockSession).mockResolvedValue(
      found as unknown as Awaited<ReturnType<typeof loadRestockSession>>,
    );

    const res = await GET(request(), params("restock-77"));

    expect(loadRestockSession).toHaveBeenCalledWith("restock-77");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(found);
  });

  it("answers 404 with a message when there is no such session", async () => {
    vi.mocked(loadRestockSession).mockResolvedValue(undefined);

    const res = await GET(request(), params("missing"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Restock session not found" });
  });
});
