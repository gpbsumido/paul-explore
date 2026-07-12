import { useState, useRef, useCallback } from "react";
import { createSSEParser } from "@/lib/agent/sse-parser";

type StreamingTextResult = {
  readonly text: string;
  readonly isStreaming: boolean;
  readonly start: (stream: ReadableStream<string>) => void;
  readonly reset: () => void;
};

/**
 * Hook that consumes a ReadableStream of SSE-formatted text,
 * accumulates text_delta tokens, and batches DOM updates via
 * requestAnimationFrame to prevent per-token re-renders.
 */
export function useStreamingText(): StreamingTextResult {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const bufferRef = useRef("");
  const rafRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    setText(bufferRef.current);
    rafRef.current = null;
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(flush);
    }
  }, [flush]);

  const start = useCallback(
    (stream: ReadableStream<string>) => {
      bufferRef.current = "";
      setText("");
      setIsStreaming(true);

      const parser = createSSEParser();
      const reader = stream.getReader();
      readerRef.current = reader;

      const read = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const events = parser.feed(value);
            for (const event of events) {
              if (event.event === "text_delta") {
                const parsed = JSON.parse(event.data) as { content: string };
                bufferRef.current += parsed.content;
              }
            }
            scheduleFlush();
          }
        } catch {
          // reader was cancelled
        }

        setIsStreaming(false);
        flush();
      };

      void read();
    },
    [flush, scheduleFlush],
  );

  const reset = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    readerRef.current?.cancel().catch(() => {});
    readerRef.current = null;

    bufferRef.current = "";
    setText("");
    setIsStreaming(false);
  }, []);

  return { text, isStreaming, start, reset };
}
