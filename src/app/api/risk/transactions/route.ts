import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseBody } from "@/lib/parseBody";

/**
 * Thin proxy in front of the Go risk-scoring service, so the demo on
 * /thoughts/risk-scoring-api can call it same-origin. The backend's URL stays
 * server-side in RISK_API_URL and the browser never deals with CORS.
 */

const riskTransactionBodySchema = z.object({
  id: z.string().optional(),
  user_id: z.string().min(1),
  device_id: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().optional(),
  country: z.string().optional(),
  merchant: z.string().optional(),
});

// POST /api/risk/transactions -> POST {RISK_API_URL}/v1/transactions
export async function POST(request: NextRequest) {
  const base = process.env.RISK_API_URL;
  if (!base) {
    return NextResponse.json(
      { error: "RISK_API_URL is not configured on this deployment" },
      { status: 503 },
    );
  }

  const bodyResult = await parseBody(request, riskTransactionBodySchema);
  if (!bodyResult.ok) return bodyResult.response;

  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/v1/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyResult.data),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const data = await res
      .json()
      .catch(() => ({ error: "risk API returned a non-JSON response" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "risk API unreachable" },
      { status: 502 },
    );
  }
}
