import type { NextRequest } from "next/server";
import { simulateFieldOps } from "@/lib/field-ops/sim";

export const dynamic = "force-dynamic";

const NORMAL_TICK_MS = 1_000;
const LOW_BANDWIDTH_TICK_MS = 5_000;
// Closed on purpose before a serverless time limit; EventSource reconnects on its own.
const STREAM_LIFETIME_MS = 55_000;
const RECONNECT_DELAY_MS = 2_000;

/** GET /api/field-ops/stream: server-sent updates. `?rate=low` slows it to one every 5s. */
export async function GET(request: NextRequest) {
  const tickMs =
    request.nextUrl.searchParams.get("rate") === "low" ? LOW_BANDWIDTH_TICK_MS : NORMAL_TICK_MS;
  const encoder = new TextEncoder();
  let stopStream = () => {};

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const sendUpdate = (prefix = "") => {
        const frame = `${prefix}event: update\ndata: ${JSON.stringify(simulateFieldOps(Date.now()))}\n\n`;
        controller.enqueue(encoder.encode(frame));
      };
      sendUpdate(`retry: ${RECONNECT_DELAY_MS}\n`);
      const tickTimer = setInterval(sendUpdate, tickMs);
      const lifetimeTimer = setTimeout(() => {
        stopStream();
        controller.close();
      }, STREAM_LIFETIME_MS);
      stopStream = () => {
        clearInterval(tickTimer);
        clearTimeout(lifetimeTimer);
      };
    },
    cancel() {
      stopStream();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
