import type { SSEEvent } from "./types";

/**
 * Creates a stateful SSE parser that handles chunked input.
 * Call `feed(chunk)` with each chunk of text from the stream.
 * Returns parsed SSE events for each call, carrying incomplete
 * data across chunk boundaries in an internal buffer.
 */
export function createSSEParser() {
  let buffer = "";

  function feed(chunk: string): readonly SSEEvent[] {
    buffer += chunk;
    const events: SSEEvent[] = [];

    // split on newlines but keep processing — a blank line (\n\n) ends an event
    const lines = buffer.split("\n");

    let eventType = "message";
    let dataLines: string[] = [];
    let id: string | undefined;
    let retry: number | undefined;
    let lastEventEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

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
        lastEventEnd = i;
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

    // keep unconsumed data in the buffer for the next chunk
    if (lastEventEnd >= 0) {
      buffer = lines.slice(lastEventEnd + 1).join("\n");
    }

    return events;
  }

  return { feed };
}
