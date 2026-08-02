import { NextResponse } from "next/server";
import { loadStores } from "@/lib/operator-bff";

export async function GET() {
  return NextResponse.json({ stores: await loadStores() });
}
