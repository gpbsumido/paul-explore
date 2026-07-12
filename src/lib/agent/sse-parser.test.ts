import { describe, it, expect } from "vitest";
import { createSSEParser } from "./sse-parser";

describe("createSSEParser", () => {
  it("parses a single complete SSE event with default event type", () => {
    const parser = createSSEParser();
    const events = parser.feed('data: {"token":"hello"}\n\n');

    expect(events).toEqual([{ event: "message", data: '{"token":"hello"}' }]);
  });

  it("parses the event: field to set the event type", () => {
    const parser = createSSEParser();
    const events = parser.feed('event: text_delta\ndata: {"content":"hi"}\n\n');

    expect(events).toEqual([{ event: "text_delta", data: '{"content":"hi"}' }]);
  });

  it("parses multi-line data fields joined with newlines", () => {
    const parser = createSSEParser();
    const events = parser.feed(
      "data: line one\ndata: line two\ndata: line three\n\n",
    );

    expect(events).toEqual([
      { event: "message", data: "line one\nline two\nline three" },
    ]);
  });

  it("parses the id: field", () => {
    const parser = createSSEParser();
    const events = parser.feed("id: 42\ndata: hello\n\n");

    expect(events).toEqual([{ event: "message", data: "hello", id: "42" }]);
  });

  it("parses the retry: field as a number", () => {
    const parser = createSSEParser();
    const events = parser.feed("retry: 3000\ndata: reconnect\n\n");

    expect(events).toEqual([
      { event: "message", data: "reconnect", retry: 3000 },
    ]);
  });

  it("ignores comment lines starting with :", () => {
    const parser = createSSEParser();
    const events = parser.feed(": this is a comment\ndata: hello\n\n");

    expect(events).toEqual([{ event: "message", data: "hello" }]);
  });

  it("handles multiple events in a single chunk", () => {
    const parser = createSSEParser();
    const events = parser.feed(
      'data: {"a":1}\n\nevent: custom\ndata: {"b":2}\n\n',
    );

    expect(events).toEqual([
      { event: "message", data: '{"a":1}' },
      { event: "custom", data: '{"b":2}' },
    ]);
  });

  it("handles an event split across two chunks", () => {
    const parser = createSSEParser();

    const first = parser.feed("event: text_del");
    expect(first).toEqual([]);

    const second = parser.feed('ta\ndata: {"content":"hello"}\n\n');
    expect(second).toEqual([
      { event: "text_delta", data: '{"content":"hello"}' },
    ]);
  });

  it("returns an empty array for incomplete chunks", () => {
    const parser = createSSEParser();
    const events = parser.feed("data: partial");

    expect(events).toEqual([]);
  });

  it("handles the [DONE] sentinel as regular data", () => {
    const parser = createSSEParser();
    const events = parser.feed("data: [DONE]\n\n");

    expect(events).toEqual([{ event: "message", data: "[DONE]" }]);
  });

  it("handles data fields with no value after the colon", () => {
    const parser = createSSEParser();
    const events = parser.feed("data:\n\n");

    expect(events).toEqual([{ event: "message", data: "" }]);
  });

  it("resets event type to default between events", () => {
    const parser = createSSEParser();
    const events = parser.feed(
      "event: custom\ndata: first\n\ndata: second\n\n",
    );

    expect(events[0].event).toBe("custom");
    expect(events[1].event).toBe("message");
  });
});
