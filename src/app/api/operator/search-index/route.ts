import { NextResponse } from "next/server";
import { loadSearchIndex } from "@/lib/operator-bff";

/**
 * The quick-search index: stores and distinct fleet product names, for the
 * operator search combobox to rank locally as the operator types.
 */
export async function GET() {
  return NextResponse.json(await loadSearchIndex());
}
