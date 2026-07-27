import { NextResponse } from "next/server";
import { getFlags } from "@/lib/flags-data";
import { ENVIRONMENTS } from "@/types/flags";

export async function GET() {
  return NextResponse.json({ flags: getFlags(), environments: ENVIRONMENTS });
}
