import type { SSEEvent } from "./types";

/**
 * Creates a stateful SSE parser that handles chunked input.
 * Call `feed(chunk)` with each chunk of text from the stream.
 * Returns parsed SSE events for each call, carrying incomplete
 * data across chunk boundaries in an internal buffer.
 */
export function createSSEParser() {
  // Only the unfinished last line waits here between chunks.
  let buffer = "";
  // The event being assembled lives across chunks too, so a chunk that ends
  // between two lines of one event does not drop what came before.
  let eventType = "message";
  let dataLines: string[] = [];
  let id: string | undefined;
  let retry: number | undefined;

  function feed(chunk: string): readonly SSEEvent[] {
    buffer += chunk;
    const events: SSEEvent[] = [];

    // The text after the last newline is a line that has not finished arriving.
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      // blank line signals end of an event
      if (line === "") {
        if (dataLines.length > 0) {
          const event: SSEEvent = {
            event: eventType,
            data: dataLines.join("\n"),
          };
          if (id !== undefined) (event as Record<string, unknown>).id = id;
          if (retry !== undefined)
            (event as Record<string, unknown>).retry = retry;

          events.push(event);
        }

        // reset for next event
        eventType = "message";
        dataLines = [];
        id = undefined;
        retry = undefined;
        continue;
      }

      // comment lines — ignore
      if (line.startsWith(":")) continue;

      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const field = line.slice(0, colonIdx);
      // value starts after the colon, strip one leading space if present
      const raw = line.slice(colonIdx + 1);
      const value = raw.startsWith(" ") ? raw.slice(1) : raw;

      switch (field) {
        case "event":
          eventType = value;
          break;
        case "data":
          dataLines.push(value);
          break;
        case "id":
          id = value;
          break;
        case "retry":
          retry = parseInt(value, 10);
          break;
      }
    }

    return events;
  }

  return { feed };
}
