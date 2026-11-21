import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/operator-bff", () => ({
  loadPromotions: vi.fn(),
  createPromotion: vi.fn(),
}));

import { loadPromotions, createPromotion } from "@/lib/operator-bff";
import { OperatorApiError } from "@/lib/operator-client";
import { OperatorServiceTokenError } from "@/lib/operator-route-errors";
import { promotionSchema } from "@/lib/operator-schemas";
import { GET, POST } from "./route";

const params = (storeId: string) => ({ params: Promise.resolve({ storeId }) });

const promotionBody = {
  productName: "Cola",
  percent: 20,
  startsAt: "2026-05-01T00:00:00Z",
  endsAt: "2026-05-08T00:00:00Z",
};

const post = (body: unknown, storeId = "store-1") =>
  POST(
    new NextRequest(`http://localhost/api/operator/stores/${storeId}/promotions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    params(storeId),
  );

afterEach(() => vi.clearAllMocks());

describe("GET /api/operator/stores/:storeId/promotions", () => {
  it("lists the promotions for the store in the path", async () => {
    const promotions = [
      promotionSchema.parse({ id: "p1", storeId: "store-1", ...promotionBody, status: "active" }),
    ];
    vi.mocked(loadPromotions).mockResolvedValue(promotions);

    const res = await GET(new NextRequest("http://localhost/x"), params("store-1"));

    expect(loadPromotions).toHaveBeenCalledWith("store-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ promotions });
  });
});

describe("POST /api/operator/stores/:storeId/promotions", () => {
  it("schedules the promotion and answers 201 with it", async () => {
    const promotion = promotionSchema.parse({
      id: "p9",
      storeId: "store-1",
      ...promotionBody,
      status: "scheduled",
    });
    vi.mocked(createPromotion).mockResolvedValue(promotion);

    const res = await post(promotionBody);

    expect(createPromotion).toHaveBeenCalledWith("store-1", promotionBody);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ promotion });
  });

  it("accepts an open-ended promotion for the whole store", async () => {
    vi.mocked(createPromotion).mockResolvedValue(undefined);

    await post({ ...promotionBody, productName: null, endsAt: null });

    expect(createPromotion).toHaveBeenCalledWith("store-1", {
      ...promotionBody,
      productName: null,
      endsAt: null,
    });
  });

  it("answers 404 when the store doesn't exist", async () => {
    vi.mocked(createPromotion).mockResolvedValue(undefined);

    const res = await post(promotionBody, "no-such-store");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Store not found" });
  });

  it.each([
    ["a discount of 0%", { ...promotionBody, percent: 0 }],
    ["a discount over 90%", { ...promotionBody, percent: 91 }],
    ["a fractional discount", { ...promotionBody, percent: 12.5 }],
    ["an end that isn't after the start", { ...promotionBody, endsAt: promotionBody.startsAt }],
    ["an end before the start", { ...promotionBody, endsAt: "2026-04-01T00:00:00Z" }],
    ["a blank product name", { ...promotionBody, productName: "" }],
    ["no start", { ...promotionBody, startsAt: undefined }],
  ])("answers 400 for %s and schedules nothing", async (_label, body) => {
    const res = await post(body);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid request body" });
    expect(createPromotion).not.toHaveBeenCalled();
  });

  it("answers 400 when the body isn't JSON", async () => {
    const res = await post("not json");

    expect(res.status).toBe(400);
    expect(createPromotion).not.toHaveBeenCalled();
  });

  it("tells the caller to fix the token when the API rejects the service token", async () => {
    vi.mocked(createPromotion).mockRejectedValue(new OperatorServiceTokenError(401));

    const res = await post(promotionBody);

    expect(res.status).toBe(503);
    expect(res.headers.get("x-operator-config")).toBe("token-mismatch");
  });

  it("passes the API's own 4xx on a write straight through, and calls a 5xx a bad gateway", async () => {
    vi.mocked(createPromotion).mockRejectedValueOnce(new OperatorApiError(409));
    expect((await post(promotionBody)).status).toBe(409);

    vi.mocked(createPromotion).mockRejectedValueOnce(new OperatorApiError(500));
    expect((await post(promotionBody)).status).toBe(502);
  });
});
