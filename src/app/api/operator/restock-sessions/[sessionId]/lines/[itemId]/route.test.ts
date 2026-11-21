import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import type { RestockLine } from "@/types/operator";

vi.mock("@/lib/operator-bff", () => ({ saveRestockLine: vi.fn() }));

import { saveRestockLine } from "@/lib/operator-bff";
import { OperatorServiceTokenError } from "@/lib/operator-route-errors";
import { PUT } from "./route";

const params = Promise.resolve({ sessionId: "session-1", itemId: "item-9" });

function putRequest(body: unknown): NextRequest {
  return new NextRequest(
    "http://localhost/api/operator/restock-sessions/session-1/lines/item-9",
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

const validBody = {
  expectedQty: 8,
  countedQty: 5,
  added: 4,
  removed: 2,
  removalReason: "expired",
};

const savedLine: RestockLine = {
  id: "line-1",
  sessionId: "session-1",
  itemId: "item-9",
  ...validBody,
  resultingStock: 7,
  countStatus: "correction",
};

beforeEach(() => vi.clearAllMocks());

describe("PUT /api/operator/restock-sessions/:sessionId/lines/:itemId", () => {
  it("saves the slot and returns the stored line", async () => {
    vi.mocked(saveRestockLine).mockResolvedValue(savedLine);

    const res = await PUT(putRequest(validBody), { params });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ line: savedLine });
    expect(saveRestockLine).toHaveBeenCalledWith(
      "session-1",
      "item-9",
      validBody,
    );
  });

  it("refuses to take stock off a shelf without a reason, and does not save", async () => {
    const res = await PUT(
      putRequest({ ...validBody, removed: 2, removalReason: null }),
      { params },
    );

    expect(res.status).toBe(400);
    expect(saveRestockLine).not.toHaveBeenCalled();
  });

  it("lets a slot with nothing removed carry no reason", async () => {
    vi.mocked(saveRestockLine).mockResolvedValue(savedLine);

    const res = await PUT(
      putRequest({ ...validBody, removed: 0, removalReason: null }),
      { params },
    );

    expect(res.status).toBe(200);
  });

  it("rejects a body that is not a restock line", async () => {
    const res = await PUT(putRequest({ expectedQty: "lots" }), { params });

    expect(res.status).toBe(400);
    expect(saveRestockLine).not.toHaveBeenCalled();
  });

  it("answers 404 when there is no such session", async () => {
    vi.mocked(saveRestockLine).mockResolvedValue(undefined);

    const res = await PUT(putRequest(validBody), { params });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Restock session not found" });
  });

  it("answers 503 with the config hint when the service token is wrong", async () => {
    vi.mocked(saveRestockLine).mockRejectedValue(
      new OperatorServiceTokenError(401),
    );

    const res = await PUT(putRequest(validBody), { params });

    expect(res.status).toBe(503);
    expect(res.headers.get("x-operator-config")).toBe("token-mismatch");
  });
});
