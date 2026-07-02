import { NextResponse } from "next/server";
import { getStores } from "@/lib/operator-data";

export async function GET() {
  const stores = getStores();
  return NextResponse.json({ stores });
}
