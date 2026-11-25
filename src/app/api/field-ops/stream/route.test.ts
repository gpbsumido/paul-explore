import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

async function readFirstChunk(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const { value } = await reader.read();
  await reader.cancel();
  return new TextDecoder().decode(value);
}

describe("GET /api/field-ops/stream", () => {
  it("answers as an event stream that is never cached", async () => {
    const response = await GET(new NextRequest("http://localhost/api/field-ops/stream"));
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toContain("no-cache");
    await response.body!.cancel();
  });

  it("sends a reconnect hint and an update frame straight away, so the console never starts blank", async () => {
    const response = await GET(new NextRequest("http://localhost/api/field-ops/stream"));
    const firstChunk = await readFirstChunk(response);
    expect(firstChunk).toContain("retry:");
    expect(firstChunk).toContain("event: update");
    expect(firstChunk).toContain('"tracks"');
  });
});
