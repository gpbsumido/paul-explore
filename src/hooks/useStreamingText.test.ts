import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStreamingText } from "./useStreamingText";

/** Create a controllable mock stream that emits SSE-formatted chunks. */
function createTestStream() {
  let controller!: ReadableStreamDefaultController<string>;
  let cancelled = false;

  const stream = new ReadableStream<string>({
    start(c) {
      controller = c;
    },
    cancel() {
      cancelled = true;
    },
  });

  return {
    stream,
    sendEvent(event: string, data: unknown) {
      controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    close() {
      controller.close();
    },
    fail() {
      controller.error(new Error("connection dropped"));
    },
    wasCancelled() {
      return cancelled;
    },
  };
}

describe("useStreamingText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns empty text and isStreaming false initially", () => {
    const { result } = renderHook(() => useStreamingText());

    expect(result.current.text).toBe("");
    expect(result.current.isStreaming).toBe(false);
  });

  it("isStreaming becomes true when start is called", async () => {
    const { result } = renderHook(() => useStreamingText());
    const { stream } = createTestStream();

    await act(async () => {
      result.current.start(stream);
    });

    expect(result.current.isStreaming).toBe(true);
  });

  it("accumulates text_delta tokens into the text string", async () => {
    const { result } = renderHook(() => useStreamingText());
    const mock = createTestStream();

    await act(async () => {
      result.current.start(mock.stream);
    });

    await act(async () => {
      mock.sendEvent("text_delta", { content: "Hello" });
      mock.sendEvent("text_delta", { content: " world" });
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.text).toBe("Hello world");
  });

  it("isStreaming becomes false when stream ends and text is preserved", async () => {
    const { result } = renderHook(() => useStreamingText());
    const mock = createTestStream();

    await act(async () => {
      result.current.start(mock.stream);
    });

    await act(async () => {
      mock.sendEvent("text_delta", { content: "Final answer." });
      await vi.advanceTimersByTimeAsync(50);
    });

    await act(async () => {
      mock.sendEvent("done", {});
      mock.close();
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.text).toBe("Final answer.");
  });

  it("reset clears text and sets isStreaming to false", async () => {
    const { result } = renderHook(() => useStreamingText());
    const mock = createTestStream();

    await act(async () => {
      result.current.start(mock.stream);
    });

    await act(async () => {
      mock.sendEvent("text_delta", { content: "Some text" });
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.text).toBe("Some text");

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.text).toBe("");
    expect(result.current.isStreaming).toBe(false);
  });

  // The hook has no unmount cleanup: the reader is left open and still
  // appends to the buffer. Recorded as a finding; nothing calls this hook yet.
  it.fails("cancels the stream when the component unmounts", async () => {
    const { result, unmount } = renderHook(() => useStreamingText());
    const mock = createTestStream();

    await act(async () => {
      result.current.start(mock.stream);
    });
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(mock.wasCancelled()).toBe(true);
  });

  it("ignores non-text_delta events for text accumulation", async () => {
    const { result } = renderHook(() => useStreamingText());
    const mock = createTestStream();

    await act(async () => {
      result.current.start(mock.stream);
    });

    await act(async () => {
      mock.sendEvent("thinking", { text: "Let me think..." });
      mock.sendEvent("text_delta", { content: "Answer" });
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.text).toBe("Answer");
  });

  it("start() begins from a blank page when a run had already produced text", async () => {
    const { result } = renderHook(() => useStreamingText());
    const first = createTestStream();
    await act(async () => {
      result.current.start(first.stream);
    });
    await act(async () => {
      first.sendEvent("text_delta", { content: "first run" });
      first.close();
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(result.current.text).toBe("first run");

    const second = createTestStream();
    await act(async () => {
      result.current.start(second.stream);
    });
    expect(result.current.text).toBe("");

    await act(async () => {
      second.sendEvent("text_delta", { content: "second run" });
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(result.current.text).toBe("second run");
  });

  it("reset cancels the stream it was reading", async () => {
    const { result } = renderHook(() => useStreamingText());
    const mock = createTestStream();
    await act(async () => {
      result.current.start(mock.stream);
    });

    await act(async () => {
      result.current.reset();
    });

    expect(mock.wasCancelled()).toBe(true);
  });

  it("a stream that errors out stops streaming and keeps what had arrived", async () => {
    const { result } = renderHook(() => useStreamingText());
    const mock = createTestStream();
    await act(async () => {
      result.current.start(mock.stream);
    });
    await act(async () => {
      mock.sendEvent("text_delta", { content: "half an ans" });
      await vi.advanceTimersByTimeAsync(50);
    });

    await act(async () => {
      mock.fail();
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.text).toBe("half an ans");
  });

  it("batches a burst of tokens into one repaint per frame", async () => {
    const scheduleFrame = vi.spyOn(globalThis, "requestAnimationFrame");
    const { result } = renderHook(() => useStreamingText());
    const mock = createTestStream();
    await act(async () => {
      result.current.start(mock.stream);
    });

    await act(async () => {
      mock.sendEvent("text_delta", { content: "a" });
      mock.sendEvent("text_delta", { content: "b" });
      mock.sendEvent("text_delta", { content: "c" });
      await Promise.resolve();
    });
    expect(scheduleFrame).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(result.current.text).toBe("abc");
  });

  // start() never cancels the reader it is replacing, so the old stream keeps
  // writing into the new run's buffer. Recorded as a finding.
  it.fails("a second start() ignores late tokens from the first stream", async () => {
    const { result } = renderHook(() => useStreamingText());
    const first = createTestStream();
    const second = createTestStream();
    await act(async () => {
      result.current.start(first.stream);
    });
    await act(async () => {
      result.current.start(second.stream);
    });

    await act(async () => {
      first.sendEvent("text_delta", { content: "stale" });
      second.sendEvent("text_delta", { content: "fresh" });
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.text).toBe("fresh");
  });
});
