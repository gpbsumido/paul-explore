import { NextResponse } from "next/server";
import { loadFinance } from "@/lib/operator-bff";

/**
 * Fleet finance: weekly payout history reconciled from sales, with fee
 * transparency. Payouts run weekly, so the newest week is the most recent
 * seven-day window.
 */
export async function GET() {
  return NextResponse.json(await loadFinance());
}
