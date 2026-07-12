import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockStream, SCENARIOS } from "./mock-stream";
import { createSSEParser } from "./sse-parser";
import type { SSEEvent } from "./types";

/** Drain all events from a mock stream by advancing fake timers. */
async function drainStream(
  stream: ReadableStream<string>,
  advanceMs = 5000,
): Promise<readonly SSEEvent[]> {
  const parser = createSSEParser();
  const events: SSEEvent[] = [];
  const reader = stream.getReader();

  const readAll = (async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      events.push(...parser.feed(value));
    }
  })();

  // advance timers enough for the scenario to complete
  await vi.advanceTimersByTimeAsync(advanceMs);
  await readAll;

  return events;
}

/** Collect events until the stream pauses (no new events for a while). */
async function drainUntilPause(
  stream: ReadableStream<string>,
  stepMs = 100,
  steps = 30,
): Promise<{
  events: SSEEvent[];
  reader: ReadableStreamDefaultReader<string>;
}> {
  const parser = createSSEParser();
  const events: SSEEvent[] = [];
  const reader = stream.getReader();
  const readLoop = (async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      events.push(...parser.feed(value));
    }
  })();

  for (let i = 0; i < steps; i++) {
    await vi.advanceTimersByTimeAsync(stepMs);
  }

  // don't await readLoop here — it's still waiting for more data
  void readLoop;

  return { events, reader };
}

describe("createMockStream", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("simple scenario produces thinking, text_delta, and done events", async () => {
    const { stream } = createMockStream("simple");
    const events = await drainStream(stream);

    const types = events.map((e) => e.event);
    expect(types).toContain("thinking");
    expect(types).toContain("text_delta");
    expect(types[types.length - 1]).toBe("done");
  });

  it("tool_calls scenario produces thinking, text, tool events, more text, done", async () => {
    const { stream } = createMockStream("tool_calls");
    const events = await drainStream(stream);

    const types = events.map((e) => e.event);
    expect(types).toContain("thinking");
    expect(types).toContain("text_delta");
    expect(types).toContain("tool_use_start");
    expect(types).toContain("tool_result");
    expect(types[types.length - 1]).toBe("done");

    // tool_use_start comes before tool_result
    const toolStartIdx = types.indexOf("tool_use_start");
    const toolResultIdx = types.indexOf("tool_result");
    expect(toolStartIdx).toBeLessThan(toolResultIdx);
  });

  it("thinking scenario produces extended thinking then text then done", async () => {
    const { stream } = createMockStream("thinking");
    const events = await drainStream(stream);

    const types = events.map((e) => e.event);
    const thinkingCount = types.filter((t) => t === "thinking").length;
    expect(thinkingCount).toBeGreaterThan(2);
    expect(types).toContain("text_delta");
    expect(types[types.length - 1]).toBe("done");

    // all thinking events come before any text_delta
    const lastThinking = types.lastIndexOf("thinking");
    const firstText = types.indexOf("text_delta");
    expect(lastThinking).toBeLessThan(firstText);
  });

  it("approval scenario pauses at approval_request and resumes on resume()", async () => {
    const { stream, resume } = createMockStream("approval");

    // drain until paused — reuse the returned reader
    const { events: beforeEvents, reader } = await drainUntilPause(stream);
    const beforeTypes = beforeEvents.map((e) => e.event);
    expect(beforeTypes).toContain("text_delta");
    expect(beforeTypes).toContain("approval_request");
    // no done event yet — stream is paused
    expect(beforeTypes).not.toContain("done");

    // resume the stream
    resume();

    // drain the rest using the same reader
    const parser = createSSEParser();
    const afterEvents: SSEEvent[] = [];

    const readRest = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        afterEvents.push(...parser.feed(value));
      }
    })();

    await vi.advanceTimersByTimeAsync(5000);
    await readRest;

    const afterTypes = afterEvents.map((e) => e.event);
    expect(afterTypes).toContain("text_delta");
    expect(afterTypes[afterTypes.length - 1]).toBe("done");
  });

  it("error_recovery scenario produces text, error, recovery text, done", async () => {
    const { stream } = createMockStream("error_recovery");
    const events = await drainStream(stream);

    const types = events.map((e) => e.event);
    expect(types).toContain("text_delta");
    expect(types).toContain("error");
    expect(types[types.length - 1]).toBe("done");

    // error comes after some text
    const firstText = types.indexOf("text_delta");
    const errorIdx = types.indexOf("error");
    expect(firstText).toBeLessThan(errorIdx);

    // more text after error (recovery)
    const textAfterError = types.slice(errorIdx + 1).includes("text_delta");
    expect(textAfterError).toBe(true);
  });

  it("cancelling the stream reader stops producing events", async () => {
    const { stream } = createMockStream("simple");
    const reader = stream.getReader();
    const parser = createSSEParser();
    const events: SSEEvent[] = [];

    // read a couple of events
    await vi.advanceTimersByTimeAsync(100);
    const { value } = await reader.read();
    if (value) events.push(...parser.feed(value));

    // cancel
    await reader.cancel();

    // advance more — should not throw or produce events
    await vi.advanceTimersByTimeAsync(5000);
    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThan(20);
  });

  it("SCENARIOS array has 5 entries with id, label, and description", () => {
    expect(SCENARIOS).toHaveLength(5);
    for (const s of SCENARIOS) {
      expect(typeof s.id).toBe("string");
      expect(typeof s.label).toBe("string");
      expect(typeof s.description).toBe("string");
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    }
  });
});
