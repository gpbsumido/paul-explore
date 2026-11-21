import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/operator-bff", () => ({ loadPromotionPerformance: vi.fn() }));

import { loadPromotionPerformance } from "@/lib/operator-bff";
import { promotionPerformanceSchema } from "@/lib/operator-schemas";
import { GET } from "./route";

const params = (promotionId: string) => ({ params: Promise.resolve({ promotionId }) });
const ask = (promotionId: string) =>
  GET(new NextRequest(`http://localhost/api/operator/promotions/${promotionId}/performance`), params(promotionId));

afterEach(() => vi.clearAllMocks());

describe("GET /api/operator/promotions/:promotionId/performance", () => {
  it("answers with the performance for the promotion in the path", async () => {
    const performance = promotionPerformanceSchema.parse({
      promotion: {
        id: "promo-1",
        storeId: "store-1",
        productName: "Cola",
        percent: 20,
        startsAt: "2026-05-01T00:00:00Z",
        endsAt: "2026-05-08T00:00:00Z",
        status: "ended",
      },
      window: { units: 40, revenue: 120 },
      baseline: { units: 25, revenue: 80 },
      unitsChangePercent: 60,
      revenueChangePercent: 50,
      measuredFrom: "2026-05-01T00:00:00Z",
      measuredTo: "2026-05-08T00:00:00Z",
      note: "A before-and-after, not attribution.",
    });
    vi.mocked(loadPromotionPerformance).mockResolvedValue(performance);

    const res = await ask("promo-1");

    expect(loadPromotionPerformance).toHaveBeenCalledWith("promo-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(performance);
  });

  it("answers 404 when there is no such promotion", async () => {
    vi.mocked(loadPromotionPerformance).mockResolvedValue(undefined);

    const res = await ask("gone");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Promotion not found" });
  });

  it("lets a failure to load surface instead of reporting the promotion as missing", async () => {
    vi.mocked(loadPromotionPerformance).mockRejectedValue(new Error("operator API down"));

    await expect(ask("promo-1")).rejects.toThrow("operator API down");
  });
});
