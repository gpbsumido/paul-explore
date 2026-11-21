import { NextResponse } from "next/server";
import { loadFleet } from "@/lib/flags-bff";

export async function GET() {
  return NextResponse.json(await loadFleet());
}
