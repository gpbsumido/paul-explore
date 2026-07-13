import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStreamingText } from "./useStreamingText";

/** Create a controllable mock stream that emits SSE-formatted chunks. */
function createTestStream() {
  let controller!: ReadableStreamDefaultController<string>;

  const stream = new ReadableStream<string>({
    start(c) {
      controller = c;
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
  };
}

describe("useStreamingText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
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

  it("cleans up the stream reader on unmount", async () => {
    const { result, unmount } = renderHook(() => useStreamingText());
    const mock = createTestStream();

    await act(async () => {
      result.current.start(mock.stream);
    });

    await act(async () => {
      mock.sendEvent("text_delta", { content: "partial" });
      await vi.advanceTimersByTimeAsync(50);
    });

    // unmount should not throw and should cancel the reader
    unmount();

    // sending more events after unmount should not throw
    expect(() => {
      mock.sendEvent("text_delta", { content: " more" });
    }).not.toThrow();
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
});
