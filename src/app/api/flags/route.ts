import { NextResponse } from "next/server";
import { loadFleet } from "@/lib/flags-bff";

export async function GET() {
  const { flags, environments } = await loadFleet();
  return NextResponse.json({ flags, environments });
}
